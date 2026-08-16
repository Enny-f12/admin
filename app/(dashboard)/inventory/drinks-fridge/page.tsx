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
import { useDrinksStore } from "@/store/useDrinkStore";
import { DrinksItem, SupplierType } from "@/types/drinks.types";
import { useBranch, ALL_BRANCHES_ID } from "../../layout";

type Tab = "receive" | "transfer" | "threshold";

type DraftLineItem = {
  name: string;
  qty: number;
  costPerUnit: number;
};

export default function DrinksFridgePage() {
  const [tab, setTab] = useState<Tab>("receive");
  const branch = useBranch();
  const { fetchItems, fetchSuppliers, fetchThresholds, fetchSummary } = useDrinksStore();

  const isAllBranches = branch.id === ALL_BRANCHES_ID;
  const hasUsableBranch = Boolean(branch.id) && !isAllBranches;

  // branchId sent on every call below now that each branch is confirmed
  // to have its own warehouse/fridge stock. Pending backend request:
  // none of these endpoints accept branchId in the schema yet (as of
  // 15-Aug-26), so this is currently sent but silently ignored -- data
  // will read the same across branches until that request lands.
  useEffect(() => {
    if (!hasUsableBranch) return;
    fetchItems(branch.id);
    fetchSuppliers();
    fetchThresholds(branch.id);
    fetchSummary(branch.id);
  }, [fetchItems, fetchSuppliers, fetchThresholds, fetchSummary, branch.id, hasUsableBranch]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Header tab={tab} branchName={branch.name} />

      {!hasUsableBranch ? (
        <div className="card">
          <p style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: "0.9rem", color: "var(--color-text)" }}>
            <AlertTriangle size={16} strokeWidth={1.8} color="#a07a00" />
            Drinks & Fridge is per-branch -- pick a specific branch from the selector above to receive
            deliveries, transfer stock, or manage fridge thresholds.
          </p>
        </div>
      ) : (
        <>
          <SummaryCards />

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <TabButton active={tab === "receive"} onClick={() => setTab("receive")} icon={<Plus size={16} strokeWidth={2} />} label="Receive Delivery" />
            <TabButton active={tab === "transfer"} onClick={() => setTab("transfer")} icon={<ArrowLeftRight size={16} strokeWidth={1.8} />} label="Transfer to Fridge" />
            <TabButton active={tab === "threshold"} onClick={() => setTab("threshold")} icon={<SlidersHorizontal size={16} strokeWidth={1.8} />} label="Fridge Threshold" />
          </div>

          {tab === "receive" && <ReceiveDeliveryView branchId={branch.id} />}
          {tab === "transfer" && <TransferToFridgeView branchId={branch.id} />}
          {tab === "threshold" && <FridgeThresholdView branchId={branch.id} />}
        </>
      )}
    </div>
  );
}

/* -- Summary cards, same pattern as Stock Inventory's stat cards -- */
function SummaryCards() {
  const { summary, summaryLoading } = useDrinksStore();

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
      <div className="card" style={{ textAlign: "center" }}>
        <Box size={20} strokeWidth={1.8} color="#B5442E" style={{ margin: "0 auto 6px" }} />
        <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "var(--color-heading)" }}>
          {summaryLoading ? "..." : summary?.totalItems ?? "-"}
        </p>
        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Total Items</p>
      </div>
      <div className="card" style={{ textAlign: "center" }}>
        <AlertTriangle size={20} strokeWidth={1.8} color="#a07a00" style={{ margin: "0 auto 6px" }} />
        <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#a07a00" }}>
          {summaryLoading ? "..." : summary?.lowStock ?? "-"}
        </p>
        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Low Stock</p>
      </div>
      <div className="card" style={{ textAlign: "center" }}>
        <AlertTriangle size={20} strokeWidth={1.8} color="#E10B1C" style={{ margin: "0 auto 6px" }} />
        <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#E10B1C" }}>
          {summaryLoading ? "..." : summary?.outOfStock ?? "-"}
        </p>
        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Out of Stock</p>
      </div>
      <div className="card" style={{ textAlign: "center" }}>
        <Box size={20} strokeWidth={1.8} color="var(--color-primary)" style={{ margin: "0 auto 6px" }} />
        <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "var(--color-heading)" }}>
          {summaryLoading ? "..." : summary ? `₦${summary.totalValue.toLocaleString()}` : "-"}
        </p>
        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Total Value</p>
      </div>
    </div>
  );
}

