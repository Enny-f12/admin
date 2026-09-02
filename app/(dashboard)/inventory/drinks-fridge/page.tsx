// app/(admin)/inventory/drinks-fridge/page.tsx — full file
//
// Previously sourced from useDrinksStore -> drinksService, a third
// independent copy of the same drinks data already tracked by
// useStockStore (Stock Inventory + Inventory Dashboard both read from
// there). Rewritten to source items/branches from useStockStore
// directly. Supplier flow (Add Supplier modal, supplier types) is
// UNCHANGED — same fields, same three types, same behavior — only the
// import path moved since drinks.service.ts is being deleted.
//
// One correction from earlier passes: "Transfer to Fridge" is a real
// atomic move (warehouseQty down, fridgeQty up, blocked if warehouse
// is insufficient) — not the same as Adjust Stock's destination
// toggle, which only adds to one bucket. Restored as its own action.

"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  ArrowLeftRight,
  SlidersHorizontal,
  AlertTriangle,
  Calendar,
  ChevronDown,
  X,
  Search,
  Box,
} from "lucide-react";
import { useStockStore } from "@/store/useStockStore";
import { StockItem, Supplier, SupplierType, DeliveryLineItem } from "@/types/stock.types";
import { useBranch } from "../../layout";

type Tab = "receive" | "transfer" | "threshold";

type DraftLineItem = {
  menuItemId: string;
  itemId: string;
  name: string;
  unit: string;
  qty: number;
  costPerUnit: number;
};

export default function DrinksFridgePage() {
  const [tab, setTab] = useState<Tab>("receive");
  const branch = useBranch();

  const {
    items,
    itemsLoading,
    itemsError,
    thresholds,
    thresholdsLoading,
    thresholdsError,
    savingThresholds,
    suppliers,
    isSubmittingDelivery,
    isTransferringToFridge,
    fetchItems,
    fetchThresholds,
    fetchSuppliers,
    saveThresholds,
    receiveDrinksDelivery,
    transferToFridge,
    addSupplier,
  } = useStockStore();

  const hasUsableBranch = Boolean(branch.id);

  useEffect(() => {
    if (!hasUsableBranch) return;
    fetchItems(branch.id);
    fetchThresholds(branch.id);
    fetchSuppliers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch.id, hasUsableBranch]);

  // Everything on this page is drinks-only — items filtered from the
  // SAME cache the Stock Inventory and Inventory Dashboard pages read.
  const drinkItems = (items ?? []).filter((i) => i.itemType === "drink");

  const summary = {
    totalItems: drinkItems.length,
    lowStock: drinkItems.filter((i) => i.status === "Low Stock").length,
    outOfStock: drinkItems.filter((i) => i.status === "Critical").length,
    totalValue: drinkItems.reduce((sum, i) => {
      const bq = i.quantities.find((q) => q.branchId === branch.id) ?? i.quantities[0];
      return sum + (bq?.fridgeQty ?? 0) * i.costPerUnit;
    }, 0),
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Header tab={tab} branchName={branch.name} />

      {!hasUsableBranch ? (
        <div className="card">
          <p style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: "0.9rem", color: "var(--color-text)" }}>
            <AlertTriangle size={16} strokeWidth={1.8} color="#a07a00" />
            Loading your branch...
          </p>
        </div>
      ) : (
        <>
          <SummaryCards summary={summary} loading={itemsLoading} />

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <TabButton active={tab === "receive"} onClick={() => setTab("receive")} icon={<Plus size={16} strokeWidth={2} />} label="Receive Delivery" />
            <TabButton active={tab === "transfer"} onClick={() => setTab("transfer")} icon={<ArrowLeftRight size={16} strokeWidth={1.8} />} label="Transfer to Fridge" />
            <TabButton active={tab === "threshold"} onClick={() => setTab("threshold")} icon={<SlidersHorizontal size={16} strokeWidth={1.8} />} label="Fridge Threshold" />
          </div>

          {tab === "receive" && (
            <ReceiveDeliveryView
              branchId={branch.id}
              drinkItems={drinkItems}
              suppliers={suppliers ?? []}
              isSubmitting={isSubmittingDelivery}
              onSubmit={receiveDrinksDelivery}
              onAddSupplier={addSupplier}
            />
          )}
          {tab === "transfer" && (
            <TransferToFridgeView
              branchId={branch.id}
              items={drinkItems}
              itemsLoading={itemsLoading}
              itemsError={itemsError}
              isTransferring={isTransferringToFridge}
              onTransfer={transferToFridge}
            />
          )}
          {tab === "threshold" && (
            <FridgeThresholdView
              branchId={branch.id}
              thresholds={thresholds}
              loading={thresholdsLoading}
              error={thresholdsError}
              saving={savingThresholds}
              onSave={saveThresholds}
            />
          )}
        </>
      )}
    </div>
  );
}

