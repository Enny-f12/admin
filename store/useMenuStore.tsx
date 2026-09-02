// store/useMenuStore.ts
import { create } from 'zustand';
import { toast } from 'sonner';
import { menuService } from '@/services/menu.service';
import {
  MenuCategory,
  MenuItem,
  GetItemsFilters,
  GetCategoriesFilters,
  CreateMenuItemPayload,
  UpdateMenuItemPayload,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '@/types/menu';

function extractErrorMessage(error: unknown, fallback: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  isCreatingCategory: boolean;
  isUpdatingCategory: boolean;
  isDeletingCategory: boolean;
  isUploadingCategoryImage: boolean;

  lastFilters: GetItemsFilters;

  fetchCategories: (filters?: GetCategoriesFilters) => Promise<void>;
  addCategory: (payload: CreateCategoryPayload) => Promise<MenuCategory | null>;
  updateCategory: (id: string, payload: UpdateCategoryPayload) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;
  uploadCategoryImage: (id: string, file: File) => Promise<boolean>;
  deleteCategoryImage: (id: string) => Promise<boolean>;
  fetchItems: (filters?: GetItemsFilters) => Promise<void>;
  createItem: (payload: CreateMenuItemPayload, files: File[]) => Promise<boolean>;
  updateItem: (id: string, payload: UpdateMenuItemPayload) => Promise<boolean>;
  deleteItem: (id: string) => Promise<boolean>;
  toggleAvailability: (id: string) => Promise<boolean>;
  updateItemImage: (id: string, files: File[]) => Promise<boolean>;
  deleteItemImage: (itemId: string, imageId: string) => Promise<boolean>;
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
  isCreatingCategory: false,
  isUpdatingCategory: false,
  isDeletingCategory: false,
  isUploadingCategoryImage: false,

  lastFilters: {},

  fetchCategories: async (filters = {}) => {
    set({ categoriesLoading: true, categoriesError: false });
    try {
      const categories = await menuService.getCategories(filters);
      set({ categories, categoriesLoading: false });
    } catch (error) {
      set({ categoriesLoading: false, categoriesError: true });
      toast.error(extractErrorMessage(error, 'Could not load categories'));
    }
  },

  addCategory: async (payload) => {
    set({ isCreatingCategory: true });
    try {
      const category = await menuService.createCategory(payload);
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

  updateCategory: async (id, payload) => {
    set({ isUpdatingCategory: true });
    try {
      const updated = await menuService.updateCategory(id, payload);
      set((state) => ({
        isUpdatingCategory: false,
        categories: state.categories?.map((c) => (c.id === id ? updated : c)) ?? null,
      }));
      toast.success('Category updated');
      return true;
    } catch (error) {
      set({ isUpdatingCategory: false });
      toast.error(extractErrorMessage(error, 'Could not update category'));
      return false;
    }
  },

  deleteCategory: async (id) => {
    set({ isDeletingCategory: true });
    try {
      await menuService.deleteCategory(id);
      set((state) => ({
        isDeletingCategory: false,
        categories: state.categories?.filter((c) => c.id !== id) ?? null,
      }));
      toast.success('Category removed');
      return true;
    } catch (error) {
      set({ isDeletingCategory: false });
      toast.error(extractErrorMessage(error, 'Could not remove category'));
      return false;
    }
  },

  // Uploads/replaces a category's single image. Patches the category
  // in place from the response, same pattern as updateCategory above.
  uploadCategoryImage: async (id, file) => {
    set({ isUploadingCategoryImage: true });
    try {
      const updated = await menuService.uploadCategoryImage(id, file);
      set((state) => ({
        isUploadingCategoryImage: false,
        categories: state.categories?.map((c) => (c.id === id ? updated : c)) ?? null,
      }));
      return true;
    } catch (error) {
      set({ isUploadingCategoryImage: false });
      toast.error(extractErrorMessage(error, 'Could not upload category image'));
      return false;
    }
  },

  deleteCategoryImage: async (id) => {
    try {
      const updated = await menuService.deleteCategoryImage(id);
      set((state) => ({
        categories: state.categories?.map((c) => (c.id === id ? updated : c)) ?? null,
      }));
      return true;
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Could not remove category image'));
      return false;
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
      const created = await menuService.createItem(payload);

      if (files.length > 0) {
        try {
          await menuService.uploadItemImages(created.id, files);
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

  updateItemImage: async (id, files) => {
    try {
      await menuService.uploadItemImages(id, files);
      await get().fetchItems(get().lastFilters);
      return true;
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Could not upload image'));
      return false;
    }
  },

  deleteItemImage: async (itemId, imageId) => {
    try {
      await menuService.deleteItemImage(itemId, imageId);
      await get().fetchItems(get().lastFilters);
      return true;
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Could not remove image'));
      return false;
    }
  },
}));