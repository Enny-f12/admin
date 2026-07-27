// types/orders.ts

export type OrderStatus =
  | "RECEIVED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED";

export type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY";

// Confirmed from real GET /admin/orders response — no longer a guess.
export type PaymentMethodType = "CARD" | "CASH_ON_DELIVERY" | "BANK_TRANSFER";

// PAID / PENDING / REFUNDED confirmed from real data. FAILED requested from
// backend — see backend request doc, Orders #1. Revert to a loose `string`
// on paymentStatus below if backend confirms other values exist beyond these four.
export type PaymentStatus = "PAID" | "PENDING" | "REFUNDED" | "FAILED";

export interface OrderItemOption {
  id: string;
  nameSnapshot: string;
  priceDelta: string; // decimal as string, matches unitPrice/totalPrice below
  quantity: number;
}

export interface OrderItem {
  id: string;
  menuItemId: string | null;
  nameSnapshot: string;
  descriptionSnapshot: string | null;
  unitPrice: string;   // backend returns decimals as strings — wrap with Number() before display math
  quantity: number;
  totalPrice: string;
  notes: string | null;
  options: OrderItemOption[];
}

export interface OrderStatusHistoryChangedBy {
  id: string;
  fullName: string;
  role: string;
}

export interface OrderStatusHistoryEntry {
  id: string;
  status: OrderStatus;
  notes: string | null;
  changedById: string | null;
  changedBy?: OrderStatusHistoryChangedBy;
  createdAt: string;
}

export interface OrderCustomer {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
}

export interface OrderBranch {
  id: string;
  name: string;
  addressLine1?: string | null;
  city?: string | null;
  state?: string | null;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  userId: string | null;
  branchId: string;
  branch?: OrderBranch;

  // Present on GET /admin/orders (list), absent on GET /admin/orders/:id (detail).
  // Confirmed backend gap — see backend request doc, Orders #2.
  customer?: OrderCustomer;

  orderType: OrderType;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethodType;

  customerNotes: string | null;
  guestName: string | null;
  guestPhone: string | null;
  guestEmail: string | null;

  subtotalAmount: string;
  taxAmount: string;
  deliveryFeeAmount: string;
  totalAmount: string;

  deliveryInstructions: string | null;
  deliveryAddressLine1: string | null;
  deliveryAddressLine2: string | null;
  deliveryCity: string | null;
  deliveryState: string | null;
  deliveryCountry: string | null;
  // Currently always null in real data even on completed DELIVERY orders —
  // see backend request doc, Orders #4. Not yet used in the UI; add a map
  // preview once backend confirms these are populated.
  deliveryLatitude: string | null;
  deliveryLongitude: string | null;

  items: OrderItem[];
  statusHistory?: OrderStatusHistoryEntry[];
  deliveryAssignment?: unknown | null;

  createdAt: string;
}

export interface AdminOrderFilters {
  status?: OrderStatus;
  branchId?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus;
  notes?: string;
}