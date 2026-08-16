// services/notification.service.ts
import { apiClient } from '@/lib/api-client';
import { Notification } from '@/types/notification';

export const notificationService = {
  getAll: () =>
    apiClient.get<Notification[]>('/notifications').then((r) => r.data),

  markAsRead: (id: string) =>
    apiClient.patch<Notification>(`/notifications/${id}/read`).then((r) => r.data),

  markAllAsRead: () =>
    apiClient.patch('/notifications/read-all').then((r) => r.data),
};