import { apiClient } from '@/lib/api-client';
import {
  KitchenOrder,
  CompletedKitchenOrder,
  KitchenDisplaySettings,
  UpdateKitchenSettingsPayload,
} from '@/types/kitchen.types';

// All four endpoints confirmed live -- the "NOT YET BUILT" comments were
// stale and are removed.
//
// branchId added to all four -- a kitchen display is physically one
// screen at one branch, so unlike Stock/Orders this has no "All
// Branches" mode. Pending backend confirmation these params are
// actually accepted -- same open request as the other inventory/order
// endpoints.
export const kitchenService = {
  getLiveQueue: (branchId?: string) =>
    apiClient
      .get<KitchenOrder[]>('/admin/kitchen/orders', { params: { branchId } })
      .then((r) => r.data),

  getCompleted: (minutes = 30, branchId?: string) =>
    apiClient
      .get<CompletedKitchenOrder[]>('/admin/kitchen/completed', { params: { minutes, branchId } })
      .then((r) => r.data),

  getSettings: (branchId?: string) =>
    apiClient
      .get<KitchenDisplaySettings>('/admin/kitchen/settings', { params: { branchId } })
      .then((r) => r.data),

  updateSettings: (payload: UpdateKitchenSettingsPayload, branchId?: string) =>
    apiClient
      .put<KitchenDisplaySettings>('/admin/kitchen/settings', { ...payload, branchId })
      .then((r) => r.data),
};