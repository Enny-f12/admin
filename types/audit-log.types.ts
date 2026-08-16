// types/audit-log.types.ts

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userName: string;
  branch: string;
  action: string;
  item: string;
}

export interface AuditLogFilters {
  branchId?: string;
  startDate?: string;
  endDate?: string;
  actionType?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogsResponse {
  items: AuditLogEntry[];
  total: number;
}

export interface AuditLogActionType {
  value: string;
  label: string;
}

export interface AuditLogUser {
  id: string;
  name: string;
}

export type AuditLogExportFormat = 'csv' | 'xlsx' | 'pdf';

export interface AuditLogExportFilters extends AuditLogFilters {
  format: AuditLogExportFormat;
}