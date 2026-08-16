import { create } from 'zustand';
import { toast } from 'sonner';
import { foodInventoryService } from '@/services/food-inventory.service';
import { drinksService } from '@/services/drinks.service';
import { FoodInventoryItem, InventoryStats, StatusBanner } from '@/types/food-inventory.types';
import { DrinksInventoryItem, AdjustWarehousePayload } from '@/types/drinks.types';
import { TransferToFridgePayload, CreateDeliveryPayload } from '@/types/drinks.types';

function extractErrorMessage(error: unknown, fallback: string) {
  const anyErr = error as any;
  return anyErr?.response?.data?.message ?? anyErr?.message ?? fallback;
}

interface InventoryDashboardState {
  // Food tab
  foodItems: FoodInventoryItem[] | null;
  foodTotal: number;
  foodStats: InventoryStats | null;
  foodCategories: string[] | null;
  foodLoading: boolean;
  foodError: boolean;

  // Drinks tab
  drinkItems: DrinksInventoryItem[] | null;
  drinksTotal: number;
  drinksStats: InventoryStats | null;
  drinksLoading: boolean;
  drinksError: boolean;

  // Shared banner
  banner: StatusBanner | null;
  bannerLoading: boolean;
  bannerError: boolean;

  // branchId added to every fetch/mutation below -- each branch has its
  // own food/drinks stock, same as stock/drinks/suppliers elsewhere.
  fetchFoodItems: (params: { branchId?: string; search?: string; category?: string; status?: string; page?: number; pageSize?: number }) => Promise<void>;
  fetchFoodCategories: () => Promise<void>;
  fetchDrinkItems: (params: { branchId?: string; search?: string; status?: string; page?: number; pageSize?: number }) => Promise<void>;
  fetchBanner: (branchId?: string) => Promise<void>;

  adjustWarehouseStock: (payload: AdjustWarehousePayload, branchId?: string) => Promise<boolean>;
  transferToFridge: (payload: TransferToFridgePayload, branchId?: string) => Promise<boolean>;
  receiveDelivery: (payload: CreateDeliveryPayload, branchId?: string) => Promise<boolean>;
}

export const useInventoryDashboardStore = create<InventoryDashboardState>((set) => ({
  foodItems: null,
  foodTotal: 0,
  foodStats: null,
  foodCategories: null,
  foodLoading: false,
  foodError: false,

  drinkItems: null,
  drinksTotal: 0,
  drinksStats: null,
  drinksLoading: false,
  drinksError: false,

  banner: null,
  bannerLoading: false,
  bannerError: false,

  fetchFoodItems: async (params) => {
    set({ foodLoading: true, foodError: false });
    try {
      const { items, total, stats } = await foodInventoryService.getItems(params);
      set({ foodItems: items, foodTotal: total, foodStats: stats, foodLoading: false });
    } catch {
      set({ foodLoading: false, foodError: true });
    }
  },

  fetchFoodCategories: async () => {
    try {
      const foodCategories = await foodInventoryService.getCategories();
      set({ foodCategories });
    } catch {
      set({ foodCategories: null });
    }
  },

  fetchDrinkItems: async (params) => {
    set({ drinksLoading: true, drinksError: false });
    try {
      const { items, total, stats } = await drinksService.getInventorySummary(params);
      set({ drinkItems: items, drinksTotal: total, drinksStats: stats, drinksLoading: false });
    } catch {
      set({ drinksLoading: false, drinksError: true });
    }
  },

  fetchBanner: async (branchId) => {
    set({ bannerLoading: true, bannerError: false });
    try {
      const banner = await foodInventoryService.getStatusBanner(branchId);
      set({ banner, bannerLoading: false });
    } catch {
      set({ bannerLoading: false, bannerError: true });
    }
  },

  adjustWarehouseStock: async (payload, branchId) => {
    try {
      const updated = await drinksService.adjustWarehouseStock({ ...payload, branchId });
      set((state) => ({
        drinkItems: state.drinkItems
          ? state.drinkItems.map((i) => (i.id === updated.id ? updated : i))
          : state.drinkItems,
      }));
      toast.success('Stock adjusted.');
      return true;
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Could not adjust stock.'));
      return false;
    }
  },

  transferToFridge: async (payload, branchId) => {
    try {
      await drinksService.transferToFridge({ ...payload, branchId });
      toast.success('Transferred to fridge.');
      return true;
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Could not complete transfer.'));
      return false;
    }
  },

  receiveDelivery: async (payload, branchId) => {
    try {
      await drinksService.createDelivery({ ...payload, branchId });
      toast.success(payload.isDraft ? 'Delivery saved as draft.' : 'Delivery received.');
      return true;
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Could not save delivery.'));
      return false;
    }
  },
}));