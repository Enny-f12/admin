// store/useMorningCountStore.ts
//
// Combines all Morning Count–related stores into one file:
//   - useMorningCountStore        (the count sheet itself: fetch, edit, submit, resync)
//   - useMorningCountAlertsStore  (Super Admin 9am overdue-branch banner)
//   - useAuditLogStore            (Super Admin read-only staff audit log + export)
//
// useMenuStore stays in its own file (store/useMenuStore.ts) — untouched.
import { create } from 'zustand';
import { toast } from 'sonner';
import { morningCountService } from '@/services/morning-count.service';
import {
  MorningCountSheet,
  MorningCountCategory,
  MorningCountAlertResponse,
  MorningCountAuditEntryResponse,
  AuditLogFilters,
} from '@/types/morning-count.types';

function extractErrorMessage(error: unknown, fallback: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyErr = error as any;
  return anyErr?.response?.data?.message ?? anyErr?.message ?? fallback;
}

// ============================================================================
// useMorningCountStore — the count sheet: fetch, edit items, save draft,
// submit categories, resync against the live menu.
// ============================================================================

// Dedupe concurrent fetchSheet calls for the same (outletId, date). Guards
// against React StrictMode's dev-only double-invoke of effects on
// client-side navigation. Kept as module-level closures, not store state,
// so it doesn't trigger extra re-renders.
let inFlightKey: string | null = null;
let inFlightPromise: Promise<void> | null = null;

interface MorningCountState {
  sheet: MorningCountSheet | null;
  sheetLoading: boolean;
  sheetError: boolean;

  selectedCategoryId: string | null;
  isSavingDraft: boolean;
  isResyncing: boolean;

  // Item ids with a current-quantity save in flight — drives a per-row
  // loader while a Pending item is on its way to becoming Updated.
  updatingItemIds: Record<string, boolean>;

  fetchSheet: (outletId: string, date: string) => Promise<void>;
  refreshSheetSilently: (outletId: string, date: string) => Promise<void>;
  // POST /admin/morning-count/sheet/:sheetId/resync-menu. Merges in menu
  // items added/removed since this sheet was generated, without touching
  // already-submitted categories. Called automatically right after a
  // successful fetchSheet, and also exposed for a manual "Sync menu" button.
  resyncMenu: () => Promise<void>;
  selectCategory: (categoryId: string) => void;
  selectedCategory: () => MorningCountCategory | null;
  updateItemCurrent: (itemId: string, current: number | null) => Promise<void>;
  updateItemUom: (itemId: string, unit: string, packSize: string) => Promise<boolean>;
  saveDraft: () => Promise<void>;
  submitCategory: (categoryId: string) => Promise<boolean>;
  submitSelectedCategory: () => Promise<boolean>;
}

