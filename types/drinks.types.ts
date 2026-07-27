export interface DrinksItem {
  id: string;
  name: string;
  unit: string;
  warehouseStock: number;
  fridgeStock: number;
  fridgeThreshold: number;
  notify: boolean;
}

export interface DeliveryLineItem {
  itemName: string;
  quantity: number;
  costPerUnit: number;
}

export interface CreateDeliveryPayload {
  supplierId: string | null;
  deliveryDate: string;
  invoiceNumber: string;
  isDraft: boolean;
  items: DeliveryLineItem[];
}

export interface CreateDeliveryResponse {
  id: string;
  totalCost: number;
  items: DrinksItem[];
}

export interface TransferToFridgePayload {
  itemId: string;
  quantity: number;
  reason: string;
}

export interface FridgeItemThreshold {
  itemId: string;
  itemName: string;
  threshold: number;
  notify: boolean;
}

export interface FridgeThresholdConfig {
  defaultThreshold: number;
  items: FridgeItemThreshold[];
}

export interface SaveFridgeThresholdsPayload {
  defaultThreshold: number;
  items: { itemId: string; threshold: number; notify: boolean }[];
}



export interface DrinksInventoryItem {
  id: string;
  name: string;
  unit: string;
  fridgeStock: number;
  warehouseStock: number;
  fridgeThreshold: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

export interface DrinksInventoryResponse {
  items: DrinksInventoryItem[];
  total: number;
  stats: {
    totalItems: number;
    lowStock: number;
    outOfStock: number;
    totalValue: number;
  };
}

export interface AdjustWarehousePayload {
  itemId: string;
  quantity: number;
  costPerUnit: number;
  reason: string;
}

export type SupplierType = 'Beverage Supplier' | 'Food Supplier' | 'Packaging Supplier';

export interface Supplier {
  id: string;
  name: string;
  type: SupplierType;
  contactPerson: string;
  phone: string;
  address: string;
}

export interface AddSupplierPayload {
  name: string;
  type: SupplierType;
  contactPerson: string;
  phone: string;
  address: string;
}