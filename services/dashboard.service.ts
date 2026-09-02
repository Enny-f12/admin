// services/dashboard.service.ts
import { apiClient } from '@/lib/api-client';
import {
  DashboardSummary,
  SalesTrendPoint,
  PopularItem,
  OrderDistribution,
  DashboardCustomersResponse,
  LowStockAlert,
  AuditLogsResponse,
  AdminOrder,
  AdminOrdersFilters,
  BranchPerformance,
  DashboardRange,
} from '@/types/dashboard';

export const dashboardService = {
  getSummary: (vendorId?: string, branchId?: string) =>
    apiClient
      .get<DashboardSummary>('/admin/dashboard/summary', { params: { vendorId, branchId } })
      .then((r) => r.data),

  // NEW endpoint — replaces the old /admin/dashboard/sales stub.
  getSalesTrends: (branchId?: string, days: 7 | 14 | 30 = 7) =>
    apiClient
      .get<SalesTrendPoint[]>('/admin/dashboard/sales-trend', { params: { branchId, days } })
      .then((r) => r.data),

  // NEW endpoint — replaces the old /admin/dashboard/popular stub.
  getTopItems: (branchId?: string, limit = 5) =>
    apiClient
      .get<PopularItem[]>('/admin/dashboard/top-items', { params: { branchId, limit } })
      .then((r) => r.data),

  // NEW endpoint — branch-vs-branch revenue/order comparison.
  getBranchPerformance: (range: DashboardRange = 'month', vendorId?: string) =>
    apiClient
      .get<BranchPerformance>('/admin/dashboard/branch-performance', {
        params: { range, vendorId },
      })
      .then((r) => r.data),

  // FIX: the API reference specifies `branchId` + `range` params here, not
  // `vendorId` — the previous signature would never actually filter by branch.
  getDistribution: (branchId?: string, range: DashboardRange = 'month') =>
    apiClient
      .get<OrderDistribution[]>('/admin/dashboard/distribution', {
        params: { branchId, range },
      })
      .then((r) => r.data),

  getCustomers: (vendorId?: string, page = 1, limit = 10) =>
    apiClient
      .get<DashboardCustomersResponse>('/admin/dashboard/customers', {
        params: { vendorId, page, limit },
      })
      .then((r) => r.data),

  getLowStockAlerts: (branchId?: string) =>
    apiClient
      .get<LowStockAlert[]>('/admin/inventory/alerts', { params: { branchId } })
      .then((r) => r.data),

  getRecentAuditLogs: (limit = 10, branchId?: string) =>
    apiClient
      .get<AuditLogsResponse>('/admin/audit-logs', { params: { limit, branchId } })
      .then((r) => r.data.items),

  getAdminOrders: (filters: AdminOrdersFilters = {}) =>
    apiClient.get<AdminOrder[]>('/admin/orders', { params: filters }).then((r) => r.data),
};