// services/accounting.service.ts
import { apiClient } from '@/lib/api-client';
import {
  AccountingSummary,
  AccountingFilters,
  MarginItemsResponse,
  MarginItem,
  UpdateItemCostPricePayload,
  RecentSalesResponse,
} from '@/types/accounting.types';

export const accountingService = {
  // NOT YET BUILT — backend request doc #1
  getSummary: (filters: AccountingFilters) =>
    apiClient.get<AccountingSummary>('/admin/accounting/summary', { params: filters }).then((r) => r.data),

  // NOT YET BUILT — backend request doc #2
  getItemMargins: (filters: AccountingFilters & { search?: string; page?: number; limit?: number }) =>
    apiClient
      .get<MarginItemsResponse>('/admin/accounting/item-margins', { params: filters })
      .then((r) => r.data),

  // NOT YET BUILT — backend request doc #3
  updateItemCostPrice: (id: string, payload: UpdateItemCostPricePayload) =>
    apiClient.patch<MarginItem>(`/admin/accounting/item-margins/${id}`, payload).then((r) => r.data),

  // NOT YET BUILT — backend request doc #4
  getRecentSales: (filters: AccountingFilters & { page?: number; limit?: number }) =>
    apiClient
      .get<RecentSalesResponse>('/admin/accounting/recent-sales', { params: filters })
      .then((r) => r.data),
};