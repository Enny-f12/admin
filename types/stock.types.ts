// types/stock.types.ts — full file

export type StockStatus = 'In Stock' | 'Low Stock' | 'Critical';
export type StockItemType = 'food' | 'drink';
export type StockSource = 'feed' | 'manual';

export interface Branch {
  id: string;
  name: string;
}

// Food branches use `quantity`. Drink branches use `warehouseQty` +
// `fridgeQty` instead — `quantity` is never populated for a drink row.
// Both fields are optional here (rather than two separate types) so a
// single StockItem[] list can hold both kinds without a discriminated
// union forcing a cast at every call site; itemType on the parent
// StockItem is what actually tells you which fields are meaningful.
export interface BranchQuantity {
  branchId: string;
  branchName: string;
  quantity?: number;       // food only
  warehouseQty?: number;   // drinks only — bulk stock, never customer-facing
  fridgeQty?: number;      // drinks only — ready-to-serve, this is what orders deduct from
  uom?: BranchUom;         // per-branch Units of Measurement config — see BranchUom
}

// Units of Measurement (ERP spec 4.5) — PER BRANCH, not vendor-wide.
// The same menu item can have a different pack size, or a different
// default supplier, at each branch. Lives on the branch's inventory
// row, edited via the dedicated UoM Configuration screen.
export interface BranchUom {
  unit: string;                     // e.g. "Piece", "Wrap/Serving", "Bottle/Can/Pack"
  packSize: number | null;          // food only — pieces per pack (e.g. 4). null/1 for singles
  editable: boolean;                // whether this branch's Manager/Super Admin can edit it here
  volume: string | null;            // drinks only — e.g. "33cl"
  defaultSupplierId: string | null; // drinks only — the usual supplier for this drink at this branch
}

export interface StockItem {
  id: string;             // inventory row id
  menuItemId: string;     // FK to MenuItem.id — every stock row must have one, no exceptions
  name: string;
  itemType: StockItemType;
  category: string;       // menu category name (e.g. "Pastry", "Soft Drinks") — used for the food-tab category filter
  unit: string;
  source: StockSource;
  quantities: BranchQuantity[];
  total: number;          // food: sum of quantity across branches. drinks: sum of fridgeQty only (warehouse never counts toward sellable total)
  threshold: number;      // low-stock threshold — for drinks this is specifically the fridge threshold; warehouse is never threshold-checked
  status: StockStatus;
  costPerUnit: number;    // 0 until explicitly configured via updateCostPrice — never inherited from menu price
}

export interface InventoryStats {
  totalItems: number;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
}

export interface StatusBanner {
  lastUpdatedAt: string;
  lastUpdatedByName: string;
  nextCountDueAt: string;
}

