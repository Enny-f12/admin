// types/suppliers.types.ts

export type SupplierType = 'Food Supplier' | 'Beverage Supplier' | 'Packaging Supplier';

export interface Supplier {
  id: string;
  name: string;
  type: SupplierType | null;
  contactPerson: string | null;
  phone: string | null;
  address: string | null;
  deliveries: number;
  outstanding: number;
}

export interface SupplierPayment {
  date: string;
  invoiceNumber: string;
  amount: number;
  paid: boolean;
  reference: string;
}

export interface SupplierPurchaseOrder {
  poNumber: string;
  date: string;
  items: string;
  status: string;
  deliveryDate: string;
}

export interface SupplierDetail extends Supplier {
  payments: SupplierPayment[];
  purchaseOrders: SupplierPurchaseOrder[];
}

export interface AddSupplierPayload {
  name: string;
  type: SupplierType | null;
  contactPerson: string | null;
  phone: string | null;
  address: string | null;
}