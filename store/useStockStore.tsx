// store/useStockStore.ts — full file

import { create } from 'zustand';
import { toast } from 'sonner';
import { stockService } from '@/services/stock.service';
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
  StatusBanner,
  CreateDrinksDeliveryPayload,
  TransferToFridgePayload,
  UpdateBranchUomPayload,
} from '@/types/stock.types';

function extractErrorMessage(error: unknown, fallback: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyErr = error as any;
  return anyErr?.response?.data?.message ?? anyErr?.message ?? fallback;
}

interface StockState {
  items: StockItem[] | null;
  itemsLoading: boolean;
  itemsError: boolean;

  branches: Branch[] | null;
  branchesLoading: boolean;
  branchesError: boolean;

  lowStock: StockAlert[] | null;
  lowStockLoading: boolean;
  lowStockError: boolean;

  suppliers: Supplier[] | null;
  suppliersLoading: boolean;
  suppliersError: boolean;

  thresholds: StockThresholdConfig | null;
  thresholdsLoading: boolean;
  thresholdsError: boolean;
  savingThresholds: boolean;

  isResyncingMenu: boolean;

  // Shared by the Stock Inventory page AND the Inventory Dashboard
  // (food/drinks tabs) — "who last touched inventory, when is the next
  // count due". This is the only inventory-dashboard-specific piece of
  // state that survived the merge; item data now comes from `items`
  // above for both pages.
  banner: StatusBanner | null;
  bannerLoading: boolean;
  bannerError: boolean;

  fetchItems: (branchId?: string, search?: string) => Promise<void>;
  fetchBranches: () => Promise<void>;
  fetchLowStockAlerts: (branchId?: string) => Promise<void>;
  fetchSuppliers: () => Promise<void>;
  fetchThresholds: (branchId?: string) => Promise<void>;

  adjustStock: (payload: AdjustStockPayload) => Promise<boolean>;
  transferStock: (payload: TransferStockPayload) => Promise<boolean>;
  removeStock: (payload: RemoveStockPayload) => Promise<boolean>;
  addSupplier: (payload: AddSupplierPayload) => Promise<boolean>;
  saveThresholds: (payload: SaveStockThresholdsPayload) => Promise<boolean>;
  updateCostPrice: (payload: UpdateCostPricePayload) => Promise<boolean>;

  // Drinks-only: one invoice, many items, all adding to warehouseQty.
  receiveDrinksDelivery: (payload: CreateDrinksDeliveryPayload) => Promise<boolean>;
  isSubmittingDelivery: boolean;

  // Drinks-only: atomic warehouse -> fridge move. Distinct from
  // adjustStock's destination toggle — see stock.types.ts.
  transferToFridge: (payload: TransferToFridgePayload) => Promise<boolean>;
  isTransferringToFridge: boolean;

  // Units of Measurement — per branch. No separate fetch: BranchUom
  // comes embedded in `items` from fetchItems above.
  updateBranchUom: (payload: UpdateBranchUomPayload) => Promise<boolean>;
  isSavingUom: boolean;

  // Replaces "Add Stock". Backfills inventory for menu items missing a
  // stock row instead of letting anyone type a brand-new untracked item.
  resyncMenu: () => Promise<boolean>;

  fetchBanner: (branchId?: string) => Promise<void>;

  fetchAll: (branchId?: string) => void;
}

// Shared by adjust / receive delivery / transfer-to-fridge / remove /
// transfer — all of them return the updated StockItem for one branch,
// and all need the same "patch just that branch's row back into the
// cached item" merge, itemType-aware (food overwrites quantity, drinks
// overwrite warehouseQty/fridgeQty independently so a fridge transfer
// doesn't clobber a warehouse number the response didn't touch, or
// vice versa).
function mergeItemBranch(existing: StockItem, updated: StockItem): StockItem {
  const updatedBranchQty = updated.quantities[0];
  if (!updatedBranchQty) return updated;

  const quantities = existing.quantities.map((q) => {
    if (q.branchId !== updatedBranchQty.branchId) return q;
    return {
      ...q,
      quantity: updatedBranchQty.quantity ?? q.quantity,
      warehouseQty: updatedBranchQty.warehouseQty ?? q.warehouseQty,
      fridgeQty: updatedBranchQty.fridgeQty ?? q.fridgeQty,
      uom: updatedBranchQty.uom ?? q.uom,
    };
  });

  return {
    ...existing,
    quantities,
    total: updated.total,
    status: updated.status,
    costPerUnit: updated.costPerUnit,
  };
}

