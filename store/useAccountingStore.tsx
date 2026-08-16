// store/useAccountingStore.ts
import { create } from 'zustand';
import { toast } from 'sonner';
import { accountingService } from '@/services/accounting.service';
import {
  AccountingSummary,
  AccountingFilters,
  MarginItem,
  RecentSale,
} from '@/types/accounting.types';

function extractErrorMessage(error: unknown, fallback: string) {
  const anyErr = error as any;
  return anyErr?.response?.data?.message ?? anyErr?.message ?? fallback;
}

interface AccountingState {
  summary: AccountingSummary | null;
  summaryLoading: boolean;
  summaryError: boolean;

  marginItems: MarginItem[] | null;
  marginItemsTotal: number;
  marginItemsLoading: boolean;
  marginItemsError: boolean;
  isSavingCostPrice: boolean;

  recentSales: RecentSale[] | null;
  recentSalesTotal: number;
  recentSalesLoading: boolean;
  recentSalesError: boolean;

  fetchSummary: (filters: AccountingFilters) => Promise<void>;
  fetchMarginItems: (filters: AccountingFilters & { search?: string; page?: number; limit?: number }) => Promise<void>;
  updateItemCostPrice: (id: string, costPrice: number) => Promise<boolean>;
  fetchRecentSales: (filters: AccountingFilters & { page?: number; limit?: number }) => Promise<void>;
}

export const useAccountingStore = create<AccountingState>((set, get) => ({
  summary: null,
  summaryLoading: false,
  summaryError: false,

  marginItems: null,
  marginItemsTotal: 0,
  marginItemsLoading: false,
  marginItemsError: false,
  isSavingCostPrice: false,

  recentSales: null,
  recentSalesTotal: 0,
  recentSalesLoading: false,
  recentSalesError: false,

  fetchSummary: async (filters) => {
    set({ summaryLoading: true, summaryError: false });
    try {
      const summary = await accountingService.getSummary(filters);
      set({ summary, summaryLoading: false });
    } catch {
      set({ summaryLoading: false, summaryError: true });
    }
  },

  fetchMarginItems: async (filters) => {
    set({ marginItemsLoading: true, marginItemsError: false });
    try {
      const { items, total } = await accountingService.getItemMargins(filters);
      set({ marginItems: items, marginItemsTotal: total, marginItemsLoading: false });
    } catch {
      set({ marginItemsLoading: false, marginItemsError: true });
    }
  },

  updateItemCostPrice: async (id, costPrice) => {
    set({ isSavingCostPrice: true });
    try {
      const updated = await accountingService.updateItemCostPrice(id, { costPrice });
      set((state) => ({
        isSavingCostPrice: false,
        marginItems: state.marginItems ? state.marginItems.map((m) => (m.id === id ? updated : m)) : state.marginItems,
      }));
      toast.success('Cost price updated.');
      return true;
    } catch (error) {
      set({ isSavingCostPrice: false });
      toast.error(extractErrorMessage(error, 'Could not update cost price.'));
      return false;
    }
  },

  fetchRecentSales: async (filters) => {
    set({ recentSalesLoading: true, recentSalesError: false });
    try {
      const { items, total } = await accountingService.getRecentSales(filters);
      set({ recentSales: items, recentSalesTotal: total, recentSalesLoading: false });
    } catch {
      set({ recentSalesLoading: false, recentSalesError: true });
    }
  },
}));