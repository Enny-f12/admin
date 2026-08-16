// services/audit-log.service.ts
import { apiClient } from '@/lib/api-client';
import {
  AuditLogsResponse,
  AuditLogFilters,
  AuditLogActionType,
  AuditLogUser,
  AuditLogExportFilters,
} from '@/types/audit-log.types';

export const auditLogService = {
  // NOT YET BUILT — backend request doc #1
  getLogs: (filters: AuditLogFilters) =>
    apiClient.get<AuditLogsResponse>('/admin/audit-logs', { params: filters }).then((r) => r.data),

  // NOT YET BUILT — backend request doc #2
  getActionTypes: () =>
    apiClient.get<AuditLogActionType[]>('/admin/audit-logs/action-types').then((r) => r.data),

  // NOT YET BUILT — backend request doc #3
  getUsers: () =>
    apiClient.get<AuditLogUser[]>('/admin/audit-logs/users').then((r) => r.data),

  // NOT YET BUILT — backend request doc #5
  exportLogs: (filters: AuditLogExportFilters) =>
    apiClient
      .get('/admin/audit-logs/export', { params: filters, responseType: 'blob' })
      .then((r) => r.data as Blob),
};