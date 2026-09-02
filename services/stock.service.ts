// services/stock.service.ts — full file

import { apiClient } from '@/lib/api-client';
import {
  StockItem,
  Branch,
  StockAlert,
  Supplier,
  StockThresholdConfig,
  AdjustStockPayload,
  TransferStockPayload,
  RemoveStockPayload,
  AddSupplierPayload,
  SaveStockThresholdsPayload,
  UpdateCostPricePayload,
  ResyncMenuResult,
  StatusBanner,
  CreateDrinksDeliveryPayload,
  CreateDrinksDeliveryResponse,
  TransferToFridgePayload,
  UpdateBranchUomPayload,
} from '@/types/stock.types';

export const stockService = {
  getItems: (branchId?: string, search?: string) =>
    apiClient
      .get<StockItem[]>('/admin/stock/items', { params: { branchId, search } })
      .then((r) => r.data),

  getBranches: () => apiClient.get<Branch[]>('/admin/branches').then((r) => r.data),

  getStockAlerts: (branchId?: string) =>
    apiClient
      .get<StockAlert[]>('/admin/stock/alerts', { params: { branchId } })
      .then((r) => r.data),

  // The one "add stock" action for both types. For drinks, payload.destination
  // ("warehouse" | "fridge") tells the backend which bucket to add to —
  // "warehouse" for a normal supplier delivery, "fridge" for a direct
  // top-up. Ignored for food, which always adds to `quantity`.
  adjustStock: (payload: AdjustStockPayload) =>
    apiClient.post<StockItem>('/admin/stock/adjust', payload).then((r) => r.data),

  // Works for both types — backend resolves which field to decrement
  // (quantity for food, fridgeQty for drinks) from the item's itemType.
  removeStock: (payload: RemoveStockPayload) =>
    apiClient.post<StockItem>('/admin/stock/remove', payload).then((r) => r.data),

  transferStock: (payload: TransferStockPayload) =>
    apiClient
      .post<{ from: StockItem; to: StockItem }>('/admin/stock/transfer', payload)
      .then((r) => r.data),

  // Drinks batch delivery — one invoice, many line items. All add to
  // warehouseQty. Nothing is written if payload.isDraft is true.
  receiveDrinksDelivery: (payload: CreateDrinksDeliveryPayload) =>
    apiClient
      .post<CreateDrinksDeliveryResponse>('/admin/stock/drinks/deliveries', payload)
      .then((r) => r.data),

  // Drinks-only atomic move: warehouseQty -> fridgeQty. Distinct from
  // adjustStock — see the note on TransferToFridgePayload.
  transferToFridge: (payload: TransferToFridgePayload) =>
    apiClient
      .post<StockItem>('/admin/stock/drinks/transfer-to-fridge', payload)
      .then((r) => r.data),

  // Units of Measurement — per branch. No separate GET: BranchUom is
  // already embedded in each item's quantities[] from getItems() above
  // (same one store, same one fetch). This PATCH edits one item's UoM
  // at one branch; the backend rejects it if that branch's
  // BranchUom.editable is false.
  updateBranchUom: (payload: UpdateBranchUomPayload) =>
    apiClient
      .patch<StockItem>(`/admin/stock/items/${payload.itemId}/uom`, payload)
      .then((r) => r.data),

  getSuppliers: () => apiClient.get<Supplier[]>('/admin/suppliers').then((r) => r.data),

  addSupplier: (payload: AddSupplierPayload) =>
    apiClient.post<Supplier>('/admin/suppliers', payload).then((r) => r.data),

  getThresholds: (branchId?: string) =>
    apiClient
      .get<StockThresholdConfig>('/admin/stock/thresholds', { params: { branchId } })
      .then((r) => r.data),

  saveThresholds: (payload: SaveStockThresholdsPayload) =>
    apiClient.put<StockThresholdConfig>('/admin/stock/thresholds', payload).then((r) => r.data),

  // Sets costPerUnit explicitly. The only path allowed to touch this
  // field — menu creation, adjust, add, remove all leave it untouched
  // (or at 0 for a brand-new item).
  updateCostPrice: (payload: UpdateCostPricePayload) =>
    apiClient
      .patch<StockItem>(`/admin/stock/items/${payload.itemId}/cost-price`, {
        costPerUnit: payload.costPerUnit,
      })
      .then((r) => r.data),

  // Backfills inventory rows for any active MenuItem that doesn't yet
  // have a matching Inventory row per branch. Safe to call repeatedly —
  // never overwrites an existing row's real stock numbers.
  resyncMenu: () =>
    apiClient.post<ResyncMenuResult>('/admin/stock/resync-menu').then((r) => r.data),

  // The "who last touched inventory, and when is the next count due"
  // banner shown on the Inventory Dashboard. This is genuinely separate
  // from item data (it's audit/schedule info, not stock levels) — the
  // ONLY inventory-dashboard-specific endpoint that survives the merge
  // into stockService. Backed by real Morning Count audit + schedule
  // data on the backend, not a placeholder.
  getStatusBanner: (branchId?: string) =>
    apiClient
      .get<StatusBanner>('/admin/inventory/status-banner', { params: { branchId } })
      .then((r) => r.data),

  /*
   * ── DISABLED: freeform "Add Stock" ──
   * See the note in types/stock.types.ts. There is no valid backend
   * call for registering an untracked item by name — every stock row
   * must originate from a menu item. Kept for reference only.
   *
   * addStock: (payload: AddStockPayload) =>
   *   apiClient.post<StockItem>('/admin/stock/add', payload).then((r) => r.data),
   */
};