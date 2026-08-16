import { apiClient } from '@/lib/api-client';
import { FoodInventoryResponse, StatusBanner } from '@/types/food-inventory.types';

export const foodInventoryService = {
  // NOT YET BUILT — backend request doc #1
  getItems: (params: { branchId?: string; search?: string; category?: string; status?: string; page?: number; pageSize?: number }) =>
    apiClient
      .get<FoodInventoryResponse>('/admin/food-inventory/items', { params })
      .then((r) => r.data),

  // NOT YET BUILT — backend request doc #2
  getCategories: (branchId?: string) =>
    apiClient
      .get<string[]>('/admin/food-inventory/categories', { params: { branchId } })
      .then((r) => r.data),

  // NOT YET BUILT — backend request doc #3
  getStatusBanner: (branchId?: string) =>
    apiClient
      .get<StatusBanner>('/admin/inventory/status-banner', { params: { branchId } })
      .then((r) => r.data),
};