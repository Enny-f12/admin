// store/useInventoryStore.ts
import { create } from 'zustand';
import { toast } from 'sonner';
import { inventoryService } from '@/services/inventory.service';
import {
  InventoryItem,
  UpdateStockPayload,
  TransferBranchPayload,
  TransferZonePayload,
  ReceiveDeliveryPayload,
  WastagePayload,
  ThresholdConfig,
  Supplier,
  CreateSupplierPayload,
} from '@/types/inventory';

function extractErrorMessage(error: unknown, fallback: string) {
  const anyErr = error as any;
  return anyErr?.response?.data?.message ?? anyErr?.message ?? fallback;
}

interface InventoryState {
  items: InventoryItem[] | null;
  isLoading: boolean;
  isError: boolean;
  isSaving: boolean;

  suppliers: Supplier[] | null;
  suppliersLoading: boolean;

  thresholds: ThresholdConfig[] | null;
  thresholdsLoading: boolean;
  thresholdsSaving: boolean;

  fetchInventory: (branchId?: string) => Promise<void>;
  updateStock: (id: string, payload: UpdateStockPayload) => Promise<boolean>;
  transferBetweenBranches: (payload: TransferBranchPayload) => Promise<boolean>;
  transferToFridge: (itemId: string, payload: TransferZonePayload) => Promise<boolean>;
  receiveDelivery: (payload: ReceiveDeliveryPayload) => Promise<boolean>;
  removeWastage: (itemId: string, payload: WastagePayload) => Promise<boolean>;

  fetchSuppliers: () => Promise<void>;
  createSupplier: (payload: CreateSupplierPayload) => Promise<boolean>;

  fetchThresholds: (branchId?: string) => Promise<void>;
  saveThresholds: (rows: ThresholdConfig[]) => Promise<boolean>;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: null,
  isLoading: false,
  isError: false,
  isSaving: false,

  suppliers: null,
  suppliersLoading: false,

  thresholds: null,
  thresholdsLoading: false,
  thresholdsSaving: false,

  fetchInventory: async (branchId) => {
    set({ isLoading: true, isError: false });
    try {
      const items = await inventoryService.getInventory(branchId);
      set({ items, isLoading: false });
    } catch (error) {
      set({ isLoading: false, isError: true });
      toast.error(extractErrorMessage(error, 'Could not load inventory'));
    }
  },

  updateStock: async (id, payload) => {
    set({ isSaving: true });
    try {
      await inventoryService.updateStock(id, payload);
      set({ isSaving: false });
      toast.success('Stock updated');
      await get().fetchInventory();
      return true;
    } catch (error) {
      set({ isSaving: false });
      toast.error(extractErrorMessage(error, 'Could not update stock'));
      return false;
    }
  },

  transferBetweenBranches: async (payload) => {
    set({ isSaving: true });
    try {
      await inventoryService.transferBetweenBranches(payload);
      set({ isSaving: false });
      toast.success('Stock transferred');
      await get().fetchInventory();
      return true;
    } catch (error) {
      set({ isSaving: false });
      toast.error(extractErrorMessage(error, 'Could not transfer stock — endpoint may not be live yet'));
      return false;
    }
  },

  transferToFridge: async (itemId, payload) => {
    set({ isSaving: true });
    try {
      await inventoryService.transferToFridge(itemId, payload);
      set({ isSaving: false });
      toast.success('Transferred to fridge');
      await get().fetchInventory();
      return true;
    } catch (error) {
      set({ isSaving: false });
      toast.error(extractErrorMessage(error, 'Could not transfer to fridge — endpoint may not be live yet'));
      return false;
    }
  },

  receiveDelivery: async (payload) => {
    set({ isSaving: true });
    try {
      await inventoryService.receiveDelivery(payload);
      set({ isSaving: false });
      toast.success('Delivery received');
      await get().fetchInventory();
      return true;
    } catch (error) {
      set({ isSaving: false });
      toast.error(extractErrorMessage(error, 'Could not save delivery — endpoint may not be live yet'));
      return false;
    }
  },

  removeWastage: async (itemId, payload) => {
    set({ isSaving: true });
    try {
      await inventoryService.removeWastage(itemId, payload);
      set({ isSaving: false });
      toast.success('Wastage recorded');
      await get().fetchInventory();
      return true;
    } catch (error) {
      set({ isSaving: false });
      toast.error(extractErrorMessage(error, 'Could not record wastage — endpoint may not be live yet'));
      return false;
    }
  },

  fetchSuppliers: async () => {
    set({ suppliersLoading: true });
    try {
      const suppliers = await inventoryService.getSuppliers();
      set({ suppliers, suppliersLoading: false });
    } catch (error) {
      set({ suppliersLoading: false });
      // Silent — suppliers list not critical path, endpoint likely not live yet
    }
  },

  createSupplier: async (payload) => {
    set({ isSaving: true });
    try {
      const supplier = await inventoryService.createSupplier(payload);
      set((state) => ({
        isSaving: false,
        suppliers: state.suppliers ? [...state.suppliers, supplier] : [supplier],
      }));
      toast.success('Supplier added');
      return true;
    } catch (error) {
      set({ isSaving: false });
      toast.error(extractErrorMessage(error, 'Could not add supplier — endpoint may not be live yet'));
      return false;
    }
  },

  fetchThresholds: async (branchId) => {
    set({ thresholdsLoading: true });
    try {
      const thresholds = await inventoryService.getThresholds(branchId);
      set({ thresholds, thresholdsLoading: false });
    } catch (error) {
      set({ thresholdsLoading: false });
      // Silent — endpoint likely not live yet
    }
  },

  saveThresholds: async (rows) => {
    set({ thresholdsSaving: true });
    try {
      await inventoryService.updateThresholds(rows);
      set({ thresholdsSaving: false, thresholds: rows });
      toast.success('Thresholds saved');
      return true;
    } catch (error) {
      set({ thresholdsSaving: false });
      toast.error(extractErrorMessage(error, 'Could not save thresholds — endpoint may not be live yet'));
      return false;
    }
  },
}));