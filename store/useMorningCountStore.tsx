// store/useMorningCountStore.ts
import { create } from 'zustand';
import { toast } from 'sonner';
import { morningCountService } from '@/services/morning-count.service';
import { MorningCountSheet, MorningCountCategory} from '@/types/morning-count.types';

function extractErrorMessage(error: unknown, fallback: string) {
  const anyErr = error as any;
  return anyErr?.response?.data?.message ?? anyErr?.message ?? fallback;
}

// Dedupe concurrent fetchSheet calls for the same (outletId, date). This
// guards against React StrictMode's dev-only double-invoke of effects on
// client-side navigation (two identical requests firing back-to-back,
// same outletId/date, ~0.3s apart) — confirmed via network tab. That was
// tripping the backend's create-if-missing race on
// MorningStockCountSheet(branchId, date) and surfacing as a 500-then-200
// pair with a toast on the 500. Kept as module-level closures, not store
// state, so it doesn't trigger extra re-renders. This also protects
// against any other accidental duplicate caller, not just StrictMode.
let inFlightKey: string | null = null;
let inFlightPromise: Promise<void> | null = null;

interface MorningCountState {
  sheet: MorningCountSheet | null;
  sheetLoading: boolean;
  sheetError: boolean;

  selectedCategoryId: string | null;
  isSavingDraft: boolean;

  // Item ids with a current-quantity save in flight — drives a per-row
  // loader while a Pending item is on its way to becoming Updated.
  updatingItemIds: Record<string, boolean>;

  fetchSheet: (outletId: string, date: string) => Promise<void>;
  // Background refresh used after a mutation (e.g. a UoM edit) that can
  // change the backend-computed summary but shouldn't flash the table
  // into its loading state the way fetchSheet does.
  refreshSheetSilently: (outletId: string, date: string) => Promise<void>;
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

  updatingItemIds: {},

  fetchSheet: async (outletId, date) => {
    const key = `${outletId}:${date}`;

    // A fetch for this exact outlet+date is already in flight — piggyback
    // on it instead of firing a second identical request.
    if (inFlightKey === key && inFlightPromise) {
      return inFlightPromise;
    }

    set({ sheetLoading: true, sheetError: false });
    inFlightKey = key;

    inFlightPromise = (async () => {
      try {
        const sheet = await morningCountService.getSheet(outletId, date);
        set({ sheet, selectedCategoryId: sheet.categories[0]?.id ?? null, sheetLoading: false });
      } catch (error) {
        set({ sheetLoading: false, sheetError: true });
        toast.error(extractErrorMessage(error, 'Could not load count sheet.'));
      } finally {
        // Only clear if we're still the current in-flight request for this
        // key — a newer call (different outlet/date) may have already
        // taken over.
        if (inFlightKey === key) {
          inFlightKey = null;
          inFlightPromise = null;
        }
      }
    })();

    return inFlightPromise;
  },

  // Like fetchSheet but doesn't toggle sheetLoading (no full-table
  // "Loading…" flash) and preserves whatever category the user currently
  // has open instead of resetting to categories[0] — this runs silently
  // in the background after a mutation, not as an initial page load.
  refreshSheetSilently: async (outletId, date) => {
    const key = `${outletId}:${date}`;

    // Piggyback on any fetchSheet/refresh already in flight for this
    // exact outlet+date rather than firing a duplicate request.
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
      } catch (error) {
        // Silent by design — the primary mutation (e.g. the UoM save)
        // already succeeded and reported its own success/error. Failing
        // to refresh the summary in the background isn't worth a second
        // toast on top of that.
      } finally {
        if (inFlightKey === key) {
          inFlightKey = null;
          inFlightPromise = null;
        }
      }
    })();

    return inFlightPromise;
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
      // Fire-and-forget: refresh the sheet in the background so Summary
      // picks up whatever the backend recalculates off a UoM change,
      // without blocking the modal from closing or flashing the table.
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