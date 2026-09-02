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
  BranchPerformance,
  DashboardRange,
} from '@/types/dashboard';

function extractErrorMessage(error: unknown, fallback: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyErr = error as any;
  return anyErr?.response?.data?.message ?? anyErr?.message ?? fallback;
}

// GET /admin/inventory/alerts (and others) 400 if `branchId` is sent but
// isn't a real UUID — only forward it if it actually looks like one, so
// an unresolved/undefined branch id degrades to "no filter" instead of
// a 400.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function asBranchId(branchId?: string | null): string | undefined {
  return branchId && UUID_RE.test(branchId) ? branchId : undefined;
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

  // Top items
  topItems: PopularItem[] | null;
  topItemsLoading: boolean;
  topItemsError: boolean;

  // Order distribution
  distribution: OrderDistribution[] | null;
  distributionLoading: boolean;
  distributionError: boolean;

  // Branch performance
  branchPerformance: BranchPerformance | null;
  branchPerformanceLoading: boolean;
  branchPerformanceError: boolean;

  // Customers
  customers: DashboardCustomersResponse | null;
  customersLoading: boolean;
  customersError: boolean;

  // Low stock
  lowStock: LowStockAlert[] | null;
  lowStockLoading: boolean;
  lowStockError: boolean;

  // Audit logs
  auditLogs: AuditLogEntry[] | null;
  auditLogsLoading: boolean;
  auditLogsError: boolean;

  // Admin orders
  orders: AdminOrder[] | null;
  ordersLoading: boolean;
  ordersError: boolean;

  fetchSummary: (vendorId?: string, branchId?: string) => Promise<void>;
  fetchSalesTrends: (branchId?: string, days?: 7 | 14 | 30) => Promise<void>;
  fetchTopItems: (branchId?: string, limit?: number) => Promise<void>;
  fetchDistribution: (branchId?: string, range?: DashboardRange) => Promise<void>;
  fetchBranchPerformance: (range?: DashboardRange, vendorId?: string) => Promise<void>;
  fetchCustomers: (vendorId?: string, page?: number, limit?: number) => Promise<void>;
  fetchLowStockAlerts: (branchId?: string) => Promise<void>;
  fetchRecentAuditLogs: (limit?: number, branchId?: string) => Promise<void>;
  fetchAdminOrders: (filters?: AdminOrdersFilters) => Promise<void>;

  // Convenience: fires everything the dashboard page needs on mount
  fetchAll: (vendorId?: string, branchId?: string) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  summary: null,
  summaryLoading: false,
  summaryError: false,

  salesTrends: null,
  salesTrendsLoading: false,
  salesTrendsError: false,

  topItems: null,
  topItemsLoading: false,
  topItemsError: false,

  distribution: null,
  distributionLoading: false,
  distributionError: false,

  branchPerformance: null,
  branchPerformanceLoading: false,
  branchPerformanceError: false,

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

  fetchSummary: async (vendorId, branchId) => {
    set({ summaryLoading: true, summaryError: false });
    try {
      const summary = await dashboardService.getSummary(vendorId, asBranchId(branchId));
      set({ summary, summaryLoading: false });
    } catch (error) {
      set({ summaryLoading: false, summaryError: true });
      toast.error(extractErrorMessage(error, 'Could not load dashboard summary'));
    }
  },

  fetchSalesTrends: async (branchId, days = 7) => {
    set({ salesTrendsLoading: true, salesTrendsError: false });
    try {
      const salesTrends = await dashboardService.getSalesTrends(asBranchId(branchId), days);
      set({ salesTrends, salesTrendsLoading: false });
    } catch (error) {
      set({ salesTrendsLoading: false, salesTrendsError: true });
      toast.error(extractErrorMessage(error, 'Could not load sales trend'));
    }
  },

  fetchTopItems: async (branchId, limit = 5) => {
    set({ topItemsLoading: true, topItemsError: false });
    try {
      const topItems = await dashboardService.getTopItems(asBranchId(branchId), limit);
      set({ topItems, topItemsLoading: false });
    } catch (error) {
      set({ topItemsLoading: false, topItemsError: true });
      toast.error(extractErrorMessage(error, 'Could not load top items'));
    }
  },

  fetchDistribution: async (branchId, range = 'month') => {
    set({ distributionLoading: true, distributionError: false });
    try {
      const distribution = await dashboardService.getDistribution(asBranchId(branchId), range);
      set({ distribution, distributionLoading: false });
    } catch (error) {
      set({ distributionLoading: false, distributionError: true });
      toast.error(extractErrorMessage(error, 'Could not load order distribution'));
    }
  },

  fetchBranchPerformance: async (range = 'month', vendorId) => {
    set({ branchPerformanceLoading: true, branchPerformanceError: false });
    try {
      const branchPerformance = await dashboardService.getBranchPerformance(range, vendorId);
      set({ branchPerformance, branchPerformanceLoading: false });
    } catch (error) {
      set({ branchPerformanceLoading: false, branchPerformanceError: true });
      toast.error(extractErrorMessage(error, 'Could not load branch performance'));
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

  fetchLowStockAlerts: async (branchId) => {
    set({ lowStockLoading: true, lowStockError: false });
    try {
      const lowStock = await dashboardService.getLowStockAlerts(asBranchId(branchId));
      set({ lowStock, lowStockLoading: false });
    } catch (error) {
      set({ lowStockLoading: false, lowStockError: true });
      toast.error(extractErrorMessage(error, 'Could not load low stock alerts'));
    }
  },

  fetchRecentAuditLogs: async (limit = 10, branchId) => {
    set({ auditLogsLoading: true, auditLogsError: false });
    try {
      const auditLogs = await dashboardService.getRecentAuditLogs(limit, asBranchId(branchId));
      set({ auditLogs, auditLogsLoading: false });
    } catch (error) {
      set({ auditLogsLoading: false, auditLogsError: true });
      toast.error(extractErrorMessage(error, 'Could not load recent activity'));
    }
  },

  fetchAdminOrders: async (filters = {}) => {
    set({ ordersLoading: true, ordersError: false });
    try {
      const orders = await dashboardService.getAdminOrders(filters);
      set({ orders, ordersLoading: false });
    } catch (error) {
      set({ ordersLoading: false, ordersError: true });
      toast.error(extractErrorMessage(error, 'Could not load recent orders'));
    }
  },

  fetchAll: (vendorId, branchId) => {
    const state = useDashboardStore.getState();
    const validBranchId = asBranchId(branchId);
    state.fetchSummary(vendorId, validBranchId);
    state.fetchLowStockAlerts(validBranchId);
    state.fetchRecentAuditLogs(5, validBranchId);
    state.fetchAdminOrders({ branchId: validBranchId });
    state.fetchSalesTrends(validBranchId, 7);
    state.fetchTopItems(validBranchId, 5);
    state.fetchDistribution(validBranchId, 'month');
    state.fetchBranchPerformance('month', vendorId);
  },
}));