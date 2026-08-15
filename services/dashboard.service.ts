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
} from '@/types/dashboard';

export const dashboardService = {
  getSummary: (vendorId?: string, branchId?: string) =>
    apiClient
      .get<DashboardSummary>('/admin/dashboard/summary', { params: { vendorId, branchId } })
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