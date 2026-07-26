// store/useMenuStore.ts
import { create } from 'zustand';
import { toast } from 'sonner';
import { menuService } from '@/services/menu.service';
import {
  MenuCategory,
  MenuItem,
  GetItemsFilters,
  CreateMenuItemPayload,
  UpdateMenuItemPayload,
} from '@/types/menu';

function extractErrorMessage(error: unknown, fallback: string) {
  const anyErr = error as any;
  return anyErr?.response?.data?.message ?? anyErr?.message ?? fallback;
}

interface MenuState {
  categories: MenuCategory[] | null;
  categoriesLoading: boolean;
  categoriesError: boolean;

  items: MenuItem[] | null;
  itemsLoading: boolean;
  itemsError: boolean;

  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isTogglingAvailability: boolean;

  // keeps items in sync with whatever filter was last applied,
  // so mutations know how to refetch correctly
  lastFilters: GetItemsFilters;

  fetchCategories: () => Promise<void>;
  fetchItems: (filters?: GetItemsFilters) => Promise<void>;
  createItem: (payload: CreateMenuItemPayload, files: File[]) => Promise<boolean>;
  updateItem: (id: string, payload: UpdateMenuItemPayload) => Promise<boolean>;
  deleteItem: (id: string) => Promise<boolean>;
  toggleAvailability: (id: string) => Promise<boolean>;
  updateItemImage: (id: string, file: File) => Promise<boolean>;
}

export const useMenuStore = create<MenuState>((set, get) => ({
  categories: null,
  categoriesLoading: false,
  categoriesError: false,

  items: null,
  itemsLoading: false,
  itemsError: false,

  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isTogglingAvailability: false,

  lastFilters: {},

  fetchCategories: async () => {
    set({ categoriesLoading: true, categoriesError: false });
    try {
      const categories = await menuService.getCategories();
      set({ categories, categoriesLoading: false });
    } catch (error) {
      set({ categoriesLoading: false, categoriesError: true });
      toast.error(extractErrorMessage(error, 'Could not load categories'));
    }
  },

  fetchItems: async (filters = {}) => {
    set({ itemsLoading: true, itemsError: false, lastFilters: filters });
    try {
      const items = await menuService.getItems(filters);
      set({ items, itemsLoading: false });
    } catch (error) {
      set({ itemsLoading: false, itemsError: true });
      toast.error(extractErrorMessage(error, 'Could not load menu items'));
    }
  },

  createItem: async (payload, files) => {
    set({ isCreating: true });
    try {
      await menuService.createItem(payload, files);
      set({ isCreating: false });
      toast.success('Dish added');
      await get().fetchItems(get().lastFilters);
      return true;
    } catch (error) {
      set({ isCreating: false });
      toast.error(extractErrorMessage(error, 'Could not add dish'));
      return false;
    }
  },

  updateItem: async (id, payload) => {
    set({ isUpdating: true });
    try {
      await menuService.updateItem(id, payload);
      set({ isUpdating: false });
      toast.success('Dish updated');
      await get().fetchItems(get().lastFilters);
      return true;
    } catch (error) {
      set({ isUpdating: false });
      toast.error(extractErrorMessage(error, 'Could not update dish'));
      return false;
    }
  },

  deleteItem: async (id) => {
    set({ isDeleting: true });
    try {
      await menuService.deleteItem(id);
      set({ isDeleting: false });
      toast.success('Dish removed');
      await get().fetchItems(get().lastFilters);
      return true;
    } catch (error) {
      set({ isDeleting: false });
      toast.error(extractErrorMessage(error, 'Could not remove dish'));
      return false;
    }
  },

  toggleAvailability: async (id) => {
    set({ isTogglingAvailability: true });
    try {
      await menuService.toggleAvailability(id);
      set({ isTogglingAvailability: false });
      toast.success('Availability updated');
      await get().fetchItems(get().lastFilters);
      return true;
    } catch (error) {
      set({ isTogglingAvailability: false });
      toast.error(extractErrorMessage(error, 'Could not update availability'));
      return false;
    }
  },

  // NOT YET LIVE on backend — silent failure, no toast (see backend request, Menu #3)
  updateItemImage: async (id, file) => {
    try {
      await menuService.updateItemImage(id, file);
      await get().fetchItems(get().lastFilters);
      return true;
    } catch {
      return false;
    }
  },
}));