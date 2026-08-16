export interface WalkInCustomer {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface CartLineInput {
  menuItemId: string;
  quantity: number;
}

export type WalkInPaymentStatus = 'PENDING' | 'PAID';
export type WalkInPaymentMethod = 'CASH' | 'BANK_TRANSFER';

export interface CreateWalkInOrderPayload {
  customerId: string | null;
  newCustomer: { name: string; phone: string; email: string } | null;
  items: CartLineInput[];
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  paymentStatus: WalkInPaymentStatus;
  paymentMethod: WalkInPaymentMethod | null;
  notes: string | null;
  isDraft: boolean;
}

export interface CreateWalkInCustomerPayload {
  name: string;
  phone: string;
  email: string;
}

export interface BlacklistEntry {
  id: string;
  customerId: string;
  name: string;
  phone: string;
  reason: string;
}

export interface AddToBlacklistPayload {
  customerId: string;
  reason: string;
}