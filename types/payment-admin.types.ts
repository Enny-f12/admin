export type PaymentMethod = 'CASH' | 'POS' | 'BANK_TRANSFER';

export interface RecordPaymentPayload {
  orderId: string;
  method: PaymentMethod;
  amountReceived: number;
  reference: string | null;
}

export interface RecordPaymentResponse {
  orderId: string;
  paymentStatus: string;
  receiptUrl: string | null;
}

export interface POSIntegrationStatus {
  connected: boolean;
  lastSyncAt: string | null;
  syncedOrdersCount: number;
}

export interface POSOrder {
  id: string;
  time: string;
  terminal: string;
  items: string;
  total: number;
  stockDeducted: boolean;
  verified: boolean;
}

export interface ManualSaleLineItem {
  name: string;
  qty: number;
  type: 'Food' | 'Drink';
  unitPrice: number;
}

export interface CreateManualSalePayload {
  customerName: string;
  method: PaymentMethod;
  items: ManualSaleLineItem[];
  amountReceived: number;
}

export interface CreateManualSaleResponse {
  id: string;
  receiptNumber: string;
  totalAmount: number;
}