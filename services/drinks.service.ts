import { apiClient } from '@/lib/api-client';
import {
  DrinksItem,
  CreateDeliveryPayload,
  CreateDeliveryResponse,
  TransferToFridgePayload,
  FridgeThresholdConfig,
  SaveFridgeThresholdsPayload,
  Supplier,
  AddSupplierPayload,
  DrinksInventoryItem,
  AdjustWarehousePayload,
  DrinksInventoryResponse,
} from '@/types/drinks.types';

// branchId re-added across every drinks endpoint per confirmation that
// each branch has its own warehouse/fridge stock. This is a backend
// request pending as of 15-Aug-26 -- none of these endpoints accept
// branchId in the schema yet, so it is currently sent but ignored.
// Remove this comment once the backend request lands and behavior is
// confirmed live.
export const drinksService = {
  getItems: (branchId?: string, search?: string) =>
    apiClient
      .get<DrinksItem[]>('/admin/drinks/items', { params: { branchId, search } })
      .then((r) => r.data),

  createDelivery: (payload: CreateDeliveryPayload & { branchId?: string }) =>
    apiClient
      .post<CreateDeliveryResponse>('/admin/drinks/deliveries', payload)
      .then((r) => r.data),

  transferToFridge: (payload: TransferToFridgePayload & { branchId?: string }) =>
    apiClient
      .post<DrinksItem>('/admin/drinks/transfer-to-fridge', payload)
      .then((r) => r.data),

  getThresholds: (branchId?: string) =>
    apiClient
      .get<FridgeThresholdConfig>('/admin/drinks/thresholds', { params: { branchId } })
      .then((r) => r.data),

  saveThresholds: (payload: SaveFridgeThresholdsPayload & { branchId?: string }) =>
    apiClient.put<FridgeThresholdConfig>('/admin/drinks/thresholds', payload).then((r) => r.data),

  // Shared with stockService -- same pending branchId request as the
  // supplier endpoints, tracked separately.
  getSuppliers: () => apiClient.get<Supplier[]>('/admin/suppliers').then((r) => r.data),

  addSupplier: (payload: AddSupplierPayload) =>
    apiClient.post<Supplier>('/admin/suppliers', payload).then((r) => r.data),

  getInventorySummary: (params: { branchId?: string; search?: string; status?: string; page?: number; pageSize?: number }) =>
    apiClient
      .get<DrinksInventoryResponse>('/admin/drinks/inventory-summary', { params })
      .then((r) => r.data),

  adjustWarehouseStock: (payload: AdjustWarehousePayload & { branchId?: string }) =>
    apiClient.post<DrinksInventoryItem>('/admin/drinks/adjust-warehouse', payload).then((r) => r.data),
};