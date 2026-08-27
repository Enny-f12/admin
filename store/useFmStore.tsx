// store/useFmStore.ts
import { create } from 'zustand';
import { toast } from 'sonner';
import { fmService } from '@/services/fm.service';
import {
  MenuCategory,
  MenuItem,
  GetItemsFilters,
  CreateMenuItemPayload,
  UpdateMenuItemPayload,
  CreateCategoryPayload,
} from '@/types/fm.types';

function extractErrorMessage(error: unknown, fallback: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyErr = error as any;
  return anyErr?.response?.data?.message ?? anyErr?.message ?? fallback;
}

interface FmState {
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
  isCreatingCategory: boolean;

  // keeps items in sync with whatever filter was last applied,
  // so mutations know how to refetch correctly
  lastFilters: GetItemsFilters;

  fetchCategories: () => Promise<void>;
  addCategory: (payload: CreateCategoryPayload) => Promise<MenuCategory | null>;
  fetchItems: (filters?: GetItemsFilters) => Promise<void>;
  createItem: (payload: CreateMenuItemPayload, files: File[]) => Promise<boolean>;
  updateItem: (id: string, payload: UpdateMenuItemPayload) => Promise<boolean>;
  deleteItem: (id: string) => Promise<boolean>;
  toggleAvailability: (id: string) => Promise<boolean>;
  updateItemImage: (id: string, files: File[]) => Promise<boolean>;
  deleteItemImage: (itemId: string, imageId: string) => Promise<boolean>;
}

export const useFmStore = create<FmState>((set, get) => ({
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
  isCreatingCategory: false,

  lastFilters: {},

  // No branch filter — always the vendor's full category list.
  fetchCategories: async () => {
    set({ categoriesLoading: true, categoriesError: false });
    try {
      const categories = await fmService.getCategories();
      set({ categories, categoriesLoading: false });
    } catch (error) {
      set({ categoriesLoading: false, categoriesError: true });
      toast.error(extractErrorMessage(error, 'Could not load categories'));
    }
  },

  // Inline quick-add from the Add/Edit Dish modal. Appends the new category
  // to the in-memory list and auto-selects it rather than refetching —
  // one POST response is enough, no need to round-trip fetchCategories.
  addCategory: async (payload) => {
    set({ isCreatingCategory: true });
    try {
      const category = await fmService.createCategory(payload);
      set((state) => ({
        isCreatingCategory: false,
        categories: state.categories ? [...state.categories, category] : [category],
      }));
      toast.success('Category added');
      return category;
    } catch (error) {
      set({ isCreatingCategory: false });
      toast.error(extractErrorMessage(error, 'Could not add category'));
      return null;
    }
  },

  fetchItems: async (filters = {}) => {
    set({ itemsLoading: true, itemsError: false, lastFilters: filters });
    try {
      const items = await fmService.getItems(filters);
      set({ items, itemsLoading: false });
    } catch (error) {
      set({ itemsLoading: false, itemsError: true });
      toast.error(extractErrorMessage(error, 'Could not load menu items'));
    }
  },

  // Two real API calls under the hood: create (JSON) then, if files were
  // provided, a follow-up image upload. If the item is created but the
  // image upload fails, we still treat it as a success (the dish exists)
  // but surface a distinct message rather than a generic failure toast.
  createItem: async (payload, files) => {
    set({ isCreating: true });
    try {
      const created = await fmService.createItem(payload);

      if (files.length > 0) {
        try {
          await fmService.uploadItemImages(created.id, files);
        } catch (imgError) {
          set({ isCreating: false });
          toast.error(extractErrorMessage(imgError, 'Dish added, but image upload failed'));
          await get().fetchItems(get().lastFilters);
          return true;
        }
      }

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
      await fmService.updateItem(id, payload);
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
      await fmService.deleteItem(id);
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
      await fmService.toggleAvailability(id);
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

  // Used for adding images to an item that already exists (edit flow) —
  // same endpoint createItem's follow-up call uses.
  updateItemImage: async (id, files) => {
    try {
      await fmService.uploadItemImages(id, files);
      await get().fetchItems(get().lastFilters);
      return true;
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Could not upload image'));
      return false;
    }
  },

  // Endpoint is unconfirmed (see fm.service.ts) — if this 404s, that's
  // the backend gap, not a frontend bug. Kept as a normal store action so
  // the failure surfaces as a toast like everything else, rather than
  // silently no-op-ing.
  deleteItemImage: async (itemId, imageId) => {
    try {
      await fmService.deleteItemImage(itemId, imageId);
      await get().fetchItems(get().lastFilters);
      return true;
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Could not remove image'));
      return false;
    }
  },
}));