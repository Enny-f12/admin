// types/order.ts

export type OrderStatus =
  | "RECEIVED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED";

export type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY";

// TODO(BACKEND): actual enum values unconfirmed — CheckoutDto references
// PaymentMethodType but the enum itself wasn't shared. Guessing common
// values; confirm before relying on this for payment-related UI.
export type PaymentMethodType = "CARD" | "CASH" | "TRANSFER" | "WALLET";

export interface OrderItemOption {
  id: string;
  nameSnapshot: string;
  priceDelta: number;
  quantity: number;
}

export interface OrderItem {
  id: string;
  menuItemId: string | null;
  nameSnapshot: string;
  descriptionSnapshot: string | null;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  notes: string | null;
  options?: OrderItemOption[];
}

export interface OrderStatusHistoryEntry {
  id: string;
  status: OrderStatus;
  notes: string | null;
  changedById: string | null;
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
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  userId: string | null;
  branchId: string;
  branch?: OrderBranch;
  customer?: OrderCustomer; // present on list (getAdminOrders), see gap #3
  orderType: OrderType;
  status: OrderStatus;
  paymentStatus: string;
  paymentMethod: PaymentMethodType;
  customerNotes: string | null;
  guestName: string | null;
  guestPhone: string | null;
  guestEmail: string | null;
  subtotalAmount: number;
  taxAmount: number;
  deliveryFeeAmount: number;
  totalAmount: number;
  deliveryInstructions: string | null;
  items: OrderItem[];
  statusHistory?: OrderStatusHistoryEntry[];
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