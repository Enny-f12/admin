import { apiClient } from '@/lib/api-client';
import {
  StockItem,
  Branch,
  StockAlert,
  Supplier,
  StockThresholdConfig,
  AdjustStockPayload,
  TransferStockPayload,
  RemoveStockPayload,
  AddSupplierPayload,
  SaveStockThresholdsPayload,
} from '@/types/stock.types';

export const stockService = {
  // NOT YET BUILT — backend request doc #1
  getItems: (branchId?: string, search?: string) =>
    apiClient
      .get<StockItem[]>('/admin/stock/items', { params: { branchId, search } })
      .then((r) => r.data),

  // NOT YET BUILT — backend request doc #2
  getBranches: () => apiClient.get<Branch[]>('/admin/branches').then((r) => r.data),

  // NOT YET BUILT — renamed from /admin/inventory/alerts, see dashboard request doc #1
  getStockAlerts: (branchId?: string) =>
    apiClient
      .get<StockAlert[]>('/admin/stock/alerts', { params: { branchId } })
      .then((r) => r.data),

  // NOT YET BUILT — backend request doc #3
  adjustStock: (payload: AdjustStockPayload) =>
    apiClient.post<StockItem>('/admin/stock/adjust', payload).then((r) => r.data),

  // NOT YET BUILT — backend request doc #4
  transferStock: (payload: TransferStockPayload) =>
    apiClient
      .post<{ from: StockItem; to: StockItem }>('/admin/stock/transfer', payload)
      .then((r) => r.data),

  // NOT YET BUILT — backend request doc #5
  removeStock: (payload: RemoveStockPayload) =>
    apiClient.post<StockItem>('/admin/stock/remove', payload).then((r) => r.data),

  // NOT YET BUILT — backend request doc #6
  getSuppliers: () => apiClient.get<Supplier[]>('/admin/suppliers').then((r) => r.data),

  // NOT YET BUILT — backend request doc #6
  addSupplier: (payload: AddSupplierPayload) =>
    apiClient.post<Supplier>('/admin/suppliers', payload).then((r) => r.data),

  // NOT YET BUILT — backend request doc #7
  getThresholds: (branchId?: string) =>
    apiClient
      .get<StockThresholdConfig>('/admin/stock/thresholds', { params: { branchId } })
      .then((r) => r.data),

  // NOT YET BUILT — backend request doc #7
  saveThresholds: (payload: SaveStockThresholdsPayload) =>
    apiClient.put<StockThresholdConfig>('/admin/stock/thresholds', payload).then((r) => r.data),
};