/* -- Summary cards -- */
function SummaryCards({
  summary, loading,
}: { summary: { totalItems: number; lowStock: number; outOfStock: number; totalValue: number }; loading: boolean }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
      <div className="card" style={{ textAlign: "center" }}>
        <Box size={20} strokeWidth={1.8} color="#B5442E" style={{ margin: "0 auto 6px" }} />
        <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "var(--color-heading)" }}>
          {loading ? "..." : summary.totalItems}
        </p>
        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Total Items</p>
      </div>
      <div className="card" style={{ textAlign: "center" }}>
        <AlertTriangle size={20} strokeWidth={1.8} color="#a07a00" style={{ margin: "0 auto 6px" }} />
        <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#a07a00" }}>
          {loading ? "..." : summary.lowStock}
        </p>
        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Low Stock</p>
      </div>
      <div className="card" style={{ textAlign: "center" }}>
        <AlertTriangle size={20} strokeWidth={1.8} color="#E10B1C" style={{ margin: "0 auto 6px" }} />
        <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#E10B1C" }}>
          {loading ? "..." : summary.outOfStock}
        </p>
        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Out of Stock</p>
      </div>
      <div className="card" style={{ textAlign: "center" }}>
        <Box size={20} strokeWidth={1.8} color="var(--color-primary)" style={{ margin: "0 auto 6px" }} />
        <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "var(--color-heading)" }}>
          {loading ? "..." : `₦${summary.totalValue.toLocaleString()}`}
        </p>
        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Total Value</p>
      </div>
    </div>
  );
}

/* -- Header -- */
function Header({ tab, branchName }: { tab: Tab; branchName: string }) {
  const heading = tab === "receive" ? "RECEIVE DRINKS DELIVERY" : tab === "transfer" ? "TRANSFER TO FRIDGE" : "FRIDGE THRESHOLDS";
  return (
    <div>
      <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "var(--color-primary)" }}>{branchName}</p>
      <h1 style={{ margin: "6px 0 0", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-heading)" }}>{heading}</h1>
      <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
        Warehouse stock and fridge transfers
      </p>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={active ? "btn btn-primary" : undefined}
      style={{
        display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 8,
        border: active ? "none" : "1px solid var(--color-border)",
        background: active ? undefined : "#fff",
        cursor: "pointer", fontSize: "0.85rem", fontWeight: 500,
        color: active ? undefined : "var(--color-text)", fontFamily: "var(--font-sans)",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
      <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)" }}>{label}</label>
      {children}
    </div>
  );
}

/* -- Receive Delivery (batch, multiple items, one invoice) --
   Line items now pick an existing drink from the menu (menuItemId)
   instead of typing a free-text name — a freeform name field is
   exactly how orphaned, unlinked inventory rows happened before. */