export const useMorningCountStore = create<MorningCountState>()((set, get) => ({
  sheet: null,
  sheetLoading: false,
  sheetError: false,

  selectedCategoryId: null,
  isSavingDraft: false,
  isResyncing: false,

  updatingItemIds: {},

  fetchSheet: async (outletId, date) => {
    const key = `${outletId}:${date}`;

    if (inFlightKey === key && inFlightPromise) {
      return inFlightPromise;
    }

    set({ sheetLoading: true, sheetError: false });
    inFlightKey = key;

    inFlightPromise = (async () => {
      try {
        const sheet = await morningCountService.getSheet(outletId, date);
        set({ sheet, selectedCategoryId: sheet.categories[0]?.id ?? null, sheetLoading: false });
        // Fire-and-forget: pull in any menu items added since this sheet
        // was generated. Safe to always run — it never touches submitted
        // categories, only adds Pending rows for new items and hides
        // items that dropped off the live menu.
        get().resyncMenu();
      } catch (error) {
        set({ sheetLoading: false, sheetError: true });
        toast.error(extractErrorMessage(error, 'Could not load count sheet.'));
      } finally {
        if (inFlightKey === key) {
          inFlightKey = null;
          inFlightPromise = null;
        }
      }
    })();

    return inFlightPromise;
  },

  refreshSheetSilently: async (outletId, date) => {
    const key = `${outletId}:${date}`;

    if (inFlightKey === key && inFlightPromise) {
      return inFlightPromise;
    }

    inFlightKey = key;

    inFlightPromise = (async () => {
      try {
        const sheet = await morningCountService.getSheet(outletId, date);
        set((state) => ({
          sheet,
          selectedCategoryId:
            state.selectedCategoryId && sheet.categories.some((c) => c.id === state.selectedCategoryId)
              ? state.selectedCategoryId
              : sheet.categories[0]?.id ?? null,
        }));
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // Silent by design — the primary mutation already reported its
        // own success/error.
      } finally {
        if (inFlightKey === key) {
          inFlightKey = null;
          inFlightPromise = null;
        }
      }
    })();

    return inFlightPromise;
  },

  resyncMenu: async () => {
    const { sheet } = get();
    if (!sheet) return;
    set({ isResyncing: true });
    try {
      const updated = await morningCountService.resyncMenu(sheet.id);
      set((state) => ({
        isResyncing: false,
        sheet: updated,
        selectedCategoryId:
          state.selectedCategoryId && updated.categories.some((c) => c.id === state.selectedCategoryId)
            ? state.selectedCategoryId
            : updated.categories[0]?.id ?? null,
      }));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      set({ isResyncing: false });
      // Silent on the automatic call (fired right after fetchSheet) — a
      // failed background resync shouldn't block or alarm the user who
      // is just trying to do their count. A manual "Sync menu" button
      // can catch this promise itself and show its own toast if needed.
    }
  },

  selectCategory: (categoryId) => set({ selectedCategoryId: categoryId }),

  selectedCategory: () => {
    const { sheet, selectedCategoryId } = get();
    if (!sheet || !selectedCategoryId) return null;
    return sheet.categories.find((c) => c.id === selectedCategoryId) ?? null;
  },

  updateItemCurrent: async (itemId, current) => {
    const { sheet } = get();
    if (!sheet) return;

    const prevSheet = sheet;
    set((state) => ({
      sheet: {
        ...sheet,
        categories: sheet.categories.map((cat) => ({
          ...cat,
          items: cat.items.map((item) => (item.id === itemId ? { ...item, current } : item)),
        })),
      },
      updatingItemIds: { ...state.updatingItemIds, [itemId]: true },
    }));

    try {
      const updated = await morningCountService.updateItemCurrent(sheet.id, itemId, { current });
      set((state) => {
        if (!state.sheet) return state;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [itemId]: _removed, ...restUpdating } = state.updatingItemIds;
        return {
          sheet: {
            ...state.sheet,
            categories: state.sheet.categories.map((cat) => ({
              ...cat,
              items: cat.items.map((item) => (item.id === itemId ? updated : item)),
            })),
          },
          updatingItemIds: restUpdating,
        };
      });
    } catch (error) {
      set((state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [itemId]: _removed, ...restUpdating } = state.updatingItemIds;
        return { sheet: prevSheet, updatingItemIds: restUpdating };
      });
      toast.error(extractErrorMessage(error, 'Could not update count.'));
    }
  },

  updateItemUom: async (itemId, unit, packSize) => {
    const { sheet } = get();
    if (!sheet) return false;
    try {
      const updated = await morningCountService.updateItemUom(sheet.id, itemId, { unit, packSize });
      set((state) => {
        if (!state.sheet) return state;
        return {
          sheet: {
            ...state.sheet,
            categories: state.sheet.categories.map((cat) => ({
              ...cat,
              items: cat.items.map((item) => (item.id === itemId ? updated : item)),
            })),
          },
        };
      });
      get().refreshSheetSilently(sheet.outletId, sheet.date);
      return true;
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Could not update unit/pack size.'));
      return false;
    }
  },

  saveDraft: async () => {
    const { sheet } = get();
    if (!sheet) return;
    set({ isSavingDraft: true });
    try {
      const { draftSavedAt } = await morningCountService.saveDraft(sheet.id);
      set((state) => ({
        sheet: state.sheet ? { ...state.sheet, draftSavedAt } : state.sheet,
        isSavingDraft: false,
      }));
      toast.success('Draft saved.');
    } catch (error) {
      set({ isSavingDraft: false });
      toast.error(extractErrorMessage(error, 'Could not save draft.'));
    }
  },

  submitCategory: async (categoryId) => {
    const { sheet } = get();
    if (!sheet) return false;
    try {
      const updatedCategory = await morningCountService.submitCategory(sheet.id, categoryId);
      set((state) => {
        if (!state.sheet) return state;
        return {
          sheet: {
            ...state.sheet,
            categories: state.sheet.categories.map((cat) => (cat.id === categoryId ? updatedCategory : cat)),
          },
        };
      });
      toast.success(`${updatedCategory.name} submitted.`);
      return true;
    } catch (error) {
      toast.error(extractErrorMessage(error, 'All items must be counted before submitting.'));
      return false;
    }
  },

  submitSelectedCategory: async () => {
    const { selectedCategoryId, submitCategory } = get();
    if (!selectedCategoryId) return false;
    return submitCategory(selectedCategoryId);
  },
}));

