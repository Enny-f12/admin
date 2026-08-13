// services/dashboard.service.ts
import { apiClient } from '@/lib/api-client';
import {
  DashboardSummary,
  SalesTrendPoint,
  PopularItem,
  OrderDistribution,
  DashboardCustomersResponse,
  LowStockAlert,
  AuditLogEntry,
  AuditLogsResponse,
  AdminOrder,
  AdminOrdersFilters,
} from '@/types/dashboard';

export const dashboardService = {
  getSummary: (vendorId?: string) =>
    apiClient
      .get<DashboardSummary>('/admin/dashboard/summary', { params: { vendorId } })
      .then((r) => r.data),

  getSalesTrends: (vendorId?: string, days = 7) =>
    apiClient
      .get<SalesTrendPoint[]>('/admin/dashboard/sales', { params: { vendorId, days } })
      .then((r) => r.data),

  getPopularItems: (vendorId?: string, limit = 5) =>
    apiClient
      .get<PopularItem[]>('/admin/dashboard/popular', { params: { vendorId, limit } })
      .then((r) => r.data),

  getDistribution: (vendorId?: string) =>
    apiClient
      .get<OrderDistribution[]>('/admin/dashboard/distribution', { params: { vendorId } })
      .then((r) => r.data),

  getCustomers: (vendorId?: string, page = 1, limit = 10) =>
    apiClient
      .get<DashboardCustomersResponse>('/admin/dashboard/customers', {
        params: { vendorId, page, limit },
      })
      .then((r) => r.data),

  // NOT YET BUILT — backend request doc #1
  getLowStockAlerts: (branchId?: string) =>
    apiClient
      .get<LowStockAlert[]>('/admin/inventory/alerts', { params: { branchId } })
      .then((r) => r.data),

  // CONFIRMED LIVE — real response is { items, total }, not a bare array.
  // Unwrap here so the store/page keep working with AuditLogEntry[]
  // directly, same pattern used for GET /admin/reservations elsewhere.
  getRecentAuditLogs: (limit = 10, branchId?: string) =>
    apiClient
      .get<AuditLogsResponse>('/admin/audit-logs', { params: { limit, branchId } })
      .then((r) => r.data.items),

  // CONFIRMED — `limit` is rejected by this endpoint's DTO (400:
  // "property limit should not exist"). Do not pass `limit` in filters;
  // AdminOrdersFilters no longer has that field to prevent regressions.
  getAdminOrders: (filters: AdminOrdersFilters = {}) =>
    apiClient.get<AdminOrder[]>('/admin/orders', { params: filters }).then((r) => r.data),
};