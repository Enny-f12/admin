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

/**
 * CONFIRMED — matches the real GET /admin/audit-logs response body exactly.
 * Previous version (actorName/actorInitial/entityType/createdAt) was a
 * guess and didn't match — corrected below. `action` values seen so far:
 * "CREATE", "UPDATE", "STATUS_CHANGE". Treat as a growing enum; confirm
 * the full set with backend before mapping to display labels.
 */
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userName: string;
  branch: string;
  action: string;
  item: string;
}

/**
 * CONFIRMED — GET /admin/audit-logs returns { items, total }, not a bare
 * array. dashboardService.getRecentAuditLogs() unwraps `.items` before
 * returning, so the store/page still work with AuditLogEntry[] directly —
 * this wrapper type exists only at the service boundary.
 */
export interface AuditLogsResponse {
  items: AuditLogEntry[];
  total: number;
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
  // `limit` is NOT accepted by GET /admin/orders — confirmed via live 400:
  // { "message": ["property limit should not exist"], "error": "Bad Request" }
  // (ValidationPipe forbidNonWhitelisted rejects it). Do not re-add without
  // confirming with backend whether pagination via `page` is the intended
  // mechanism for capping "Recent Orders" to a small preview count, or
  // whether a differently-named field should be added.
}