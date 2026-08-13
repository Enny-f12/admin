import { apiClient } from '@/lib/api-client';
import {
  WalkInCustomer,
  MenuItem,
  CreateWalkInOrderPayload,
  CreateWalkInCustomerPayload,
  BlacklistEntry,
  AddToBlacklistPayload,
} from '@/types/walk-in.types';

export const walkInService = {
  searchCustomers: (search: string) =>
    apiClient.get<WalkInCustomer[]>('/admin/walk-in/customers', { params: { search } }).then((r) => r.data),

  createCustomer: (payload: CreateWalkInCustomerPayload) =>
    apiClient.post<WalkInCustomer>('/admin/walk-in/customers', payload).then((r) => r.data),

  searchMenuItems: (search: string) =>
    apiClient.get<MenuItem[]>('/admin/walk-in/menu-items', { params: { search } }).then((r) => r.data),

  createOrder: (payload: CreateWalkInOrderPayload) =>
    apiClient
      .post<{ id: string; orderNumber: string }>('/admin/walk-in/orders', payload)
      .then((r) => r.data),

  // 500 on backend as of last check — request shape matches Swagger exactly
  // (no params). Server-side bug, not a client-side schema mismatch.
  getBlacklist: () => apiClient.get<BlacklistEntry[]>('/admin/walk-in/blacklist').then((r) => r.data),

  addToBlacklist: (payload: AddToBlacklistPayload) =>
    apiClient.post<BlacklistEntry>('/admin/walk-in/blacklist', payload).then((r) => r.data),

  removeFromBlacklist: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/admin/walk-in/blacklist/${id}`).then((r) => r.data),
};