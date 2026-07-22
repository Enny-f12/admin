// types/dashboard.ts

/* ── Summary ── */
export interface DashboardSummary {
  ordersToday: number;
  ordersChangePercent: number;   // TODO(BACKEND): not yet returned — see request doc #3
  revenueToday: number;
  revenueChangePercent: number;  // TODO(BACKEND): not yet returned — see request doc #3
  reservationsToday: number;
}

/* ── Sales trends ── */
export interface SalesTrendPoint {
  date: string;
  revenue: number;
}

/* ── Popular items ── */
export interface PopularItem {
  name: string;
  price: number;
  photo: string | null;
  totalSold: number;
}

/* ── Order type distribution ── */
export interface OrderDistribution {
  type: string;
  count: number;
}

/* ── Customers ── */
export interface DashboardCustomer {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
}

export interface DashboardCustomersResponse {
  data: DashboardCustomer[];
  total: number; // TODO(BACKEND): not yet returned — see request doc #4
}

/* ── Low stock alerts ── */
// TODO(BACKEND): GET /admin/inventory/alerts not implemented yet — see request doc #1
export interface LowStockAlert {
  itemName: string;
  unit: string;
  currentQuantity: number;
  reorderThreshold: number;
}

/* ── Audit log / recent activity ── */
// TODO(BACKEND): GET /admin/audit-logs not implemented yet — see request doc #2
export interface AuditLogEntry {
  id: string;
  actorName: string;
  actorInitial: string;
  action: string;
  entityType: string; // "Inventory" | "Orders" | "Payments" | etc.
  createdAt: string;
}

/* ── Admin orders (for Recent Orders table) ── */
export type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY";

export type OrderStatus =
  | "RECEIVED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED";

// TODO(BACKEND): response shape unconfirmed — see request doc #5
export interface AdminOrder {
  id: string;
  customerName: string;
  itemCount: number;
  totalAmount: number;
  orderType: OrderType;
  status: OrderStatus;
  createdAt: string;
}

export interface AdminOrdersFilters {
  status?: OrderStatus;
  type?: OrderType;
  dateFrom?: string;
  dateTo?: string;
  branchId?: string;
  page?: number;
  limit?: number;
}