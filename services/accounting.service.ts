// services/accounting.service.ts
import { apiClient } from '@/lib/api-client';
import {
  AccountingSummary,
  AccountingFilters,
  MarginItemsResponse,
  RecentSalesResponse,
} from '@/types/accounting.types';

export const accountingService = {
  // NOT YET BUILT — backend request doc #1
  getSummary: (filters: AccountingFilters) =>
    apiClient.get<AccountingSummary>('/admin/accounting/summary', { params: filters }).then((r) => r.data),

  // NOT YET BUILT — backend request doc #2. Response items[] must include
  // menuItemId (see types/accounting.types.ts) so cost-price edits can be
  // routed to stockService.updateCostPrice instead of a separate endpoint.
  getItemMargins: (filters: AccountingFilters & { search?: string; page?: number; limit?: number }) =>
    apiClient
      .get<MarginItemsResponse>('/admin/accounting/item-margins', { params: filters })
      .then((r) => r.data),

  // NOT YET BUILT — backend request doc #4
  getRecentSales: (filters: AccountingFilters & { page?: number; limit?: number }) =>
    apiClient
      .get<RecentSalesResponse>('/admin/accounting/recent-sales', { params: filters })
      .then((r) => r.data),

  /*
   * ── REMOVED: updateItemCostPrice ──
   * PATCH /admin/accounting/item-margins/:id set the same underlying
   * costPerUnit value that PATCH /admin/stock/items/:itemId/cost-price
   * (Stock backend doc, Section F) already owns — two write paths for
   * one number is exactly the bug pattern this whole app has been fixed
   * for elsewhere. Cost price edits from this page now go through
   * stockService.updateCostPrice directly — see useAccountingStore.ts.
   *
   * updateItemCostPrice: (id: string, payload: UpdateItemCostPricePayload) =>
   *   apiClient.patch<MarginItem>(`/admin/accounting/item-margins/${id}`, payload).then((r) => r.data),
   */
};