/* -- Header -- */
function Header({ tab, branchName }: { tab: Tab; branchName: string }) {
  const heading = tab === "receive" ? "RECEIVE DRINKS DELIVERY" : "TRANSFER TO FRIDGE";
  return (
    <div>
      <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "var(--color-primary)" }}>
        {branchName}
      </p>
      <h1 style={{ margin: "6px 0 0", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-heading)" }}>
        {heading}
      </h1>
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

/* -- Receive Delivery -- */
function ReceiveDeliveryView({ branchId }: { branchId: string }) {
  const { suppliers, createDelivery, isSubmittingDelivery } = useDrinksStore();

  const [supplierId, setSupplierId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [invoice, setInvoice] = useState("");
  const [items, setItems] = useState<DraftLineItem[]>([]);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [addSupplierOpen, setAddSupplierOpen] = useState(false);

  const totalCost = items.reduce((sum, i) => sum + i.qty * i.costPerUnit, 0);

  const submit = async (isDraft: boolean) => {
    if (!items.length) return;
    const ok = await createDelivery(
      {
        supplierId: supplierId || null,
        deliveryDate,
        invoiceNumber: invoice,
        isDraft,
        items: items.map((i) => ({ itemName: i.name, quantity: i.qty, costPerUnit: i.costPerUnit })),
      },
      branchId,
    );
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
              {suppliers?.map((s) => (
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
            <input
              className="input"
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              style={{ paddingLeft: 38, maxWidth: 260 }}
            />
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
                <tr key={`${item.name}-${i}`}>
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
        <button style={outlineBtn} disabled={!items.length || isSubmittingDelivery} onClick={() => submit(true)}>
          {isSubmittingDelivery ? "Saving..." : "Save Draft"}
        </button>
        <button
          className="btn btn-primary"
          style={{ padding: "10px 20px", fontSize: "0.85rem" }}
          disabled={!items.length || isSubmittingDelivery}
          onClick={() => submit(false)}
        >
          Confirm Receipt
        </button>
      </div>

      {addItemOpen && (
        <AddItemModal
          onClose={() => setAddItemOpen(false)}
          onSave={(item) => {
            setItems((prev) => [...prev, item]);
            setAddItemOpen(false);
          }}
        />
      )}
      {addSupplierOpen && <AddSupplierModal onClose={() => setAddSupplierOpen(false)} />}
    </>
  );
}

/* -- Transfer to Fridge -- */
function TransferToFridgeView({ branchId }: { branchId: string }) {
  const { items, itemsLoading, itemsError, transferToFridge, isTransferring } = useDrinksStore();
  const [itemId, setItemId] = useState<string>("");
  const [qty, setQty] = useState(0);
  const [reason, setReason] = useState("Restock fridge for lunch rush");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (items?.length && !itemId) setItemId(items[0].id);
  }, [items, itemId]);

  const selected: DrinksItem | undefined = items?.find((i) => i.id === itemId);

  if (itemsLoading) {
    return <div className="card"><p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Loading...</p></div>;
  }

  if (itemsError || !items?.length || !selected) {
    return (
      <div className="card">
        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          No drinks data available
        </p>
      </div>
    );
  }

  const newFridgeStock = selected.fridgeStock + qty;
  const newWarehouseStock = selected.warehouseStock - qty;
  const belowThreshold = selected.fridgeStock < selected.fridgeThreshold;
  const exceedsWarehouse = qty > selected.warehouseStock;

  return (
    <div className="card">
      <Field label="Item">
        <select className="input" value={itemId} onChange={(e) => { setItemId(e.target.value); setQty(0); }}>
          {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
      </Field>
      <Field label={`Current Fridge Stock (${selected.unit})`}>
        <input className="input" value={selected.fridgeStock} readOnly />
      </Field>
      <Field label={`Current Warehouse Stock (${selected.unit})`}>
        <input className="input" value={selected.warehouseStock} readOnly />
      </Field>
      <Field label="Fridge Threshold">
        <input className="input" value={`${selected.fridgeThreshold} units`} readOnly />
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
            const ok = await transferToFridge({ itemId: selected.id, quantity: qty, reason }, branchId);
            if (ok) setQty(0);
          }}
        >
          {isTransferring ? "Transferring..." : "Transfer to Fridge"}
        </button>
      </div>
    </div>
  );
}

/* -- Fridge Threshold -- */
function FridgeThresholdView({ branchId }: { branchId: string }) {
  const { thresholds, thresholdsLoading, thresholdsError, savingThresholds, saveThresholds } =
    useDrinksStore();
  // fetchThresholds(branchId) already fired by the page-level effect.
  const [defaultThreshold, setDefaultThreshold] = useState(10);
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<{ itemId: string; itemName: string; threshold: number; notify: boolean }[]>([]);

  useEffect(() => {
    if (thresholds) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDefaultThreshold(thresholds.defaultThreshold);
      setRows(thresholds.items);
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
        <input
          className="input"
          placeholder="Search fridge thresholds..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", paddingLeft: 38 }}
        />
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "18px 20px 4px" }}>
          <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.04em", color: "var(--color-text-muted)" }}>
            ITEM SPECIFIC FRIDGE THRESHOLDS
          </p>
        </div>

        {thresholdsLoading && (
          <p style={{ padding: 20, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Loading...</p>
        )}
        {!thresholdsLoading && (thresholdsError || !rows.length) && (
          <p style={{ padding: 20, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            No fridge threshold data available
          </p>
        )}
        {!thresholdsLoading && rows.length > 0 && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  {["Item", "Fridge Threshold", "Notify?"].map((c) => <th key={c}>{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={row.itemId}>
                    <td style={{ fontWeight: 600, color: "var(--color-text)" }}>{row.itemName}</td>
                    <td>
                      <input
                        className="input"
                        type="number"
                        value={row.threshold}
                        onChange={(e) => updateRow(i, { threshold: Number(e.target.value) || 0 })}
                        style={{ width: 90 }}
                      />
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
          disabled={savingThresholds}
          onClick={() =>
            saveThresholds(
              {
                defaultThreshold,
                items: rows.map((r) => ({ itemId: r.itemId, threshold: r.threshold, notify: r.notify })),
              },
              branchId,
            )
          }
        >
          {savingThresholds ? "Saving..." : "Save Changes"}
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
      <span
        style={{
          width: 16, height: 16, borderRadius: "50%", border: `1.5px solid ${checked ? "var(--color-primary)" : "var(--color-border)"}`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}
      >
        {checked && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-primary)" }} />}
      </span>
      {label}
    </button>
  );
}

/* -- Modal shell -- */
function ModalShell({ title, onClose, children, width = 460 }: { title: string; onClose: () => void; children: React.ReactNode; width?: number }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        zIndex: 100, padding: "5vh 20px", overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width, maxWidth: "90vw", maxHeight: "88vh", background: "#fff", borderRadius: 14,
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
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

/* -- Add Item modal -- */
function AddItemModal({ onClose, onSave }: { onClose: () => void; onSave: (item: DraftLineItem) => void }) {
  const [name, setName] = useState("");
  const [qty, setQty] = useState(0);
  const [cost, setCost] = useState(0);
  const totalCost = qty * cost;

  return (
    <ModalShell title="Add Item" onClose={onClose}>
      <Field label="Item">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Qty Received (packs)">
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
        disabled={!name.trim() || !qty}
        onClick={() => onSave({ name, qty, costPerUnit: cost })}
      >
        Save
      </button>
    </ModalShell>
  );
}

/* -- Add New Supplier modal -- */
const SUPPLIER_TYPES: SupplierType[] = ["Beverage Supplier", "Food Supplier", "Packaging Supplier"];

function AddSupplierModal({ onClose }: { onClose: () => void }) {
  const { addSupplier } = useDrinksStore();
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
          <select
            className="input"
            value={type}
            onChange={(e) => setType(e.target.value as SupplierType)}
            style={{ appearance: "none", width: "100%" }}
          >
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
            const ok = await addSupplier({
              name,
              type: type as SupplierType,
              contactPerson,
              phone,
              address,
            });
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