function ReceiveDeliveryView({
  branchId, drinkItems, suppliers, isSubmitting, onSubmit, onAddSupplier,
}: {
  branchId: string;
  drinkItems: StockItem[];
  suppliers: Supplier[];
  isSubmitting: boolean;
  onSubmit: (payload: {
    branchId: string;
    supplierId: string | null;
    deliveryDate: string;
    invoiceNumber: string;
    isDraft: boolean;
    items: DeliveryLineItem[];
  }) => Promise<boolean>;
  onAddSupplier: (payload: { name: string; type: SupplierType; contactPerson: string; phone: string; address: string }) => Promise<boolean>;
}) {
  const [supplierId, setSupplierId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [invoice, setInvoice] = useState("");
  const [items, setItems] = useState<DraftLineItem[]>([]);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [addSupplierOpen, setAddSupplierOpen] = useState(false);

  const totalCost = items.reduce((sum, i) => sum + i.qty * i.costPerUnit, 0);

  const submit = async (isDraft: boolean) => {
    if (!items.length) return;
    const ok = await onSubmit({
      branchId,
      supplierId: supplierId || null,
      deliveryDate,
      invoiceNumber: invoice,
      isDraft,
      items: items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.qty, costPerUnit: i.costPerUnit })),
    });
    if (ok && !isDraft) {
      setItems([]);
      setInvoice("");
    }
  };

  return (
    <>
      <div className="card">
        <Field label="Supplier">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select className="input" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} style={{ flex: 1, minWidth: 200 }}>
              <option value="">Select supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <button
              onClick={() => setAddSupplierOpen(true)}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "0 14px", height: 42, borderRadius: 8,
                border: "1px solid var(--color-primary)", background: "#fff", color: "var(--color-primary)",
                fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
              }}
            >
              <Plus size={15} strokeWidth={2} />
              Add New Supplier
            </button>
          </div>
        </Field>

        <Field label="Delivery Date">
          <div style={{ position: "relative" }}>
            <Calendar size={16} strokeWidth={1.8} color="var(--color-primary)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
            <input className="input" type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} style={{ paddingLeft: 38, maxWidth: 260 }} />
          </div>
        </Field>

        <Field label="Invoice Number">
          <input className="input" placeholder="INV-5678......." value={invoice} onChange={(e) => setInvoice(e.target.value)} style={{ maxWidth: 300 }} />
        </Field>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "18px 20px 4px" }}>
          <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "var(--color-heading)" }}>
            ITEMS RECEIVED (adds to Warehouse)
          </p>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {["Item", "Qty Received", "Cost per Unit", "Total Cost"].map((c) => <th key={c}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: 20, color: "var(--color-text-muted)" }}>
                    No items added yet
                  </td>
                </tr>
              )}
              {items.map((item, i) => (
                <tr key={`${item.menuItemId}-${i}`}>
                  <td style={{ fontWeight: 600, color: "var(--color-text)" }}>{item.name}</td>
                  <td>{item.qty}</td>
                  <td>₦{item.costPerUnit.toLocaleString()}</td>
                  <td style={{ fontWeight: 600 }}>₦{(item.qty * item.costPerUnit).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "14px 20px" }}>
          <button
            onClick={() => setAddItemOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8,
              border: "1px solid rgba(225,11,28,0.3)", background: "rgba(225,11,28,0.05)",
              color: "var(--color-primary)", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            <Plus size={15} strokeWidth={2} />
            Add Item
          </button>
        </div>
      </div>

      <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--color-heading)" }}>
        Total Cost: ₦{totalCost.toLocaleString()}
      </p>

      <p style={{ display: "flex", alignItems: "center", gap: 6, margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
        <AlertTriangle size={14} strokeWidth={1.8} color="#a07a00" />
        This adds to WAREHOUSE stock. Use <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>&ldquo;Transfer to Fridge&rdquo;</span> when needed.
      </p>

      <div style={{ display: "flex", gap: 10 }}>
        <button style={outlineBtn} disabled={!items.length || isSubmitting} onClick={() => submit(true)}>
          {isSubmitting ? "Saving..." : "Save Draft"}
        </button>
        <button
          className="btn btn-primary"
          style={{ padding: "10px 20px", fontSize: "0.85rem" }}
          disabled={!items.length || isSubmitting}
          onClick={() => submit(false)}
        >
          Confirm Receipt
        </button>
      </div>

      {addItemOpen && (
        <AddItemModal
          drinkItems={drinkItems}
          onClose={() => setAddItemOpen(false)}
          onSave={(item) => {
            setItems((prev) => [...prev, item]);
            setAddItemOpen(false);
          }}
        />
      )}
      {addSupplierOpen && (
        <AddSupplierModal onClose={() => setAddSupplierOpen(false)} onSave={onAddSupplier} />
      )}
    </>
  );
}

/* -- Transfer to Fridge — real atomic move, warehouse -> fridge -- */
function TransferToFridgeView({
  branchId, items, itemsLoading, itemsError, isTransferring, onTransfer,
}: {
  branchId: string;
  items: StockItem[];
  itemsLoading: boolean;
  itemsError: boolean;
  isTransferring: boolean;
  onTransfer: (payload: { itemId: string; menuItemId: string; branchId: string; quantity: number; reason: string }) => Promise<boolean>;
}) {
  const [itemId, setItemId] = useState<string>("");
  const [qty, setQty] = useState(0);
  const [reason, setReason] = useState("Restock fridge for lunch rush");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (items.length && !itemId) setItemId(items[0].id);
  }, [items, itemId]);

  const selected = items.find((i) => i.id === itemId) ?? items[0];
  const bq = selected?.quantities.find((q) => q.branchId === branchId) ?? selected?.quantities[0];

  if (itemsLoading) {
    return <div className="card"><p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Loading...</p></div>;
  }

  if (itemsError || !selected || !bq) {
    return (
      <div className="card">
        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>No drinks data available</p>
      </div>
    );
  }

  const fridgeStock = bq.fridgeQty ?? 0;
  const warehouseStock = bq.warehouseQty ?? 0;
  const newFridgeStock = fridgeStock + qty;
  const newWarehouseStock = warehouseStock - qty;
  const belowThreshold = fridgeStock < selected.threshold;
  const exceedsWarehouse = qty > warehouseStock;

  return (
    <div className="card">
      <Field label="Item">
        <select className="input" value={itemId} onChange={(e) => { setItemId(e.target.value); setQty(0); }}>
          {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
      </Field>
      <Field label={`Current Fridge Stock (${selected.unit})`}>
        <input className="input" value={fridgeStock} readOnly />
      </Field>
      <Field label={`Current Warehouse Stock (${selected.unit})`}>
        <input className="input" value={warehouseStock} readOnly />
      </Field>
      <Field label="Fridge Threshold">
        <input className="input" value={`${selected.threshold} units`} readOnly />
      </Field>

      {belowThreshold && (
        <p style={{ display: "flex", alignItems: "center", gap: 6, margin: "-6px 0 14px", fontSize: "0.85rem", color: "#a07a00" }}>
          <AlertTriangle size={14} strokeWidth={1.8} />
          Fridge is below threshold. Restocking recommended.
        </p>
      )}

      <Field label={`Qty to Transfer (${selected.unit})`}>
        <input className="input" type="number" value={qty} onChange={(e) => setQty(Number(e.target.value) || 0)} />
      </Field>

      {exceedsWarehouse && (
        <p style={{ margin: "-6px 0 14px", fontSize: "0.8rem", color: "#E10B1C" }}>
          Exceeds available warehouse stock.
        </p>
      )}

      <Field label={`New Fridge Stock (${selected.unit})`}>
        <input className="input" value={newFridgeStock} readOnly />
      </Field>
      <Field label={`New Warehouse Stock (${selected.unit})`}>
        <input className="input" value={newWarehouseStock} readOnly />
      </Field>
      <Field label="Reason:">
        <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>

      <div style={{ display: "flex", gap: 10 }}>
        <button style={outlineBtn} onClick={() => setQty(0)}>Cancel</button>
        <button
          className="btn btn-primary"
          style={{ padding: "10px 20px", fontSize: "0.85rem" }}
          disabled={!qty || exceedsWarehouse || isTransferring}
          onClick={async () => {
            const ok = await onTransfer({ itemId: selected.id, menuItemId: selected.menuItemId, branchId, quantity: qty, reason });
            if (ok) setQty(0);
          }}
        >
          {isTransferring ? "Transferring..." : "Transfer to Fridge"}
        </button>
      </div>
    </div>
  );
}

/* -- Fridge Threshold — reuses the SAME thresholds config as the Stock
   Inventory page (StockItemThreshold is itemType-aware), filtered to
   drinks here. -- */
function FridgeThresholdView({
  thresholds, loading, error, saving, onSave,
}: {
  branchId: string;
  thresholds: { defaultThreshold: number; items: { itemId: string; itemName: string; itemType: string; unit: string; threshold: number; notify: boolean; autoReorder: boolean }[] } | null;
  loading: boolean;
  error: boolean;
  saving: boolean;
  onSave: (payload: { defaultThreshold: number; items: { itemId: string; threshold: number; notify: boolean; autoReorder: boolean }[] }) => Promise<boolean>;
}) {
  const [defaultThreshold, setDefaultThreshold] = useState(10);
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<{ itemId: string; itemName: string; threshold: number; notify: boolean; autoReorder: boolean }[]>([]);

  useEffect(() => {
    if (thresholds) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDefaultThreshold(thresholds.defaultThreshold);
      setRows(thresholds.items.filter((r) => r.itemType === "drink"));
    }
  }, [thresholds]);

  const updateRow = (i: number, patch: Partial<(typeof rows)[number]>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const filtered = rows.filter((r) => r.itemName.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <Field label="Default fridge threshold for all drinks">
        <input
          className="input"
          value={`${defaultThreshold} units`}
          onChange={(e) => setDefaultThreshold(Number(e.target.value.replace(/\D/g, "")) || 0)}
          style={{ maxWidth: 300 }}
        />
      </Field>

      <p style={{ margin: "-6px 0 6px", fontSize: "0.85rem", color: "var(--color-text)" }}>
        When fridge stock falls below threshold, show alert and suggest transfer from warehouse.
      </p>

      <div style={{ position: "relative" }}>
        <Search size={16} strokeWidth={1.8} color="var(--color-text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
        <input className="input" placeholder="Search fridge thresholds..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: "100%", paddingLeft: 38 }} />
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "18px 20px 4px" }}>
          <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.04em", color: "var(--color-text-muted)" }}>
            ITEM SPECIFIC FRIDGE THRESHOLDS
          </p>
        </div>

        {loading && <p style={{ padding: 20, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Loading...</p>}
        {!loading && (error || !rows.length) && (
          <p style={{ padding: 20, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>No fridge threshold data available</p>
        )}
        {!loading && rows.length > 0 && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>{["Item", "Fridge Threshold", "Notify?"].map((c) => <th key={c}>{c}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={row.itemId}>
                    <td style={{ fontWeight: 600, color: "var(--color-text)" }}>{row.itemName}</td>
                    <td>
                      <input className="input" type="number" value={row.threshold} onChange={(e) => updateRow(i, { threshold: Number(e.target.value) || 0 })} style={{ width: 90 }} />
                    </td>
                    <td>
                      <Radio checked={row.notify} onClick={() => updateRow(i, { notify: !row.notify })} label="Yes" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <button
          className="btn btn-primary"
          style={{ padding: "10px 20px", fontSize: "0.85rem" }}
          disabled={saving}
          onClick={() =>
            onSave({
              defaultThreshold,
              items: rows.map((r) => ({ itemId: r.itemId, threshold: r.threshold, notify: r.notify, autoReorder: r.autoReorder })),
            })
          }
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </>
  );
}

function Radio({ checked, onClick, label }: { checked: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: "0.85rem", color: "var(--color-text)" }}
    >
      <span style={{ width: 16, height: 16, borderRadius: "50%", border: `1.5px solid ${checked ? "var(--color-primary)" : "var(--color-border)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {checked && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-primary)" }} />}
      </span>
      {label}
    </button>
  );
}

function ModalShell({ title, onClose, children, width = 460 }: { title: string; onClose: () => void; children: React.ReactNode; width?: number }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 100, padding: "5vh 20px", overflowY: "auto" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width, maxWidth: "90vw", maxHeight: "88vh", background: "#fff", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", flexShrink: 0, borderBottom: "1px solid var(--color-border)" }}>
          <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--color-heading)" }}>{title}</h3>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex" }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: "20px 24px 24px", overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

/* -- Add Item modal — NOW picks an existing drink from the menu
   (menuItemId) instead of a free-text name. A freeform name field is
   exactly how disconnected, orphaned inventory rows happened before. -- */
function AddItemModal({
  drinkItems, onClose, onSave,
}: {
  drinkItems: StockItem[];
  onClose: () => void;
  onSave: (item: DraftLineItem) => void;
}) {
  const [itemId, setItemId] = useState(drinkItems[0]?.id ?? "");
  const selected = drinkItems.find((i) => i.id === itemId);
  const [qty, setQty] = useState(0);
  const [cost, setCost] = useState(0);
  const totalCost = qty * cost;

  if (!drinkItems.length) {
    return (
      <ModalShell title="Add Item" onClose={onClose}>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          No drinks found in the menu yet. Add the drink in Menu Management first.
        </p>
      </ModalShell>
    );
  }

  return (
    <ModalShell title="Add Item" onClose={onClose}>
      <Field label="Item">
        <select className="input" value={itemId} onChange={(e) => setItemId(e.target.value)}>
          {drinkItems.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
      </Field>
      <Field label="Qty Received">
        <input className="input" type="number" value={qty} onChange={(e) => setQty(Number(e.target.value) || 0)} />
      </Field>
      <Field label="Cost per Unit">
        <input className="input" type="number" value={cost} onChange={(e) => setCost(Number(e.target.value) || 0)} />
      </Field>
      <Field label="Total Cost">
        <input className="input" value={`₦${totalCost.toLocaleString()}`} readOnly />
      </Field>
      <button
        className="btn btn-primary"
        style={{ width: "100%", padding: "10px 0", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center" }}
        disabled={!selected || !qty}
        onClick={() => selected && onSave({ menuItemId: selected.menuItemId, itemId: selected.id, name: selected.name, unit: selected.unit, qty, costPerUnit: cost })}
      >
        Save
      </button>
    </ModalShell>
  );
}

/* -- Add New Supplier modal — UNCHANGED behavior, same three types,
   same fields. Only the save call now goes through the store passed
   in as a prop instead of importing drinksService directly. -- */
const SUPPLIER_TYPES: SupplierType[] = ["Beverage Supplier", "Food Supplier", "Packaging Supplier"];

function AddSupplierModal({
  onClose, onSave,
}: {
  onClose: () => void;
  onSave: (payload: { name: string; type: SupplierType; contactPerson: string; phone: string; address: string }) => Promise<boolean>;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<SupplierType | "">("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const canSave = name.trim() && type;

  return (
    <ModalShell title="Add New Supplier" onClose={onClose}>
      <Field label="Name">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>

      <Field label="Type">
        <div style={{ position: "relative" }}>
          <select className="input" value={type} onChange={(e) => setType(e.target.value as SupplierType)} style={{ appearance: "none", width: "100%" }}>
            <option value="">select type....</option>
            {SUPPLIER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDown size={16} strokeWidth={1.8} color="var(--color-text-muted)" style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        </div>
      </Field>

      <Field label="Contact Person">
        <input className="input" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
      </Field>
      <Field label="Phone">
        <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </Field>
      <Field label="Address">
        <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
      </Field>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button onClick={onClose} style={outlineBtn}>Cancel</button>
        <button
          className="btn btn-primary"
          style={{ padding: "9px 18px", fontSize: "0.85rem" }}
          disabled={!canSave}
          onClick={async () => {
            const ok = await onSave({ name, type: type as SupplierType, contactPerson, phone, address });
            if (ok) onClose();
          }}
        >
          Save
        </button>
      </div>
    </ModalShell>
  );
}

const outlineBtn: React.CSSProperties = {
  padding: "10px 20px", borderRadius: 8, border: "1px solid var(--color-border)", background: "#fff",
  cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)", fontFamily: "var(--font-sans)",
};