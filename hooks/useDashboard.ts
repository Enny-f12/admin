// hooks/useDashboard.ts
// hooks/useDashboard.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  DashboardSummary,
  SalesTrendPoint,
  PopularItem,
  OrderDistribution,
  DashboardCustomersResponse,
  LowStockAlert,
  AuditLogEntry,
  AdminOrder,
  AdminOrdersFilters,
} from '@/types/dashboard';


/* ────────────────────────────────────────────────────────────
   All dashboard-related data fetching lives here — one file,
   one place to look. Each hook is independent; the query key
   is what actually separates them in the cache.
   ──────────────────────────────────────────────────────────── */

// ── Summary (LIVE — backend has this) ──
export function useDashboardSummary(vendorId?: string) {
  return useQuery({
    queryKey: ['dashboard', 'summary', vendorId],
    queryFn: () =>
      apiClient
        .get<DashboardSummary>('/admin/dashboard/summary', { params: { vendorId } })
        .then((r) => r.data),
    meta: { errorMessage: 'Could not load dashboard summary' },
  });
}

// ── Sales trends (LIVE — backend has this, no UI slot yet) ──
export function useSalesTrends(vendorId?: string, days = 7) {
  return useQuery({
    queryKey: ['dashboard', 'sales', vendorId, days],
    queryFn: () =>
      apiClient
        .get<SalesTrendPoint[]>('/admin/dashboard/sales', { params: { vendorId, days } })
        .then((r) => r.data),
    meta: { errorMessage: 'Could not load sales trends' },
  });
}

// ── Popular items (LIVE — backend has this, no UI slot yet) ──
export function usePopularItems(vendorId?: string, limit = 5) {
  return useQuery({
    queryKey: ['dashboard', 'popular', vendorId, limit],
    queryFn: () =>
      apiClient
        .get<PopularItem[]>('/admin/dashboard/popular', { params: { vendorId, limit } })
        .then((r) => r.data),
    meta: { errorMessage: 'Could not load popular items' },
  });
}

// ── Order type distribution (LIVE — backend has this, no UI slot yet) ──
export function useOrderDistribution(vendorId?: string) {
  return useQuery({
    queryKey: ['dashboard', 'distribution', vendorId],
    queryFn: () =>
      apiClient
        .get<OrderDistribution[]>('/admin/dashboard/distribution', { params: { vendorId } })
        .then((r) => r.data),
    meta: { errorMessage: 'Could not load order distribution' },
  });
}

// ── Customers (LIVE — backend has this; `total` field pending, see request doc #4) ──
export function useDashboardCustomers(vendorId?: string, page = 1, limit = 10) {
  return useQuery({
    queryKey: ['dashboard', 'customers', vendorId, page, limit],
    queryFn: () =>
      apiClient
        .get<DashboardCustomersResponse>('/admin/dashboard/customers', {
          params: { vendorId, page, limit },
        })
        .then((r) => r.data),
    meta: { errorMessage: 'Could not load customers' },
  });
}

// ── Low stock alerts (NOT YET BUILT — backend request doc #1) ──
export function useLowStockAlerts(branchId?: string) {
  return useQuery({
    queryKey: ['inventory', 'alerts', branchId],
    queryFn: () =>
      apiClient
        .get<LowStockAlert[]>('/admin/inventory/alerts', { params: { branchId } })
        .then((r) => r.data),
    retry: false, // endpoint doesn't exist yet — don't hammer it, fail fast
    meta: { errorMessage: null }, // silent — see note below
  });
}

// ── Recent audit log / activity feed (NOT YET BUILT — backend request doc #2) ──
export function useRecentAuditLogs(limit = 10, branchId?: string) {
  return useQuery({
    queryKey: ['auditLogs', 'recent', limit, branchId],
    queryFn: () =>
      apiClient
        .get<AuditLogEntry[]>('/admin/audit-logs', { params: { limit, branchId } })
        .then((r) => r.data),
    retry: false,
    meta: { errorMessage: null },
  });
}

// ── Admin orders list (LIVE route exists, response shape unconfirmed — request doc #5) ──
export function useAdminOrders(filters: AdminOrdersFilters = {}) {
  return useQuery({
    queryKey: ['admin', 'orders', filters],
    queryFn: () =>
      apiClient.get<AdminOrder[]>('/admin/orders', { params: filters }).then((r) => r.data),
    retry: false,
    meta: { errorMessage: null },
  });
}