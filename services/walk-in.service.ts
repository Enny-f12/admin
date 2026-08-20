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
  searchCustomers: (search: string, branchId?: string) =>
    apiClient
      .get<WalkInCustomer[]>('/admin/walk-in/customers', { params: { search, branchId } })
      .then((r) => r.data),

  createCustomer: (payload: CreateWalkInCustomerPayload & { branchId?: string }) =>
    apiClient.post<WalkInCustomer>('/admin/walk-in/customers', payload).then((r) => r.data),

  searchMenuItems: (search: string, branchId?: string) =>
    apiClient
      .get<MenuItem[]>('/admin/walk-in/menu-items', { params: { search, branchId } })
      .then((r) => r.data),

  createOrder: (payload: CreateWalkInOrderPayload & { branchId?: string }) =>
    apiClient
      .post<{ id: string; orderNumber: string }>('/admin/walk-in/orders', payload)
      .then((r) => r.data),

  getBlacklist: (branchId?: string) =>
    apiClient
      .get<BlacklistEntry[]>('/admin/walk-in/blacklist', { params: { branchId } })
      .then((r) => r.data),

  addToBlacklist: (payload: AddToBlacklistPayload & { branchId?: string }) =>
    apiClient.post<BlacklistEntry>('/admin/walk-in/blacklist', payload).then((r) => r.data),

  removeFromBlacklist: (id: string, branchId?: string) =>
    apiClient
      .delete<{ success: boolean }>(`/admin/walk-in/blacklist/${id}`, { params: { branchId } })
      .then((r) => r.data),
};