import { create } from 'zustand';
import { toast } from 'sonner';
import { reconciliationService } from '@/services/reconciliation.service';
import { ReconciliationItem, StaffMember } from '@/types/reconciliation.types';

function extractErrorMessage(error: unknown, fallback: string) {
  const anyErr = error as any;
  return anyErr?.response?.data?.message ?? anyErr?.message ?? fallback;
}

interface ReconciliationState {
  items: ReconciliationItem[] | null;
  total: number;
  itemsLoading: boolean;
  itemsError: boolean;

  staff: StaffMember[] | null;
  staffLoading: boolean;
  staffError: boolean;

  isAdjusting: boolean;
  isSyncing: boolean;

  fetchItems: (params: { branchId?: string; date?: string; conductedBy?: string; search?: string; category?: string; page?: number; pageSize?: number }) => Promise<void>;
  fetchStaff: (branchId?: string) => Promise<void>;
  adjustItem: (itemId: string, payload: { newValue: number; reason: string; notes: string }, branchId?: string) => Promise<boolean>;
  sync: (payload: { date: string; conductedBy: string; reasonForVariance: string }, branchId?: string) => Promise<boolean>;
}

export const useReconciliationStore = create<ReconciliationState>((set) => ({
  items: null,
  total: 0,
  itemsLoading: false,
  itemsError: false,

  staff: null,
  staffLoading: false,
  staffError: false,

  isAdjusting: false,
  isSyncing: false,

  fetchItems: async (params) => {
    set({ itemsLoading: true, itemsError: false });
    try {
      const { items, total } = await reconciliationService.getItems(params);
      set({ items, total, itemsLoading: false });
    } catch {
      set({ itemsLoading: false, itemsError: true });
    }
  },

  fetchStaff: async (branchId) => {
    set({ staffLoading: true, staffError: false });
    try {
      const staff = await reconciliationService.getStaff(branchId);
      set({ staff, staffLoading: false });
    } catch {
      set({ staffLoading: false, staffError: true });
    }
  },

  adjustItem: async (itemId, payload, branchId) => {
    set({ isAdjusting: true });
    try {
      const updated = await reconciliationService.adjustItem(itemId, { ...payload, branchId });
      set((state) => ({
        isAdjusting: false,
        items: state.items ? state.items.map((i) => (i.id === itemId ? updated : i)) : state.items,
      }));
      toast.success('Adjustment confirmed.');
      return true;
    } catch (error) {
      set({ isAdjusting: false });
      toast.error(extractErrorMessage(error, 'Could not confirm adjustment.'));
      return false;
    }
  },

  sync: async (payload, branchId) => {
    set({ isSyncing: true });
    try {
      const { syncedCount } = await reconciliationService.sync({ ...payload, branchId });
      set({ isSyncing: false });
      toast.success(`Synced ${syncedCount} item${syncedCount === 1 ? '' : 's'}.`);
      return true;
    } catch (error) {
      set({ isSyncing: false });
      toast.error(extractErrorMessage(error, 'Could not sync reconciliation.'));
      return false;
    }
  },
}));