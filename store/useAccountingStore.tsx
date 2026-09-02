import { create } from 'zustand';
import { toast } from 'sonner';
import { accountingService } from '@/services/accounting.service';
import { stockService } from '@/services/stock.service';
import {
  AccountingSummary,
  AccountingFilters,
  MarginItem,
  RecentSale,
} from '@/types/accounting.types';

function extractErrorMessage(error: unknown, fallback: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // Now takes the full MarginItem (needs its id — used as StockItem.id —
  // and sellingPrice, to recompute marginPercent locally after the write,
  // since the Stock endpoint returns a StockItem, not a MarginItem).
  updateItemCostPrice: (item: MarginItem, costPrice: number) => Promise<boolean>;
  fetchRecentSales: (filters: AccountingFilters & { page?: number; limit?: number }) => Promise<void>;
}

export const useAccountingStore = create<AccountingState>((set) => ({
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

  // Routes through the SAME endpoint the Stock Inventory page uses —
  // PATCH /admin/stock/items/:itemId/cost-price — instead of a separate
  // accounting-owned one. There is exactly one place costPerUnit ever
  // gets written now, no matter which screen the edit started from.
  updateItemCostPrice: async (item, costPrice) => {
    set({ isSavingCostPrice: true });
    try {
      const updatedStockItem = await stockService.updateCostPrice({
        itemId: item.id,
        costPerUnit: costPrice,
      });
      const marginPercent =
        item.sellingPrice > 0
          ? Math.round(((item.sellingPrice - updatedStockItem.costPerUnit) / item.sellingPrice) * 100)
          : 0;
      set((state) => ({
        isSavingCostPrice: false,
        marginItems: state.marginItems
          ? state.marginItems.map((m) =>
              m.id === item.id ? { ...m, costPrice: updatedStockItem.costPerUnit, marginPercent } : m,
            )
          : state.marginItems,
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