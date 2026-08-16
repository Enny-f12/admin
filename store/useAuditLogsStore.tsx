// store/useAuditLogStore.ts
import { create } from 'zustand';
import { toast } from 'sonner';
import { auditLogService } from '@/services/audit-logs.service';
import {
  AuditLogEntry,
  AuditLogFilters,
  AuditLogActionType,
  AuditLogUser,
  AuditLogExportFilters,
} from '@/types/audit-log.types';

function extractErrorMessage(error: unknown, fallback: string) {
  const anyErr = error as any;
  return anyErr?.response?.data?.message ?? anyErr?.message ?? fallback;
}

interface AuditLogState {
  logs: AuditLogEntry[] | null;
  logsTotal: number;
  logsLoading: boolean;
  logsError: boolean;

  actionTypes: AuditLogActionType[] | null;
  actionTypesLoading: boolean;

  users: AuditLogUser[] | null;
  usersLoading: boolean;

  isExporting: boolean;

  fetchLogs: (filters: AuditLogFilters) => Promise<void>;
  fetchActionTypes: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  exportLogs: (filters: AuditLogExportFilters) => Promise<void>;
}

export const useAuditLogStore = create<AuditLogState>((set) => ({
  logs: null,
  logsTotal: 0,
  logsLoading: false,
  logsError: false,

  actionTypes: null,
  actionTypesLoading: false,

  users: null,
  usersLoading: false,

  isExporting: false,

  fetchLogs: async (filters) => {
    set({ logsLoading: true, logsError: false });
    try {
      const { items, total } = await auditLogService.getLogs(filters);
      set({ logs: items, logsTotal: total, logsLoading: false });
    } catch {
      set({ logsLoading: false, logsError: true });
    }
  },

  fetchActionTypes: async () => {
    set({ actionTypesLoading: true });
    try {
      const actionTypes = await auditLogService.getActionTypes();
      set({ actionTypes, actionTypesLoading: false });
    } catch {
      set({ actionTypesLoading: false });
    }
  },

  fetchUsers: async () => {
    set({ usersLoading: true });
    try {
      const users = await auditLogService.getUsers();
      set({ users, usersLoading: false });
    } catch {
      set({ usersLoading: false });
    }
  },

  exportLogs: async (filters) => {
    set({ isExporting: true });
    try {
      const blob = await auditLogService.exportLogs(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs.${filters.format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      set({ isExporting: false });
      toast.success('Audit log exported.');
    } catch (error) {
      set({ isExporting: false });
      toast.error(extractErrorMessage(error, 'Could not export audit log.'));
    }
  },
}));