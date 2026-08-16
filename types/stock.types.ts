// types/stock.types.ts — full file

export type StockStatus = 'In Stock' | 'Low Stock' | 'Critical';

export interface Branch {
  id: string;
  name: string;
}

export interface BranchQuantity {
  branchId: string;
  branchName: string;
  quantity: number;
}

export interface StockItem {
  id: string;
  name: string;
  unit: string;
  quantities: BranchQuantity[];
  total: number;
  status: StockStatus;
  costPerUnit: number;
}

export interface StockAlert {
  itemId: string;
  itemName: string;
  unit: string;
  currentQuantity: number;
  reorderThreshold: number;
}

export interface Supplier {
  id: string;
  name: string;
  type: string; // TODO: confirm enum values via Swagger "Schema" tab (currently free text — see AddSupplierModal)
  contactPerson: string;
  phone: string;
  address: string;
}

export interface StockItemThreshold {
  itemId: string;
  itemName: string;
  unit: string;
  threshold: number;
  notify: boolean;
  autoReorder: boolean;
}

export interface StockThresholdConfig {
  defaultThreshold: number;
  items: StockItemThreshold[];
}

export interface AdjustStockPayload {
  itemId: string;
  branchId: string;
  quantity: number;
  supplierId: string | null;
  invoiceNumber: string | null;
  costPerUnit: number;
  reason: string;
}

export interface TransferStockPayload {
  itemId: string;
  fromBranchId: string;
  toBranchId: string;
  quantity: number;
  approvingManagerId: string | null;
  reason: string;
}

export interface RemoveStockPayload {
  itemId: string;
  branchId: string;
  quantity: number;
  costPerUnit: number;
  reason: string;
  otherDetails: string | null;
}

export interface AddSupplierPayload {
  name: string;
  type: string;
  contactPerson: string;
  phone: string;
  address: string;
}

export interface SaveStockThresholdsPayload {
  defaultThreshold: number;
  items: { itemId: string; threshold: number; notify: boolean; autoReorder: boolean }[];
}