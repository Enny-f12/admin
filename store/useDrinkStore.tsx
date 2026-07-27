import { create } from 'zustand';
import { toast } from 'sonner';
import { drinksService } from '@/services/drinks.service';
import {
  DrinksItem,
  CreateDeliveryPayload,
  TransferToFridgePayload,
  FridgeThresholdConfig,
  SaveFridgeThresholdsPayload,
  Supplier,
  AddSupplierPayload,
} from '@/types/drinks.types';

function extractErrorMessage(error: unknown, fallback: string) {
  const anyErr = error as any;
  return anyErr?.response?.data?.message ?? anyErr?.message ?? fallback;
}

interface DrinksState {
  items: DrinksItem[] | null;
  itemsLoading: boolean;
  itemsError: boolean;

  suppliers: Supplier[] | null;
  suppliersLoading: boolean;
  suppliersError: boolean;

  thresholds: FridgeThresholdConfig | null;
  thresholdsLoading: boolean;
  thresholdsError: boolean;
  savingThresholds: boolean;

  isSubmittingDelivery: boolean;
  isTransferring: boolean;

  fetchItems: (search?: string) => Promise<void>;
  fetchSuppliers: () => Promise<void>;
  fetchThresholds: () => Promise<void>;

  createDelivery: (payload: CreateDeliveryPayload) => Promise<boolean>;
  transferToFridge: (payload: TransferToFridgePayload) => Promise<boolean>;
  addSupplier: (payload: AddSupplierPayload) => Promise<boolean>;
  saveThresholds: (payload: SaveFridgeThresholdsPayload) => Promise<boolean>;
}

export const useDrinksStore = create<DrinksState>((set) => ({
  items: null,
  itemsLoading: false,
  itemsError: false,

  suppliers: null,
  suppliersLoading: false,
  suppliersError: false,

  thresholds: null,
  thresholdsLoading: false,
  thresholdsError: false,
  savingThresholds: false,

  isSubmittingDelivery: false,
  isTransferring: false,

  fetchItems: async (search) => {
    set({ itemsLoading: true, itemsError: false });
    try {
      const items = await drinksService.getItems(search);
      set({ items, itemsLoading: false });
    } catch {
      set({ itemsLoading: false, itemsError: true });
    }
  },

  fetchSuppliers: async () => {
    set({ suppliersLoading: true, suppliersError: false });
    try {
      const suppliers = await drinksService.getSuppliers();
      set({ suppliers, suppliersLoading: false });
    } catch {
      set({ suppliersLoading: false, suppliersError: true });
    }
  },

  fetchThresholds: async () => {
    set({ thresholdsLoading: true, thresholdsError: false });
    try {
      const thresholds = await drinksService.getThresholds();
      set({ thresholds, thresholdsLoading: false });
    } catch {
      set({ thresholdsLoading: false, thresholdsError: true });
    }
  },

  createDelivery: async (payload) => {
    set({ isSubmittingDelivery: true });
    try {
      const { items: updatedItems } = await drinksService.createDelivery(payload);
      set((state) => ({
        isSubmittingDelivery: false,
        items: state.items
          ? state.items.map((i) => updatedItems.find((u) => u.id === i.id) ?? i)
          : state.items,
      }));
      toast.success(payload.isDraft ? 'Delivery saved as draft.' : 'Delivery received.');
      return true;
    } catch (error) {
      set({ isSubmittingDelivery: false });
      toast.error(extractErrorMessage(error, 'Could not save delivery.'));
      return false;
    }
  },

  transferToFridge: async (payload) => {
    set({ isTransferring: true });
    try {
      const updatedItem = await drinksService.transferToFridge(payload);
      set((state) => ({
        isTransferring: false,
        items: state.items ? state.items.map((i) => (i.id === updatedItem.id ? updatedItem : i)) : state.items,
      }));
      toast.success('Transferred to fridge.');
      return true;
    } catch (error) {
      set({ isTransferring: false });
      toast.error(extractErrorMessage(error, 'Could not complete transfer.'));
      return false;
    }
  },

  addSupplier: async (payload) => {
    try {
      const supplier = await drinksService.addSupplier(payload);
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
      const thresholds = await drinksService.saveThresholds(payload);
      set({ thresholds, savingThresholds: false });
      toast.success('Thresholds saved.');
      return true;
    } catch (error) {
      set({ savingThresholds: false });
      toast.error(extractErrorMessage(error, 'Could not save thresholds.'));
      return false;
    }
  },
}));