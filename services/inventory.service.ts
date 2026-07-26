// services/inventory.service.ts
import { apiClient } from '@/lib/api-client';
import {
  InventoryItem,
  InventoryCategory,
  AdjustStockPayload,
  TransferBranchPayload,
  TransferZonePayload,
  ReceiveDeliveryPayload,
  WastagePayload,
  ThresholdConfig,
  Supplier,
  CreateSupplierPayload,
  MorningCount,
  SubmitMorningCountPayload,
} from '@/types/inventory';

export const inventoryService = {
  getInventory: (branchId?: string, categoryId?: string) =>
    apiClient
      .get<InventoryItem[]>('/admin/inventory', { params: { branchId, categoryId } })
      .then((r) => r.data),

  getItem: (id: string) =>
    apiClient.get<InventoryItem>(`/admin/inventory/${id}`).then((r) => r.data),

  getCategories: () =>
    apiClient.get<InventoryCategory[]>('/admin/inventory/categories').then((r) => r.data),

  adjustStock: (id: string, payload: AdjustStockPayload) =>
    apiClient.post<InventoryItem>(`/admin/inventory/${id}/adjust`, payload).then((r) => r.data),

  transferBetweenBranches: (id: string, payload: TransferBranchPayload) =>
    apiClient.post<{ success: boolean }>(`/admin/inventory/${id}/transfer-branch`, payload).then((r) => r.data),

  transferToFridge: (id: string, payload: TransferZonePayload) =>
    apiClient.post<InventoryItem>(`/admin/inventory/${id}/transfer-zone`, payload).then((r) => r.data),

  receiveDelivery: (payload: ReceiveDeliveryPayload) =>
    apiClient.post<{ success: boolean }>('/admin/inventory/deliveries', payload).then((r) => r.data),

  removeWastage: (id: string, payload: WastagePayload) =>
    apiClient.post<InventoryItem>(`/admin/inventory/${id}/wastage`, payload).then((r) => r.data),

  getThresholds: (branchId?: string) =>
    apiClient
      .get<ThresholdConfig[]>('/admin/inventory/thresholds', { params: { branchId } })
      .then((r) => r.data),

  updateThresholds: (rows: ThresholdConfig[]) =>
    apiClient.patch<{ success: boolean }>('/admin/inventory/thresholds', { rows }).then((r) => r.data),

  getSuppliers: () =>
    apiClient.get<Supplier[]>('/admin/suppliers').then((r) => r.data),

  createSupplier: (payload: CreateSupplierPayload) =>
    apiClient.post<Supplier>('/admin/suppliers', payload).then((r) => r.data),

  getMorningCount: (branchId: string) =>
    apiClient.get<MorningCount>('/admin/inventory/morning-count', { params: { branchId } }).then((r) => r.data),

  submitMorningCount: (id: string, payload: SubmitMorningCountPayload) =>
    apiClient.post<MorningCount>(`/admin/inventory/morning-count/${id}/submit`, payload).then((r) => r.data),
};