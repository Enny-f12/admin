"use client";

import { useState } from "react";
import {
  Plus,
  ArrowLeftRight,
  SlidersHorizontal,
  AlertTriangle,
  Calendar,
  ChevronDown,
  X,
  Search,
} from "lucide-react";

type Tab = "receive" | "transfer" | "threshold";

type ReceivedItem = {
  name: string;
  qty: number;
  costPerUnit: number;
};

type ThresholdRow = {
  name: string;
  threshold: number;
  notify: boolean;
};

const INITIAL_RECEIVED: ReceivedItem[] = [
  { name: "Can Coke",       qty: 50,  costPerUnit: 500 },
  { name: "Can Fanta",      qty: 50,  costPerUnit: 500 },
  { name: "Aquafina Water", qty: 100, costPerUnit: 200 },
];

const INITIAL_THRESHOLDS: ThresholdRow[] = [
  { name: "Can Coke",       threshold: 10, notify: true },
  { name: "Aquafina Water", threshold: 15, notify: true },
  { name: "Can Sprite",     threshold: 5,  notify: true },
  { name: "Can Fanta",      threshold: 10, notify: true },
  { name: "Plastic Coke",   threshold: 15, notify: true },
  { name: "Zobo",           threshold: 10, notify: true },
];

export default function DrinksFridgePage() {
  const [tab, setTab] = useState<Tab>("receive");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Header tab={tab} />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <TabButton active={tab === "receive"} onClick={() => setTab("receive")} icon={<Plus size={16} strokeWidth={2} />} label="Receive Delivery" />
        <TabButton active={tab === "transfer"} onClick={() => setTab("transfer")} icon={<ArrowLeftRight size={16} strokeWidth={1.8} />} label="Transfer to Fridge" />
        <TabButton active={tab === "threshold"} onClick={() => setTab("threshold")} icon={<SlidersHorizontal size={16} strokeWidth={1.8} />} label="Fridge Threshold" />
      </div>

      {tab === "receive" && <ReceiveDeliveryView />}
      {tab === "transfer" && <TransferToFridgeView />}
      {tab === "threshold" && <FridgeThresholdView />}
    </div>
  );
}

/* ── Header (eyebrow / heading changes with tab) ── */
function Header({ tab }: { tab: Tab }) {
  const heading = tab === "receive" ? "RECEIVE DRINKS DELIVERY" : "TRANSFER TO FRIDGE";
  return (
    <div>
      <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "var(--color-primary)" }}>
        Foodies 1 LEKKI
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

