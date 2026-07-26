// services/order.service.ts
import { apiClient } from '@/lib/api-client';
import { AdminOrder, AdminOrderFilters, UpdateOrderStatusPayload } from '@/types/orders';

export const orderService = {
  getAdminOrders: (filters: AdminOrderFilters = {}) =>
    apiClient.get<AdminOrder[]>('/admin/orders', { params: filters }).then((r) => r.data),

  getAdminOrderDetails: (id: string) =>
    apiClient.get<AdminOrder>(`/admin/orders/${id}`).then((r) => r.data),

  updateStatus: (id: string, payload: UpdateOrderStatusPayload) =>
    apiClient.patch<AdminOrder>(`/admin/orders/${id}/status`, payload).then((r) => r.data),
};