// types/inventory.ts
export type InventoryStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
export type StockZone = "WAREHOUSE" | "FRIDGE";

export interface InventoryCategory {
  id: string;
  name: string;
}

export interface InventoryItem {
  id: string;
  branchId: string;
  branchName: string;
  menuItemId: string;
  name: string;
  categoryId: string;
  categoryName: string;
  unit: string;                    // e.g. "kg", "Piece", "Can"
  hasZones: boolean;                // true for items tracked warehouse+fridge (e.g. drinks)
  warehouseQuantity: number;
  fridgeQuantity: number | null;    // null when hasZones is false
  threshold: number;
  costPerUnit: number | null;
  status: InventoryStatus;          // server-computed from quantity vs threshold
  updatedAt: string;
}

export interface AdjustStockPayload {
  zone: StockZone;
  quantity: number;                 // absolute new value for that zone
  costPerUnit?: number;
  reason: string;
}

export interface TransferBranchPayload {
  toBranchId: string;
  quantity: number;
  approvingManagerId?: string;
  reason: string;
}

export interface TransferZonePayload {
  quantity: number;                 // amount moved warehouse -> fridge
  reason?: string;
}

export interface DeliveryLineItem {
  itemId?: string;
  name: string;
  quantity: number;
  costPerUnit: number;
}

export interface ReceiveDeliveryPayload {
  branchId: string;
  supplierId: string;
  invoiceNumber: string;
  deliveryDate: string;             // ISO date
  items: DeliveryLineItem[];
}

export interface WastagePayload {
  zone: StockZone;
  quantity: number;
  costPerUnit?: number;
  reason: string;
  details?: string;
}

export interface ThresholdConfig {
  itemId: string;
  threshold: number;
  notify: boolean;
  autoReorder: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  address: string;
}

export interface CreateSupplierPayload {
  name: string;
  contact: string;
  address: string;
}

export interface MorningCountItem {
  itemId: string;
  name: string;
  unit: string;
  expectedQuantity: number;
  countedQuantity: number | null;
}

export interface MorningCount {
  id: string;
  branchId: string;
  date: string;
  status: "PENDING" | "SUBMITTED";
  submittedBy: string | null;
  submittedAt: string | null;
  items: MorningCountItem[];
}

export interface SubmitMorningCountPayload {
  items: { itemId: string; countedQuantity: number }[];
}