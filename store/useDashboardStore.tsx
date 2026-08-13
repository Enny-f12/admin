// store/useDashboardStore.ts
import { create } from 'zustand';
import { toast } from 'sonner';
import { dashboardService } from '@/services/dashboard.service';
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

function extractErrorMessage(error: unknown, fallback: string) {
  const anyErr = error as any;
  return anyErr?.response?.data?.message ?? anyErr?.message ?? fallback;
}

interface DashboardState {
  // Summary
  summary: DashboardSummary | null;
  summaryLoading: boolean;
  summaryError: boolean;

  // Sales trends
  salesTrends: SalesTrendPoint[] | null;
  salesTrendsLoading: boolean;
  salesTrendsError: boolean;

  // Popular items
  popularItems: PopularItem[] | null;
  popularItemsLoading: boolean;
  popularItemsError: boolean;

  // Order distribution
  distribution: OrderDistribution[] | null;
  distributionLoading: boolean;
  distributionError: boolean;

  // Customers
  customers: DashboardCustomersResponse | null;
  customersLoading: boolean;
  customersError: boolean;

  // Low stock (not yet built — silent errors)
  lowStock: LowStockAlert[] | null;
  lowStockLoading: boolean;
  lowStockError: boolean;

  // Audit logs (confirmed live — service unwraps { items, total } to AuditLogEntry[])
  auditLogs: AuditLogEntry[] | null;
  auditLogsLoading: boolean;
  auditLogsError: boolean;

  // Admin orders
  orders: AdminOrder[] | null;
  ordersLoading: boolean;
  ordersError: boolean;

  fetchSummary: (vendorId?: string) => Promise<void>;
  fetchSalesTrends: (vendorId?: string, days?: number) => Promise<void>;
  fetchPopularItems: (vendorId?: string, limit?: number) => Promise<void>;
  fetchDistribution: (vendorId?: string) => Promise<void>;
  fetchCustomers: (vendorId?: string, page?: number, limit?: number) => Promise<void>;
  fetchLowStockAlerts: (branchId?: string) => Promise<void>;
  fetchRecentAuditLogs: (limit?: number, branchId?: string) => Promise<void>;
  fetchAdminOrders: (filters?: AdminOrdersFilters) => Promise<void>;

  // Convenience: fires everything the dashboard page needs on mount
  fetchAll: (vendorId?: string) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  summary: null,
  summaryLoading: false,
  summaryError: false,

  salesTrends: null,
  salesTrendsLoading: false,
  salesTrendsError: false,

  popularItems: null,
  popularItemsLoading: false,
  popularItemsError: false,

  distribution: null,
  distributionLoading: false,
  distributionError: false,

  customers: null,
  customersLoading: false,
  customersError: false,

  lowStock: null,
  lowStockLoading: false,
  lowStockError: false,

  auditLogs: null,
  auditLogsLoading: false,
  auditLogsError: false,

  orders: null,
  ordersLoading: false,
  ordersError: false,

  fetchSummary: async (vendorId) => {
    set({ summaryLoading: true, summaryError: false });
    try {
      const summary = await dashboardService.getSummary(vendorId);
      set({ summary, summaryLoading: false });
    } catch (error) {
      set({ summaryLoading: false, summaryError: true });
      toast.error(extractErrorMessage(error, 'Could not load dashboard summary'));
    }
  },

  fetchSalesTrends: async (vendorId, days = 7) => {
    set({ salesTrendsLoading: true, salesTrendsError: false });
    try {
      const salesTrends = await dashboardService.getSalesTrends(vendorId, days);
      set({ salesTrends, salesTrendsLoading: false });
    } catch (error) {
      set({ salesTrendsLoading: false, salesTrendsError: true });
      toast.error(extractErrorMessage(error, 'Could not load sales trends'));
    }
  },

  fetchPopularItems: async (vendorId, limit = 5) => {
    set({ popularItemsLoading: true, popularItemsError: false });
    try {
      const popularItems = await dashboardService.getPopularItems(vendorId, limit);
      set({ popularItems, popularItemsLoading: false });
    } catch (error) {
      set({ popularItemsLoading: false, popularItemsError: true });
      toast.error(extractErrorMessage(error, 'Could not load popular items'));
    }
  },

  fetchDistribution: async (vendorId) => {
    set({ distributionLoading: true, distributionError: false });
    try {
      const distribution = await dashboardService.getDistribution(vendorId);
      set({ distribution, distributionLoading: false });
    } catch (error) {
      set({ distributionLoading: false, distributionError: true });
      toast.error(extractErrorMessage(error, 'Could not load order distribution'));
    }
  },

  fetchCustomers: async (vendorId, page = 1, limit = 10) => {
    set({ customersLoading: true, customersError: false });
    try {
      const customers = await dashboardService.getCustomers(vendorId, page, limit);
      set({ customers, customersLoading: false });
    } catch (error) {
      set({ customersLoading: false, customersError: true });
      toast.error(extractErrorMessage(error, 'Could not load customers'));
    }
  },

  // NOT YET BUILT — fail silently, no toast, no retry loop
  fetchLowStockAlerts: async (branchId) => {
    set({ lowStockLoading: true, lowStockError: false });
    try {
      const lowStock = await dashboardService.getLowStockAlerts(branchId);
      set({ lowStock, lowStockLoading: false });
    } catch {
      set({ lowStockLoading: false, lowStockError: true });
    }
  },

  // CONFIRMED LIVE — service unwraps { items, total } before this resolves,
  // so `auditLogs` here is always AuditLogEntry[] | null, never the wrapper.
  fetchRecentAuditLogs: async (limit = 10, branchId) => {
    set({ auditLogsLoading: true, auditLogsError: false });
    try {
      const auditLogs = await dashboardService.getRecentAuditLogs(limit, branchId);
      set({ auditLogs, auditLogsLoading: false });
    } catch {
      set({ auditLogsLoading: false, auditLogsError: true });
    }
  },

  // Shape unconfirmed — fail silently for now, per request doc #5
  fetchAdminOrders: async (filters = {}) => {
    set({ ordersLoading: true, ordersError: false });
    try {
      const orders = await dashboardService.getAdminOrders(filters);
      set({ orders, ordersLoading: false });
    } catch {
      set({ ordersLoading: false, ordersError: true });
    }
  },

  // CHANGED — fetchAdminOrders no longer called with { limit: 4 }.
  // Confirmed live: GET /admin/orders rejects `limit` outright (400,
  // "property limit should not exist" — forbidNonWhitelisted). This was
  // silently failing the whole Recent Orders table. If capping to a
  // small preview count is still wanted, that needs a backend answer on
  // the correct mechanism (page size? different field name?) before
  // re-adding — see note in AdminOrdersFilters.
  fetchAll: (vendorId) => {
    const state = useDashboardStore.getState();
    state.fetchSummary(vendorId);
    state.fetchLowStockAlerts();
    state.fetchRecentAuditLogs(5);
    state.fetchAdminOrders();
  },
}));