/* ── Receive Delivery ── */
function ReceiveDeliveryView() {
  const [supplier, setSupplier] = useState("Beverage Distributor Limited");
  const [deliveryDate, setDeliveryDate] = useState("May 15, 2025");
  const [invoice, setInvoice] = useState("INV-5678.......");
  const [items, setItems] = useState<ReceivedItem[]>(INITIAL_RECEIVED);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [addSupplierOpen, setAddSupplierOpen] = useState(false);

  const totalCost = items.reduce((sum, i) => sum + i.qty * i.costPerUnit, 0);

  return (
    <>
      <div className="card">
        <Field label="Supplier">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select className="input" value={supplier} onChange={(e) => setSupplier(e.target.value)} style={{ flex: 1, minWidth: 200 }}>
              <option>Beverage Distributor Limited</option>
              <option>Fresh Farm Limited</option>
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
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              style={{ paddingLeft: 38, maxWidth: 260 }}
            />
          </div>
        </Field>

        <Field label="Invoice Number">
          <input className="input" value={invoice} onChange={(e) => setInvoice(e.target.value)} style={{ maxWidth: 300 }} />
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
              {items.map((item) => (
                <tr key={item.name}>
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
        <button style={outlineBtn}>Save Draft</button>
        <button className="btn btn-primary" style={{ padding: "10px 20px", fontSize: "0.85rem" }}>
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

/* ── Transfer to Fridge (inline form, not a modal) ── */
function TransferToFridgeView() {
  const [item] = useState("Can Pepsi");
  const [fridgeStock] = useState(3);
  const [warehouseStock] = useState(20);
  const [threshold] = useState(10);
  const [qty, setQty] = useState(7);
  const [reason, setReason] = useState("Restock fridge for lunch rush");

  const newFridgeStock = fridgeStock + qty;
  const newWarehouseStock = warehouseStock - qty;
  const belowThreshold = fridgeStock < threshold;

  return (
    <div className="card">
      <Field label="Item">
        <input className="input" value={item} readOnly />
      </Field>
      <Field label="Current Fridge Stock (packs)">
        <input className="input" value={fridgeStock} readOnly />
      </Field>
      <Field label="Current Warehouse Stock (packs)">
        <input className="input" value={warehouseStock} readOnly />
      </Field>
      <Field label="Fridge Threshold">
        <input className="input" value={`${threshold} units`} readOnly />
      </Field>

      {belowThreshold && (
        <p style={{ display: "flex", alignItems: "center", gap: 6, margin: "-6px 0 14px", fontSize: "0.85rem", color: "#a07a00" }}>
          <AlertTriangle size={14} strokeWidth={1.8} />
          Fridge is below threshold. Restocking recommended.
        </p>
      )}

      <Field label="Qty to Transfer (packs)">
        <input className="input" type="number" value={qty} onChange={(e) => setQty(Number(e.target.value) || 0)} />
      </Field>
      <Field label="New Fridge Stock (packs)">
        <input className="input" value={newFridgeStock} readOnly />
      </Field>
      <Field label="New Warehouse Stock (packs)">
        <input className="input" value={newWarehouseStock} readOnly />
      </Field>
      <Field label="Reason:">
        <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>

      <div style={{ display: "flex", gap: 10 }}>
        <button style={outlineBtn}>Cancel</button>
        <button className="btn btn-primary" style={{ padding: "10px 20px", fontSize: "0.85rem" }}>
          Transfer to Fridge
        </button>
      </div>
    </div>
  );
}

/* ── Fridge Threshold ── */
function FridgeThresholdView() {
  const [defaultThreshold, setDefaultThreshold] = useState(10);
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState(INITIAL_THRESHOLDS);

  const updateRow = (i: number, patch: Partial<ThresholdRow>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const filtered = rows.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

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
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {["Item", "Fridge Threshold", "Notify?"].map((c) => <th key={c}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr key={row.name}>
                  <td style={{ fontWeight: 600, color: "var(--color-text)" }}>{row.name}</td>
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
      </div>

      <div>
        <button className="btn btn-primary" style={{ padding: "10px 20px", fontSize: "0.85rem" }}>
          Save Changes
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

/* ── Modal shell (scrollable, capped height — same pattern as Stock Inventory) ── */
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

/* ── Add Item modal ── */
function AddItemModal({ onClose, onSave }: { onClose: () => void; onSave: (item: ReceivedItem) => void }) {
  const [name, setName] = useState("Can Pepsi");
  const [qty, setQty] = useState(50);
  const [cost, setCost] = useState(500);
  const totalCost = qty * cost;

  return (
    <ModalShell title="Add Item" onClose={onClose}>
      <Field label="Item">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Qty Received (packs)">
        <input className="input" type="number" value={qty} onChange={(e) => setQty(Number(e.target.value) || 0)} />
      </Field>
      <Field label="Cost per Unit (₦)">
        <input className="input" type="number" value={cost} onChange={(e) => setCost(Number(e.target.value) || 0)} />
      </Field>
      <Field label="Total Cost (₦)">
        <input className="input" value={`₦${totalCost.toLocaleString()}`} readOnly />
      </Field>
      <button
        className="btn btn-primary"
        style={{ width: "100%", padding: "10px 0", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center" }}
        onClick={() => onSave({ name, qty, costPerUnit: cost })}
      >
        Save
      </button>
    </ModalShell>
  );
}

/* ── Add New Supplier modal ── */
const SUPPLIER_TYPES = ["Beverage Supplier", "Food Supplier", "Packaging Supplier", "Other"];

function AddSupplierModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("Fresh farm limited");
  const [type, setType] = useState("");
  const [specify, setSpecify] = useState("+234 813 6666 888");
  const [contactPerson, setContactPerson] = useState("Mr. Adaralegbe");
  const [phone, setPhone] = useState("+234 813 6666 888");
  const [address, setAddress] = useState("Zone 9. Ajagbe Estate, Ogun State");

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
            onChange={(e) => setType(e.target.value)}
            style={{ appearance: "none", width: "100%" }}
          >
            <option value="">select type....</option>
            {SUPPLIER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDown size={16} strokeWidth={1.8} color="var(--color-text-muted)" style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        </div>
      </Field>

      {type === "Other" && (
        <Field label="Specfy Here">
          <input className="input" value={specify} onChange={(e) => setSpecify(e.target.value)} />
        </Field>
      )}

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
        <button className="btn btn-primary" style={{ padding: "9px 18px", fontSize: "0.85rem" }} onClick={onClose}>
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