// services/dashboard.service.ts
import { apiClient } from '@/lib/api-client';
import {
  DashboardSummary,
  SalesTrendPoint,
  PopularItem,
  OrderDistribution,
  DashboardCustomer,
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
      .get<DashboardCustomer[]>('/admin/dashboard/customers', { params: { vendorId, page, limit } })
      .then((r) => r.data),
};