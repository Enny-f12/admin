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
  AddStockPayload,
} from '@/types/stock.types';

export const stockService = {
  getItems: (branchId?: string, search?: string) =>
    apiClient
      .get<StockItem[]>('/admin/stock/items', { params: { branchId, search } })
      .then((r) => r.data),

  getBranches: () => apiClient.get<Branch[]>('/admin/branches').then((r) => r.data),

  getStockAlerts: (branchId?: string) =>
    apiClient
      .get<StockAlert[]>('/admin/stock/alerts', { params: { branchId } })
      .then((r) => r.data),

  adjustStock: (payload: AdjustStockPayload) =>
    apiClient.post<StockItem>('/admin/stock/adjust', payload).then((r) => r.data),

  // Registers a brand-new item — confirmed against the live Swagger
  // schema for POST /admin/stock/add (see AddStockPayload comment).
  addStock: (payload: AddStockPayload) =>
    apiClient.post<StockItem>('/admin/stock/add', payload).then((r) => r.data),

  transferStock: (payload: TransferStockPayload) =>
    apiClient
      .post<{ from: StockItem; to: StockItem }>('/admin/stock/transfer', payload)
      .then((r) => r.data),

  removeStock: (payload: RemoveStockPayload) =>
    apiClient.post<StockItem>('/admin/stock/remove', payload).then((r) => r.data),

  getSuppliers: () => apiClient.get<Supplier[]>('/admin/suppliers').then((r) => r.data),

  addSupplier: (payload: AddSupplierPayload) =>
    apiClient.post<Supplier>('/admin/suppliers', payload).then((r) => r.data),

  getThresholds: (branchId?: string) =>
    apiClient
      .get<StockThresholdConfig>('/admin/stock/thresholds', { params: { branchId } })
      .then((r) => r.data),

  saveThresholds: (payload: SaveStockThresholdsPayload) =>
    apiClient.put<StockThresholdConfig>('/admin/stock/thresholds', payload).then((r) => r.data),
};