export const useStockStore = create<StockState>((set, get) => ({
  items: null,
  itemsLoading: false,
  itemsError: false,

  branches: null,
  branchesLoading: false,
  branchesError: false,

  lowStock: null,
  lowStockLoading: false,
  lowStockError: false,

  suppliers: null,
  suppliersLoading: false,
  suppliersError: false,

  thresholds: null,
  thresholdsLoading: false,
  thresholdsError: false,
  savingThresholds: false,

  isResyncingMenu: false,

  banner: null,
  bannerLoading: false,
  bannerError: false,

  isSubmittingDelivery: false,
  isTransferringToFridge: false,
  isSavingUom: false,

  fetchItems: async (branchId, search) => {
    set({ itemsLoading: true, itemsError: false });
    try {
      const items = await stockService.getItems(branchId, search);
      set({ items, itemsLoading: false });
    } catch {
      set({ itemsLoading: false, itemsError: true });
    }
  },

  fetchBranches: async () => {
    set({ branchesLoading: true, branchesError: false });
    try {
      const branches = await stockService.getBranches();
      set({ branches, branchesLoading: false });
    } catch {
      set({ branchesLoading: false, branchesError: true });
    }
  },

  fetchLowStockAlerts: async (branchId) => {
    set({ lowStockLoading: true, lowStockError: false });
    try {
      const lowStock = await stockService.getStockAlerts(branchId);
      set({ lowStock, lowStockLoading: false });
    } catch {
      set({ lowStockLoading: false, lowStockError: true });
    }
  },

  fetchSuppliers: async () => {
    set({ suppliersLoading: true, suppliersError: false });
    try {
      const suppliers = await stockService.getSuppliers();
      set({ suppliers, suppliersLoading: false });
    } catch {
      set({ suppliersLoading: false, suppliersError: true });
    }
  },

  fetchThresholds: async (branchId) => {
    set({ thresholdsLoading: true, thresholdsError: false });
    try {
      const thresholds = await stockService.getThresholds(branchId);
      set({ thresholds, thresholdsLoading: false });
    } catch {
      set({ thresholdsLoading: false, thresholdsError: true });
    }
  },

  // The one "add stock" action for both types. For drinks, the caller
  // sets payload.destination to "warehouse" (delivery) or "fridge"
  // (direct top-up) — see AdjustStockModal.
  adjustStock: async (payload) => {
    try {
      const updatedItem = await stockService.adjustStock(payload);
      set((state) => ({
        items: state.items
          ? state.items.map((i) => (i.id === updatedItem.id ? mergeItemBranch(i, updatedItem) : i))
          : state.items,
      }));
      toast.success('Stock adjusted.');
      return true;
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Could not adjust stock.'));
      return false;
    }
  },

  transferStock: async (payload) => {
    try {
      const { from, to } = await stockService.transferStock(payload);
      set((state) => ({
        items: state.items
          ? state.items.map((i) => {
              if (i.id === from.id) return mergeItemBranch(i, from);
              if (i.id === to.id) return mergeItemBranch(i, to);
              return i;
            })
          : state.items,
      }));
      toast.success('Transfer complete.');
      return true;
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Could not complete transfer.'));
      return false;
    }
  },

  // Food: removes from quantity. Drinks: removes from fridgeQty only —
  // backend resolves which field based on itemType.
  removeStock: async (payload) => {
    try {
      const updatedItem = await stockService.removeStock(payload);
      set((state) => ({
        items: state.items
          ? state.items.map((i) => (i.id === updatedItem.id ? mergeItemBranch(i, updatedItem) : i))
          : state.items,
      }));
      toast.success('Stock removed.');
      return true;
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Could not remove stock.'));
      return false;
    }
  },

  addSupplier: async (payload) => {
    try {
      const supplier = await stockService.addSupplier(payload);
      set((state) => ({
        suppliers: state.suppliers ? [...state.suppliers, supplier] : [supplier],
      }));
      toast.success('Supplier added.');
      return true;
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Could not add supplier.'));
      return false;
    }
  },

  saveThresholds: async (payload) => {
    set({ savingThresholds: true });
    try {
      const thresholds = await stockService.saveThresholds(payload);
      set({ thresholds, savingThresholds: false });
      toast.success('Thresholds saved.');
      return true;
    } catch (error) {
      set({ savingThresholds: false });
      toast.error(extractErrorMessage(error, 'Could not save thresholds.'));
      return false;
    }
  },

  updateCostPrice: async (payload) => {
    try {
      const updatedItem = await stockService.updateCostPrice(payload);
      set((state) => ({
        items: state.items
          ? state.items.map((i) => (i.id === updatedItem.id ? { ...i, costPerUnit: updatedItem.costPerUnit } : i))
          : state.items,
      }));
      toast.success('Cost price updated.');
      return true;
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Could not update cost price.'));
      return false;
    }
  },

  // Batch delivery — one invoice, several drink items, all added to
  // warehouseQty. Nothing changes in the cache if isDraft was true
  // (the backend writes nothing either — see stock.types.ts).
  receiveDrinksDelivery: async (payload) => {
    set({ isSubmittingDelivery: true });
    try {
      const { items: updatedItems } = await stockService.receiveDrinksDelivery(payload);
      set((state) => ({
        isSubmittingDelivery: false,
        items: state.items
          ? state.items.map((i) => updatedItems.find((u) => u.id === i.id) ?? i)
          : state.items,
      }));
      toast.success(payload.isDraft ? 'Delivery saved as draft.' : 'Delivery received.');
      return true;
    } catch (error) {
      set({ isSubmittingDelivery: false });
      toast.error(extractErrorMessage(error, 'Could not save delivery.'));
      return false;
    }
  },

  // Atomic warehouse -> fridge move for one drink item.
  transferToFridge: async (payload) => {
    set({ isTransferringToFridge: true });
    try {
      const updatedItem = await stockService.transferToFridge(payload);
      set((state) => ({
        isTransferringToFridge: false,
        items: state.items
          ? state.items.map((i) => (i.id === updatedItem.id ? mergeItemBranch(i, updatedItem) : i))
          : state.items,
      }));
      toast.success('Transferred to fridge.');
      return true;
    } catch (error) {
      set({ isTransferringToFridge: false });
      toast.error(extractErrorMessage(error, 'Could not complete transfer.'));
      return false;
    }
  },

  updateBranchUom: async (payload) => {
    set({ isSavingUom: true });
    try {
      const updatedItem = await stockService.updateBranchUom(payload);
      set((state) => ({
        isSavingUom: false,
        items: state.items
          ? state.items.map((i) => (i.id === updatedItem.id ? mergeItemBranch(i, updatedItem) : i))
          : state.items,
      }));
      toast.success('Units of measurement updated.');
      return true;
    } catch (error) {
      set({ isSavingUom: false });
      toast.error(extractErrorMessage(error, 'Could not update units of measurement.'));
      return false;
    }
  },

  // Replaces the old "Add Stock" flow. Backfills any menu item missing
  // an inventory row (new items, or items that predate the menu-sync
  // fix) — never creates a freestanding item by typed name.
  resyncMenu: async () => {
    set({ isResyncingMenu: true });
    try {
      const result = await stockService.resyncMenu();
      set({ isResyncingMenu: false });
      if (result.created > 0) {
        toast.success(`${result.created} item(s) synced into stock.`);
        await get().fetchItems();
      } else {
        toast.success('Stock is already in sync with the menu.');
      }
      return true;
    } catch (error) {
      set({ isResyncingMenu: false });
      toast.error(extractErrorMessage(error, 'Could not resync stock with menu.'));
      return false;
    }
  },

  fetchBanner: async (branchId) => {
    set({ bannerLoading: true, bannerError: false });
    try {
      const banner = await stockService.getStatusBanner(branchId);
      set({ banner, bannerLoading: false });
    } catch {
      set({ bannerLoading: false, bannerError: true });
    }
  },

  fetchAll: (branchId) => {
    const state = get();
    state.fetchItems(branchId);
    state.fetchBranches();
    state.fetchLowStockAlerts(branchId);
  },
}));

/*
 * ── DISABLED: "Add Stock" (freeform new-item registration) ──
 * Ingredients are out of scope — this system only tracks food and
 * drink menu items, and every stock row must have a menuItemId. Use
 * resyncMenu() (above) to backfill missing rows instead. Kept here for
 * reference only; do not re-add without re-checking the backend cascade.
 *
 * isAddingStock: boolean;
 * addStock: (payload: AddStockPayload) => Promise<boolean>;
 *
 * addStock: async (payload) => {
 *   set({ isAddingStock: true });
 *   try {
 *     const newItem = await stockService.addStock(payload);
 *     set((state) => ({
 *       isAddingStock: false,
 *       items: state.items ? [...state.items, newItem] : [newItem],
 *     }));
 *     toast.success('New item added to inventory.');
 *     return true;
 *   } catch (error) {
 *     set({ isAddingStock: false });
 *     toast.error(extractErrorMessage(error, 'Could not add item.'));
 *     return false;
 *   }
 * },
 */