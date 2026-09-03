// services/order.service.ts
import { apiClient } from '@/lib/api-client';
import { AdminOrder, AdminOrderFilters, UpdateOrderStatusPayload } from '@/types/orders';

// Strips undefined/null/empty-string values so a filter object never
// serializes into a query param with no value (e.g. `?branchId=`),
// which the backend rejects with a 400.
function cleanParams<T extends object>(params: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  ) as Partial<T>;
}

export const orderService = {
  getAdminOrders: (filters: AdminOrderFilters = {}) =>
    apiClient.get<AdminOrder[]>('/admin/orders', { params: cleanParams(filters) }).then((r) => r.data),

  updateStatus: (id: string, payload: UpdateOrderStatusPayload) =>
    apiClient.patch<AdminOrder>(`/admin/orders/${id}/status`, payload).then((r) => r.data),
};