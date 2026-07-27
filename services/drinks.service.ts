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

export const drinksService = {
  // NOT YET BUILT — backend request doc #1
  getItems: (search?: string) =>
    apiClient.get<DrinksItem[]>('/admin/drinks/items', { params: { search } }).then((r) => r.data),

  // NOT YET BUILT — backend request doc #2
  createDelivery: (payload: CreateDeliveryPayload) =>
    apiClient
      .post<CreateDeliveryResponse>('/admin/drinks/deliveries', payload)
      .then((r) => r.data),

  // NOT YET BUILT — backend request doc #3
  transferToFridge: (payload: TransferToFridgePayload) =>
    apiClient
      .post<DrinksItem>('/admin/drinks/transfer-to-fridge', payload)
      .then((r) => r.data),

  // NOT YET BUILT — backend request doc #4
  getThresholds: () =>
    apiClient.get<FridgeThresholdConfig>('/admin/drinks/thresholds').then((r) => r.data),

  // NOT YET BUILT — backend request doc #4
  saveThresholds: (payload: SaveFridgeThresholdsPayload) =>
    apiClient.put<FridgeThresholdConfig>('/admin/drinks/thresholds', payload).then((r) => r.data),

  // NOT YET BUILT — backend request doc #5 (shared endpoint, extended schema)
  getSuppliers: () => apiClient.get<Supplier[]>('/admin/suppliers').then((r) => r.data),

  addSupplier: (payload: AddSupplierPayload) =>
    apiClient.post<Supplier>('/admin/suppliers', payload).then((r) => r.data),

  // add these to the existing drinksService object

// NOT YET BUILT — backend request doc #4
getInventorySummary: (params: { search?: string; status?: string; page?: number; pageSize?: number }) =>
  apiClient
    .get<DrinksInventoryResponse>('/admin/drinks/inventory-summary', { params })
    .then((r) => r.data),

// NOT YET BUILT — backend request doc #5
adjustWarehouseStock: (payload: AdjustWarehousePayload) =>
  apiClient.post<DrinksInventoryItem>('/admin/drinks/adjust-warehouse', payload).then((r) => r.data),
};

