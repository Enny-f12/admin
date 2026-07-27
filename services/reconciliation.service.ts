import { apiClient } from '@/lib/api-client';
import {
  ReconciliationItem,
  StaffMember,
  AdjustReconciliationPayload,
  SyncReconciliationPayload,
  SyncReconciliationResponse,
} from '@/types/reconciliation.types';

export const reconciliationService = {
  // NOT YET BUILT — backend request doc B1
  getItems: (params: { date?: string; conductedBy?: string; search?: string; category?: string; page?: number; pageSize?: number }) =>
    apiClient
      .get<{ items: ReconciliationItem[]; total: number }>('/admin/reconciliation/items', { params })
      .then((r) => r.data),

  // NOT YET BUILT — backend request doc B2
  getStaff: () => apiClient.get<StaffMember[]>('/admin/reconciliation/staff').then((r) => r.data),

  // NOT YET BUILT — backend request doc B3
  adjustItem: (itemId: string, payload: AdjustReconciliationPayload) =>
    apiClient
      .post<ReconciliationItem>(`/admin/reconciliation/items/${itemId}/adjust`, payload)
      .then((r) => r.data),

  // NOT YET BUILT — backend request doc B4
  sync: (payload: SyncReconciliationPayload) =>
    apiClient
      .post<SyncReconciliationResponse>('/admin/reconciliation/sync', payload)
      .then((r) => r.data),
};