// ============================================================================
// useMorningCountAlertsStore — Super Admin 9am overdue-branch banner.
// GET /admin/dashboard/morning-count-alerts
// ============================================================================

const TODAY = new Date().toISOString().slice(0, 10);
const ALERTS_POLL_MS = 60_000;
const ALERTS_CUTOFF = '09:00';

interface MorningCountAlertsState {
  alerts: MorningCountAlertResponse[];
  loading: boolean;
  // Dismissed for this browser session only — the branch stays overdue
  // server-side until its sheet actually completes; this just hides the
  // banner row locally so an admin isn't nagged repeatedly in one sitting.
  dismissedBranchIds: string[];
  startPolling: (vendorId: string) => () => void;
  dismiss: (branchId: string) => void;
}

export const useMorningCountAlertsStore = create<MorningCountAlertsState>((set) => ({
  alerts: [],
  loading: false,
  dismissedBranchIds: [],

  startPolling: (vendorId) => {
    let cancelled = false;

    const tick = async () => {
      set({ loading: true });
      try {
        const alerts = await morningCountService.getAlerts({
          vendorId,
          date: TODAY,
          cutoffTime: ALERTS_CUTOFF,
        });
        if (!cancelled) set({ alerts, loading: false });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        if (!cancelled) set({ loading: false });
      }
    };

    tick();
    const interval = setInterval(tick, ALERTS_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  },

  dismiss: (branchId) =>
    set((state) => ({ dismissedBranchIds: [...state.dismissedBranchIds, branchId] })),
}));

// ============================================================================
// useAuditLogStore — Super Admin read-only staff audit log + export.
// GET /admin/morning-count/audit-logs, GET .../audit-logs/export
// ============================================================================

interface AuditLogState {
  entries: MorningCountAuditEntryResponse[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  isExporting: boolean;
  filters: Omit<AuditLogFilters, 'page' | 'limit'>;

  setFilters: (filters: Omit<AuditLogFilters, 'page' | 'limit'>) => void;
  fetch: (page?: number) => Promise<void>;
  exportLog: (format: 'csv' | 'pdf') => Promise<void>;
}

export const useAuditLogStore = create<AuditLogState>((set, get) => ({
  entries: [],
  total: 0,
  page: 1,
  limit: 20,
  loading: false,
  isExporting: false,
  filters: {},

  setFilters: (filters) => set({ filters, page: 1 }),

  fetch: async (page = get().page) => {
    set({ loading: true });
    try {
      const res = await morningCountService.getAuditLogs({
        ...get().filters,
        page,
        limit: get().limit,
      });
      set({ entries: res.items, total: res.total, page, loading: false });
    } catch (error) {
      set({ loading: false });
      toast.error(extractErrorMessage(error, 'Could not load audit log.'));
    }
  },

  exportLog: async (format) => {
    set({ isExporting: true });
    try {
      await morningCountService.exportAuditLogs(format, get().filters);
      toast.success(`Audit log exported as ${format.toUpperCase()}.`);
    } catch (error) {
      toast.error(extractErrorMessage(error, `Could not export as ${format.toUpperCase()}.`));
    } finally {
      set({ isExporting: false });
    }
  },
}));