export interface StockAlert {
  itemId: string;
  itemName: string;
  itemType: StockItemType;
  unit: string;
  currentQuantity: number;   // food: quantity. drinks: fridgeQty (warehouse-low is a separate, non-blocking signal)
  reorderThreshold: number;
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

export interface StockItemThreshold {
  itemId: string;
  itemName: string;
  itemType: StockItemType;
  unit: string;
  threshold: number;
  notify: boolean;
  autoReorder: boolean;
}

export interface StockThresholdConfig {
  defaultThreshold: number;
  items: StockItemThreshold[];
}

// One endpoint for both types — the ONLY "add stock" action.
// Food: always adds to `quantity`, destination is ignored.
// Drinks: `destination` picks which bucket gets the addition —
// "warehouse" for a normal supplier delivery, "fridge" for a direct
// top-up/correction. Defaults to "warehouse" when omitted.
// supplierId is optional for BOTH types — food is made in-house and
// has no supplier by default (backend records source as
// "Restaurant (in-house)" when null); drinks usually have one but it
// isn't enforced at the type level.
export interface AdjustStockPayload {
  itemId: string;
  menuItemId: string;
  branchId: string;
  quantity: number;
  destination?: "warehouse" | "fridge"; // drinks only, ignored for food
  supplierId: string | null;
  invoiceNumber: string | null;
  costPerUnit: number;
  reason: string;
}

// Works for both types: food removes from `quantity`, drinks remove
// from `fridgeQty` only — warehouse stock is never subject to wastage
// entries directly (it hasn't been "served" yet). supplierId is not
// part of this payload; wastage has no supplier.
export interface RemoveStockPayload {
  itemId: string;
  menuItemId: string;
  branchId: string;
  quantity: number;
  costPerUnit: number;
  reason: string;
  otherDetails: string | null;
}

// Branch-to-branch transfer — drinks DO transfer, same action as food.
// Food transfers `quantity`; drinks transfer `fridgeQty` only (a
// branch's warehouse stays local and is restocked independently —
// only "ready to serve" fridge stock ever moves between branches).
export interface TransferStockPayload {
  itemId: string;
  menuItemId: string;
  fromBranchId: string;
  toBranchId: string;
  quantity: number;
  approvingManagerId: string | null;
  reason: string;
}

export interface SaveStockThresholdsPayload {
  defaultThreshold: number;
  items: { itemId: string; threshold: number; notify: boolean; autoReorder: boolean }[];
}

export interface UpdateCostPricePayload {
  itemId: string;
  costPerUnit: number;
}

// Editing a branch's UoM config for one item. Rejected server-side if
// that branch's BranchUom.editable is false, regardless of caller role.
export interface UpdateBranchUomPayload {
  itemId: string;
  menuItemId: string;
  branchId: string;
  unit?: string;
  packSize?: number;
  volume?: string;
  defaultSupplierId?: string | null;
}

// ── Drinks batch delivery — ONE invoice covering MULTIPLE items ──
// Different shape from AdjustStockPayload's single-item add: a real
// delivery invoice often lists several different drinks at once. This
// stays a distinct endpoint so the audit trail records "one delivery,
// N line items" rather than N disconnected adjustments. Every line
// item adds to warehouseQty only — never fridgeQty.
export interface DeliveryLineItem {
  menuItemId: string;
  quantity: number;
  costPerUnit: number;
}

export interface CreateDrinksDeliveryPayload {
  branchId: string;
  supplierId: string | null;
  deliveryDate: string;
  invoiceNumber: string;
  isDraft: boolean; // when true, nothing is written to Inventory yet — see backend doc Section J
  items: DeliveryLineItem[];
}

export interface CreateDrinksDeliveryResponse {
  id: string;
  totalCost: number;
  items: StockItem[]; // only the touched items, updated — empty/unchanged when isDraft
}

// ── Drinks: Transfer to Fridge — a genuine ATOMIC MOVE ──
// warehouseQty -= quantity AND fridgeQty += quantity in one step,
// blocked if quantity > warehouseQty. This is NOT the same as
// AdjustStockPayload with destination: "fridge" (which only adds to
// fridge and never touches warehouse) — that's a direct top-up/
// correction. Transferring stock between the two buckets needs its own
// action so the warehouse-sufficiency check and the two-field write
// happen atomically, in one request.
export interface TransferToFridgePayload {
  itemId: string;
  menuItemId: string;
  branchId: string;
  quantity: number;
  reason: string;
}

export interface ResyncMenuResult {
  created: number;
  skipped: number;
}

/*
 * ── DISABLED: freeform "Add Stock" ──
 * There is no such thing as a stock item that isn't a menu item.
 * Ingredients / raw materials are explicitly out of scope — we don't
 * track them anywhere in this system. Every row in Stock must trace
 * back to a real MenuItem via menuItemId, created automatically when
 * that menu item is created (see menu.service.ts createItem -> cascade).
 *
 * If a menu item exists without a matching stock row (e.g. it predates
 * this fix), use resyncMenu() instead of typing a new item here.
 *
 * Kept for reference only — do not wire this back up without also
 * re-checking the menu-item cascade logic on the backend.
 *
 * export interface AddStockPayload {
 *   name: string;
 *   unit: string;
 *   branchId: string;
 *   quantity: number;
 *   costPerUnit: number;
 *   supplierId: string | null;
 *   invoiceNumber: string | null;
 *   reason: string;
 * }
 */