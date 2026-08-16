import { apiClient } from '@/lib/api-client';
import {
  WalkInCustomer,
  MenuItem,
  CreateWalkInOrderPayload,
  CreateWalkInCustomerPayload,
  BlacklistEntry,
  AddToBlacklistPayload,
} from '@/types/walk-in.types';

// branchId added to every call -- walk-in order creation is physically
// tied to one branch (order.branchId is required server-side, confirmed
// by the Prisma create trace), so unlike Stock/Orders this whole flow
// needs a specific branch, not an "All Branches" aggregate. Pending
// backend confirmation these params are actually accepted -- same open
// request as stock/drinks/suppliers/reconciliation.
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

  // 500 on backend as of last check -- request shape matches Swagger exactly
  // (no params). Server-side bug, not a client-side schema mismatch.
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