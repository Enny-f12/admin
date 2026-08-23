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


export type PaymentMethodType = "CARD" | "CASH_ON_DELIVERY" | "BANK_TRANSFER";


export type PaymentStatus = "PAID" | "PENDING" | "REFUNDED" | "FAILED";

export interface OrderItemOption {
  id: string;
  nameSnapshot: string;
  priceDelta: string; 
  quantity: number;
}

export interface OrderItem {
  id: string;
  menuItemId: string | null;
  nameSnapshot: string;
  descriptionSnapshot: string | null;
  unitPrice: string;   
  quantity: number;
  totalPrice: string;
  notes: string | null;
  
  options?: OrderItemOption[];
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
  customer?: OrderCustomer;
  orderType: OrderType;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethodType;
  customerNotes: string | null;
  kitchenNotes: string | null;
  cancelReason: string | null;
  guestName: string | null;
  guestPhone: string | null;
  guestEmail: string | null;
  subtotalAmount: string;
  taxAmount: string;
  deliveryFeeAmount: string;
  discountAmount: string;
  totalAmount: string;
  deliveryInstructions: string | null;
  deliveryAddressLine1: string | null;
  deliveryAddressLine2: string | null;
  deliveryCity: string | null;
  deliveryState: string | null;
  deliveryCountry: string | null;
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