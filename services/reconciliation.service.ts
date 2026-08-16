import { apiClient } from '@/lib/api-client';
import {
  ReconciliationItem,
  StaffMember,
  AdjustReconciliationPayload,
  SyncReconciliationPayload,
  SyncReconciliationResponse,
} from '@/types/reconciliation.types';

// All four endpoints confirmed LIVE (network tab, 15-Aug-26 -- real
// data returning 200 for every call). The "NOT YET BUILT" comments
// below were stale and are removed.
//
// branchId added to all four -- physical count reconciliation is
// inherently per-branch, same reasoning as Morning Count and Drinks &
// Fridge. getStaff's branchId is a judgment call (flagged): only needed
// if staff are branch-assigned rather than able to float between
// branches -- worth confirming with backend before assuming either way.
export const reconciliationService = {
  getItems: (params: { branchId?: string; date?: string; conductedBy?: string; search?: string; category?: string; page?: number; pageSize?: number }) =>
    apiClient
      .get<{ items: ReconciliationItem[]; total: number }>('/admin/reconciliation/items', { params })
      .then((r) => r.data),

  getStaff: (branchId?: string) =>
    apiClient
      .get<StaffMember[]>('/admin/reconciliation/staff', { params: { branchId } })
      .then((r) => r.data),

  adjustItem: (itemId: string, payload: AdjustReconciliationPayload & { branchId?: string }) =>
    apiClient
      .post<ReconciliationItem>(`/admin/reconciliation/items/${itemId}/adjust`, payload)
      .then((r) => r.data),

  sync: (payload: SyncReconciliationPayload & { branchId?: string }) =>
    apiClient
      .post<SyncReconciliationResponse>('/admin/reconciliation/sync', payload)
      .then((r) => r.data),
};