// services/morning-count.service.ts
import { apiClient } from '@/lib/api-client';
import {
  MorningCountSheet,
  UpdateItemCurrentPayload,
  UpdateItemUomPayload,
  MorningCountAlertResponse,
  MorningCountAlertsFilters,
  MorningCountAuditLogsResponse,
  AuditLogFilters,
} from '@/types/morning-count.types';

export const morningCountService = {
  // A.2 — GET /admin/morning-count/sheet
  // NOTE: renamed from the earlier /morning-count/sheets — matches the
  // final backend doc exactly. Query param is `outletId`, not `branchId`.
  getSheet: (outletId: string, date: string) =>
    apiClient
      .get<MorningCountSheet>('/admin/morning-count/sheet', { params: { outletId, date } })
      .then((r) => r.data),

  updateItemCurrent: (sheetId: string, itemId: string, payload: UpdateItemCurrentPayload) =>
    apiClient
      .patch(`/admin/morning-count/${sheetId}/items/${itemId}`, payload)
      .then((r) => r.data),

  updateItemUom: (sheetId: string, itemId: string, payload: UpdateItemUomPayload) =>
    apiClient
      .patch(`/admin/morning-count/sheet/${sheetId}/items/${itemId}/uom`, payload)
      .then((r) => r.data),

  saveDraft: (sheetId: string) =>
    apiClient.post(`/admin/morning-count/sheet/${sheetId}/draft`).then((r) => r.data),

  submitCategory: (sheetId: string, categoryId: string) =>
    apiClient
      .post(`/admin/morning-count/sheet/${sheetId}/categories/${categoryId}/submit`)
      .then((r) => r.data),

  // A.3 — POST /admin/morning-count/sheet/:sheetId/resync-menu
  // Single endpoint, no body, returns the full updated sheet — replaces
  // the earlier two-endpoint (per-sheet + multi-branch) sync design.
  resyncMenu: (sheetId: string) =>
    apiClient
      .post<MorningCountSheet>(`/admin/morning-count/sheet/${sheetId}/resync-menu`)
      .then((r) => r.data),

  // B — GET /admin/dashboard/morning-count-alerts
  // Returns a bare array, not a wrapped object.
  getAlerts: (filters: MorningCountAlertsFilters) =>
    apiClient
      .get<MorningCountAlertResponse[]>('/admin/dashboard/morning-count-alerts', {
        params: {
          vendorId: filters.vendorId,
          date: filters.date,
          cutoffTime: filters.cutoffTime ?? '09:00',
        },
      })
      .then((r) => r.data),

  // C — GET /admin/morning-count/audit-logs
  getAuditLogs: (filters: AuditLogFilters) =>
    apiClient
      .get<MorningCountAuditLogsResponse>('/admin/morning-count/audit-logs', {
        params: {
          branchId: filters.branchId,
          staffId: filters.staffId,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          page: filters.page ?? 1,
          limit: filters.limit ?? 20,
        },
      })
      .then((r) => r.data),

  // C — GET /admin/morning-count/audit-logs/export
  exportAuditLogs: async (format: 'csv' | 'pdf', filters: Omit<AuditLogFilters, 'page' | 'limit'>) => {
    const res = await apiClient.get('/admin/morning-count/audit-logs/export', {
      params: { ...filters, format },
      responseType: 'blob',
    });
    const blob = new Blob([res.data]);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `morning-count-audit.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};