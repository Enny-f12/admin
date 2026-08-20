import { create } from 'zustand';
import { toast } from 'sonner';
import { stockService } from '@/services/stock.service';
import {
  StockItem,
  Branch,
  StockAlert,
  Supplier,
  StockThresholdConfig,
  AdjustStockPayload,
  TransferStockPayload,
  RemoveStockPayload,
  AddSupplierPayload,
  SaveStockThresholdsPayload,
  AddStockPayload,
} from '@/types/stock.types';

function extractErrorMessage(error: unknown, fallback: string) {
  const anyErr = error as any;
  return anyErr?.response?.data?.message ?? anyErr?.message ?? fallback;
}

interface StockState {
  items: StockItem[] | null;
  itemsLoading: boolean;
  itemsError: boolean;

  branches: Branch[] | null;
  branchesLoading: boolean;
  branchesError: boolean;

  lowStock: StockAlert[] | null;
  lowStockLoading: boolean;
  lowStockError: boolean;

  suppliers: Supplier[] | null;
  suppliersLoading: boolean;
  suppliersError: boolean;

  thresholds: StockThresholdConfig | null;
  thresholdsLoading: boolean;
  thresholdsError: boolean;
  savingThresholds: boolean;

  isAddingStock: boolean;

  fetchItems: (branchId?: string, search?: string) => Promise<void>;
  fetchBranches: () => Promise<void>;
  fetchLowStockAlerts: (branchId?: string) => Promise<void>;
  fetchSuppliers: () => Promise<void>;
  fetchThresholds: (branchId?: string) => Promise<void>;

  adjustStock: (payload: AdjustStockPayload) => Promise<boolean>;
  addStock: (payload: AddStockPayload) => Promise<boolean>;
  transferStock: (payload: TransferStockPayload) => Promise<boolean>;
  removeStock: (payload: RemoveStockPayload) => Promise<boolean>;
  addSupplier: (payload: AddSupplierPayload) => Promise<boolean>;
  saveThresholds: (payload: SaveStockThresholdsPayload) => Promise<boolean>;

  fetchAll: (branchId?: string) => void;
}

export const useStockStore = create<StockState>((set, get) => ({
  items: null,
  itemsLoading: false,
  itemsError: false,

  branches: null,
  branchesLoading: false,
  branchesError: false,

  lowStock: null,
  lowStockLoading: false,
  lowStockError: false,

  suppliers: null,
  suppliersLoading: false,
  suppliersError: false,

  thresholds: null,
  thresholdsLoading: false,
  thresholdsError: false,
  savingThresholds: false,

  isAddingStock: false,

  fetchItems: async (branchId, search) => {
    set({ itemsLoading: true, itemsError: false });
    try {
      const items = await stockService.getItems(branchId, search);
      set({ items, itemsLoading: false });
    } catch {
      set({ itemsLoading: false, itemsError: true });
    }
  },

  fetchBranches: async () => {
    set({ branchesLoading: true, branchesError: false });
    try {
      const branches = await stockService.getBranches();
      set({ branches, branchesLoading: false });
    } catch {
      set({ branchesLoading: false, branchesError: true });
    }
  },

  fetchLowStockAlerts: async (branchId) => {
    set({ lowStockLoading: true, lowStockError: false });
    try {
      const lowStock = await stockService.getStockAlerts(branchId);
      set({ lowStock, lowStockLoading: false });
    } catch {
      set({ lowStockLoading: false, lowStockError: true });
    }
  },

  fetchSuppliers: async () => {
    set({ suppliersLoading: true, suppliersError: false });
    try {
      const suppliers = await stockService.getSuppliers();
      set({ suppliers, suppliersLoading: false });
    } catch {
      set({ suppliersLoading: false, suppliersError: true });
    }
  },

  fetchThresholds: async (branchId) => {
    set({ thresholdsLoading: true, thresholdsError: false });
    try {
      const thresholds = await stockService.getThresholds(branchId);
      set({ thresholds, thresholdsLoading: false });
    } catch {
      set({ thresholdsLoading: false, thresholdsError: true });
    }
  },

  adjustStock: async (payload) => {
    try {
      const updatedItem = await stockService.adjustStock(payload);
      set((state) => ({
        items: state.items
          ? state.items.map((i) => (i.id === updatedItem.id ? mergeItemBranch(i, updatedItem) : i))
          : state.items,
      }));
      toast.success('Stock adjusted.');
      return true;
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Could not adjust stock.'));
      return false;
    }
  },

  // Registers a brand-new item (name + unit are user-entered in
  // AddStockView, itemId is always sent as null — see AddStockPayload
  // comment in stock.types.ts). No existing row to merge into, so this
  // appends the item the backend hands back, guarding against a
  // duplicate in case it somehow already exists.
  addStock: async (payload) => {
    set({ isAddingStock: true });
    try {
      const newItem = await stockService.addStock(payload);
      set((state) => ({
        isAddingStock: false,
        items: state.items
          ? state.items.some((i) => i.id === newItem.id)
            ? state.items
            : [...state.items, newItem]
          : [newItem],
      }));
      toast.success('New item added to inventory.');
      return true;
    } catch (error) {
      set({ isAddingStock: false });
      toast.error(extractErrorMessage(error, 'Could not add item.'));
      return false;
    }
  },

  transferStock: async (payload) => {
    try {
      const { from, to } = await stockService.transferStock(payload);
      set((state) => ({
        items: state.items
          ? state.items.map((i) => {
              if (i.id === from.id) return mergeItemBranch(i, from);
              if (i.id === to.id) return mergeItemBranch(i, to);
              return i;
            })
          : state.items,
      }));
      toast.success('Transfer complete.');
      return true;
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Could not complete transfer.'));
      return false;
    }
  },

  removeStock: async (payload) => {
    try {
      const updatedItem = await stockService.removeStock(payload);
      set((state) => ({
        items: state.items
          ? state.items.map((i) => (i.id === updatedItem.id ? mergeItemBranch(i, updatedItem) : i))
          : state.items,
      }));
      toast.success('Stock removed.');
      return true;
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Could not remove stock.'));
      return false;
    }
  },

  addSupplier: async (payload) => {
    try {
      const supplier = await stockService.addSupplier(payload);
      set((state) => ({
        suppliers: state.suppliers ? [...state.suppliers, supplier] : [supplier],
      }));
      toast.success('Supplier added.');
      return true;
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Could not add supplier.'));
      return false;
    }
  },

  saveThresholds: async (payload) => {
    set({ savingThresholds: true });
    try {
      const thresholds = await stockService.saveThresholds(payload);
      set({ thresholds, savingThresholds: false });
      toast.success('Thresholds saved.');
      return true;
    } catch (error) {
      set({ savingThresholds: false });
      toast.error(extractErrorMessage(error, 'Could not save thresholds.'));
      return false;
    }
  },

  fetchAll: (branchId) => {
    const state = get();
    state.fetchItems(branchId);
    state.fetchBranches();
    state.fetchLowStockAlerts(branchId);
  },
}));

function mergeItemBranch(existing: StockItem, updated: StockItem): StockItem {
  const updatedBranchQty = updated.quantities[0];
  if (!updatedBranchQty) return updated;
  const quantities = existing.quantities.map((q) =>
    q.branchId === updatedBranchQty.branchId ? updatedBranchQty : q,
  );
  const total = quantities.reduce((sum, q) => sum + q.quantity, 0);
  return { ...existing, quantities, total, status: updated.status, costPerUnit: updated.costPerUnit };
}