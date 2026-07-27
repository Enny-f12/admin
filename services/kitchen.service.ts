import { apiClient } from '@/lib/api-client';
import {
  KitchenOrder,
  CompletedKitchenOrder,
  KitchenDisplaySettings,
  UpdateKitchenSettingsPayload,
} from '@/types/kitchen.types';

export const kitchenService = {
  // NOT YET BUILT
  getLiveQueue: () => apiClient.get<KitchenOrder[]>('/admin/kitchen/orders').then((r) => r.data),

  // NOT YET BUILT
  getCompleted: (minutes = 30) =>
    apiClient.get<CompletedKitchenOrder[]>('/admin/kitchen/completed', { params: { minutes } }).then((r) => r.data),

  // NOT YET BUILT
  getSettings: () => apiClient.get<KitchenDisplaySettings>('/admin/kitchen/settings').then((r) => r.data),

  // NOT YET BUILT
  updateSettings: (payload: UpdateKitchenSettingsPayload) =>
    apiClient.put<KitchenDisplaySettings>('/admin/kitchen/settings', payload).then((r) => r.data),
};