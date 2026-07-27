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
  // NOT YET BUILT — backend request doc #1
  searchCustomers: (search: string) =>
    apiClient.get<WalkInCustomer[]>('/admin/walk-in/customers', { params: { search } }).then((r) => r.data),

  // NOT YET BUILT — backend request doc #2
  createCustomer: (payload: CreateWalkInCustomerPayload) =>
    apiClient.post<WalkInCustomer>('/admin/walk-in/customers', payload).then((r) => r.data),

  // NOT YET BUILT — backend request doc #3
  searchMenuItems: (search: string) =>
    apiClient.get<MenuItem[]>('/admin/walk-in/menu-items', { params: { search } }).then((r) => r.data),

  // NOT YET BUILT — backend request doc #4
  createOrder: (payload: CreateWalkInOrderPayload) =>
    apiClient
      .post<{ id: string; orderNumber: string }>('/admin/walk-in/orders', payload)
      .then((r) => r.data),

  // NOT YET BUILT — backend request doc #5
  getBlacklist: () => apiClient.get<BlacklistEntry[]>('/admin/walk-in/blacklist').then((r) => r.data),

  // NOT YET BUILT — backend request doc #5
  addToBlacklist: (payload: AddToBlacklistPayload) =>
    apiClient.post<BlacklistEntry>('/admin/walk-in/blacklist', payload).then((r) => r.data),

  // NOT YET BUILT — backend request doc #5
  removeFromBlacklist: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/admin/walk-in/blacklist/${id}`).then((r) => r.data),
};