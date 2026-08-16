// types/dashboard.ts

export interface DashboardSummary {
  ordersToday: number;
  ordersChangePercent: number;   
  revenueToday: number;
  revenueChangePercent: number;  
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
  total: number; 
}


export type LowStockStatus = "LOW" | "OUT_OF_STOCK";

export interface LowStockAlert {
  itemName: string;
  unit: string;
  currentQuantity: number;
  reorderThreshold: number;
  branchName: string;
  status: LowStockStatus;
}


export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userName: string;
  branch: string;
  action: string;
  item: string;
}


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

export type PaymentStatus = "PENDING" | "PAID" | "REFUNDED" | "FAILED";
export type PaymentMethod = "CARD" | "BANK_TRANSFER" | "CASH_ON_DELIVERY" | string;

export interface AdminOrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  nameSnapshot: string;
  descriptionSnapshot: string | null;
  unitPrice: string; // numeric string, e.g. "4000" — parse with Number() before formatting
  quantity: number;
  totalPrice: string; // numeric string
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrderCustomer {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  status: string;
}

export interface AdminOrderBranch {
  id: string;
  vendorId: string;
  name: string;
  code: string;
  phone: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  isActive: boolean;
}


export interface AdminOrder {
  id: string;
  orderNumber: string;
  userId: string;
  createdById: string | null;
  branchId: string;
  deliveryZoneId: string | null;
  orderType: OrderType;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentReference: string | null;
  qrCode: string | null;
  guestName: string | null;
  guestPhone: string | null;
  guestEmail: string | null;
  customerNotes: string | null;
  kitchenNotes: string | null;
  cancelReason: string | null;
  subtotalAmount: string;
  taxAmount: string;
  deliveryFeeAmount: string;
  discountAmount: string;
  promoCode: string | null;
  totalAmount: string;
  scheduledFor: string | null;
  readyAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  deliveryProvider: string | null;
  deliveryInstructions: string | null;
  deliveryAddressLine1: string | null;
  deliveryAddressLine2: string | null;
  deliveryCity: string | null;
  deliveryState: string | null;
  deliveryCountry: string | null;
  deliveryPostalCode: string | null;
  pickupVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  customer: AdminOrderCustomer | null;
  branch: AdminOrderBranch;
  items: AdminOrderItem[];
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
  
}