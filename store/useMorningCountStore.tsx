// store/useMorningCountStore.ts
import { create } from 'zustand';
import { toast } from 'sonner';
import { morningCountService } from '@/services/morning-count.service';
import { MorningCountSheet, MorningCountCategory} from '@/types/morning-count.types';

function extractErrorMessage(error: unknown, fallback: string) {
  const anyErr = error as any;
  return anyErr?.response?.data?.message ?? anyErr?.message ?? fallback;
}

interface MorningCountState {
  sheet: MorningCountSheet | null;
  sheetLoading: boolean;
  sheetError: boolean;

  selectedCategoryId: string | null;
  isSavingDraft: boolean;

  fetchSheet: (outletId: string, date: string) => Promise<void>;
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

  // NOT YET BUILT — fail silently, no toast, no retry loop
  fetchSheet: async (outletId, date) => {
    set({ sheetLoading: true, sheetError: false });
    try {
      const sheet = await morningCountService.getSheet(outletId, date);
      set({ sheet, selectedCategoryId: sheet.categories[0]?.id ?? null, sheetLoading: false });
    } catch {
      set({ sheetLoading: false, sheetError: true });
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
    set({
      sheet: {
        ...sheet,
        categories: sheet.categories.map((cat) => ({
          ...cat,
          items: cat.items.map((item) => (item.id === itemId ? { ...item, current } : item)),
        })),
      },
    });

    try {
      const updated = await morningCountService.updateItemCurrent(sheet.id, itemId, { current });
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
    } catch (error) {
      set({ sheet: prevSheet });
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