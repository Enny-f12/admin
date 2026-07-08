"use client";

import { useState } from "react";
import {
  Box,
  AlertTriangle,
  Plus,
  Minus,
  ArrowLeftRight,
  PackageMinus,
  SlidersHorizontal,
  Search,
  ChevronDown,
  X,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

/* ── Types ── */
type Status = "In Stock" | "Low Stock" | "Critical";

type Item = {
  name: string;
  unit: string;
  lekki1: number;
  lekki2: number;
  maitama: number;
  status: Status;
  costPerUnit: number;
};

type ThresholdRow = {
  name: string;
  unit: string;
  threshold: number;
  notify: boolean;
  autoReorder: boolean;
};

type ModalItem = {
  name: string;
  unit: string;
  status?: Status;
  current: number;
};

/* ── Data ── */
const ITEMS: Item[] = [
  { name: "Melon",         unit: "kg",    lekki1: 55,  lekki2: 30,  maitama: 55,  status: "In Stock",  costPerUnit: 1200 },
  { name: "Basmati Rice",  unit: "kg",    lekki1: 15,  lekki2: 10,  maitama: 15,  status: "Low Stock", costPerUnit: 1200 },
  { name: "Ofada Rice",    unit: "kg",    lekki1: 100, lekki2: 150, maitama: 100, status: "In Stock",  costPerUnit: 1200 },
  { name: "Frozen Turkey", unit: "kg",    lekki1: 0,   lekki2: 0,   maitama: 0,   status: "Critical",  costPerUnit: 1200 },
  { name: "Yam",           unit: "Pcs",   lekki1: 100, lekki2: 80,  maitama: 100, status: "In Stock",  costPerUnit: 1200 },
  { name: "Seasoning",     unit: "packs", lekki1: 13,  lekki2: 8,   maitama: 13,  status: "Low Stock", costPerUnit: 1200 },
];

const THRESHOLD_ROWS: ThresholdRow[] = [
  { name: "Melon",          unit: "kg",    threshold: 20, notify: true,  autoReorder: false },
  { name: "Basmati Rice",   unit: "kg",    threshold: 15, notify: false, autoReorder: false },
  { name: "Ofada  Rice",    unit: "kg",    threshold: 5,  notify: false, autoReorder: false },
  { name: "Frozen Chicken", unit: "kg",    threshold: 10, notify: false, autoReorder: false },
  { name: "Yam",            unit: "pcs",   threshold: 30, notify: false, autoReorder: false },
  { name: "Seasoning",      unit: "packs", threshold: 10, notify: false, autoReorder: false },
];

const ALERT = [
  { name: "Seasoning",     left: "20 packs left" },
  { name: "Basmati Rice",  left: "8 kg left" },
];

const BRANCH_OPTIONS = ["All Branches", "Lekki 1", "Lekki 2", "Maitama"];

const STATUS_CLASS: Record<Status, string> = {
  "In Stock":  "badge badge-green",
  "Low Stock": "badge badge-yellow",
  "Critical":  "badge badge-red",
};

const StatusBadge = ({ status }: { status: Status }) => (
  <span className={STATUS_CLASS[status]} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
    {status === "In Stock" && <TrendingUp size={12} strokeWidth={2} />}
    {status === "Low Stock" && <TrendingDown size={12} strokeWidth={2} />}
    {status === "Critical" && <AlertTriangle size={12} strokeWidth={2} />}
    {status}
  </span>
);

export default function StockInventoryPage() {
  const totalItems = ITEMS.length;
  const lowStockCount = ITEMS.filter((i) => i.status === "Low Stock").length;
  const criticalCount = ITEMS.filter((i) => i.status === "Critical").length;

  const [branch, setBranch] = useState("Lekki 1");
  const [branchOpen, setBranchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showThresholds, setShowThresholds] = useState(false);

  const [adjustItem, setAdjustItem] = useState<ModalItem | null>(null);
  const [transferItem, setTransferItem] = useState<ModalItem | null>(null);
  const [removeItem, setRemoveItem] = useState<ModalItem | null>(null);
  const [supplierOpen, setSupplierOpen] = useState(false);

  const filteredItems = ITEMS.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  const branchValue = (item: Item, key: "lekki1" | "lekki2" | "maitama") => {
    if (branch === "All Branches") return item[key];
    const selectedKey =
      branch === "Lekki 1" ? "lekki1" : branch === "Lekki 2" ? "lekki2" : "maitama";
    return key === selectedKey ? item[key] : undefined;
  };

  const totalFor = (item: Item) => {
    if (branch === "All Branches") return item.lekki1 + item.lekki2 + item.maitama;
    const selectedKey =
      branch === "Lekki 1" ? "lekki1" : branch === "Lekki 2" ? "lekki2" : "maitama";
    return item[selectedKey];
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, position: "relative" }}>

      {!showThresholds ? (
        <>
          <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 600, color: "var(--color-heading)" }}>
            Stock levels across all locations
          </h2>

          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <div className="card" style={{ textAlign: "center" }}>
              <Box size={20} strokeWidth={1.8} color="#B5442E" style={{ margin: "0 auto 6px" }} />
              <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "var(--color-heading)" }}>{totalItems}</p>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Total Items</p>
            </div>
            <div className="card" style={{ textAlign: "center" }}>
              <AlertTriangle size={20} strokeWidth={1.8} color="#a07a00" style={{ margin: "0 auto 6px" }} />
              <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#a07a00" }}>{lowStockCount}</p>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Low Stock</p>
            </div>
            <div className="card" style={{ textAlign: "center" }}>
              <AlertTriangle size={20} strokeWidth={1.8} color="#E10B1C" style={{ margin: "0 auto 6px" }} />
              <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#E10B1C" }}>{criticalCount}</p>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Critical</p>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <button
              className="btn btn-primary"
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", fontSize: "0.85rem" }}
              onClick={() => setAdjustItem({ name: ITEMS[0].name, unit: ITEMS[0].unit, status: ITEMS[0].status, current: ITEMS[0].lekki1 })}
            >
              <Plus size={16} strokeWidth={2} />
              Adjust Stock
            </button>
            <ActionButton
              icon={<ArrowLeftRight size={16} strokeWidth={1.8} />}
              label="Transfer"
              onClick={() => setTransferItem({ name: ITEMS[0].name, unit: ITEMS[0].unit, current: ITEMS[0].lekki1 })}
            />
            <ActionButton
              icon={<PackageMinus size={16} strokeWidth={1.8} />}
              label="Remove Stock"
              onClick={() => setRemoveItem({ name: ITEMS[0].name, unit: ITEMS[0].unit, status: ITEMS[0].status, current: ITEMS[0].lekki1 })}
            />
            <ActionButton
              icon={<SlidersHorizontal size={16} strokeWidth={1.8} />}
              label="Threshold Configuration"
              onClick={() => setShowThresholds(true)}
            />
          </div>

          {/* Branch filter + search */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setBranchOpen((v) => !v)}
                style={{
                  display: "flex", alignItems: "center", gap: 20, justifyContent: "space-between",
                  minWidth: 150, padding: "10px 14px", borderRadius: 8, border: "1px solid var(--color-border)",
                  background: "#fff", cursor: "pointer", fontSize: "0.9rem", color: "var(--color-text)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {branch}
                <ChevronDown size={16} strokeWidth={1.8} color="var(--color-text-muted)" />
              </button>
              {branchOpen && (
                <div
                  style={{
                    position: "absolute", top: "calc(100% + 6px)", left: 0, minWidth: 150,
                    background: "#fff", border: "1px solid var(--color-border)", borderRadius: 10,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.10)", overflow: "hidden", zIndex: 60,
                  }}
                >
                  {BRANCH_OPTIONS.map((b) => (
                    <button
                      key={b}
                      onClick={() => { setBranch(b); setBranchOpen(false); }}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
                        padding: "10px 14px", background: b === branch ? "var(--color-bg-soft)" : "#fff",
                        border: "none", cursor: "pointer", fontSize: "0.85rem", fontFamily: "var(--font-sans)",
                        color: "var(--color-text)", textAlign: "left",
                      }}
                    >
                      {b === branch && <span style={{ marginRight: 6 }}>✓</span>}
                      {b}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
              <Search size={16} strokeWidth={1.8} color="var(--color-text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
              <input
                className="input"
                placeholder="Search inventory..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: "100%", paddingLeft: 38 }}
              />
            </div>
          </div>

          {/* Critical alert */}
          <div className="card" style={{ background: "rgba(225,11,28,0.05)", border: "1px solid rgba(225,11,28,0.25)" }}>
            <p style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 10px", fontWeight: 700, color: "#E10B1C", fontSize: "0.9rem" }}>
              <AlertTriangle size={16} strokeWidth={1.8} />
              Critical Stock Alert
            </p>
            {ALERT.map((a) => (
              <div key={a.name} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", padding: "3px 0" }}>
                <span style={{ color: "var(--color-text)" }}>{a.name}</span>
                <span style={{ color: "#E10B1C", fontWeight: 600 }}>{a.left}</span>
              </div>
            ))}
          </div>

          {/* Main table */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    {["Item", "Lekki 1", "Lekki 2", "Maitama", "Total", "Status", "Actions"].map((c) => (
                      <th key={c}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.name}>
                      <td>
                        <p style={{ margin: 0, fontWeight: 600, color: "var(--color-text)" }}>{item.name}</p>
                        <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-text-muted)" }}>{item.unit}</p>
                      </td>
                      <td>{branchValue(item, "lekki1") ?? "-"}</td>
                      <td>{branchValue(item, "lekki2") ?? "-"}</td>
                      <td>{branchValue(item, "maitama") ?? "-"}</td>
                      <td style={{ fontWeight: 600 }}>{totalFor(item)}</td>
                      <td><StatusBadge status={item.status} /></td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <IconButton
                            icon={<Plus size={14} strokeWidth={2} />}
                            onClick={() => setAdjustItem({ name: item.name, unit: item.unit, status: item.status, current: item.lekki1 })}
                          />
                          <IconButton
                            icon={<ArrowLeftRight size={14} strokeWidth={1.8} />}
                            onClick={() => setTransferItem({ name: item.name, unit: item.unit, current: item.lekki1 })}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <ThresholdView onBack={() => setShowThresholds(false)} />
      )}

      {adjustItem && (
        <AdjustStockModal
          item={adjustItem}
          onClose={() => setAdjustItem(null)}
          onOpenSupplier={() => setSupplierOpen(true)}
          hidden={supplierOpen}
        />
      )}
      {transferItem && <TransferStockModal item={transferItem} onClose={() => setTransferItem(null)} />}
      {removeItem && <RemoveStockModal item={removeItem} onClose={() => setRemoveItem(null)} />}
      {supplierOpen && <AddSupplierModal onClose={() => setSupplierOpen(false)} />}
    </div>
  );
}

/* ── Small shared building blocks ── */

function ActionButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 8,
        border: "1px solid var(--color-border)", background: "#fff", cursor: "pointer",
        fontSize: "0.85rem", fontWeight: 500, color: "var(--color-text)", fontFamily: "var(--font-sans)",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function IconButton({ icon, onClick }: { icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30,
        borderRadius: 8, border: "1px solid var(--color-border)", background: "#fff", cursor: "pointer",
        color: "var(--color-text-muted)",
      }}
    >
      {icon}
    </button>
  );
}

function ModalShell({
  title, onClose, children, width = 460, hidden = false,
}: { title: string; onClose: () => void; children: React.ReactNode; width?: number; hidden?: boolean }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
        display: hidden ? "none" : "flex", alignItems: "flex-start", justifyContent: "center",
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
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "20px 24px 16px", flexShrink: 0, borderBottom: "1px solid var(--color-border)",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--color-heading)" }}>{title}</h3>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex" }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: "20px 24px 24px", overflowY: "auto" }}>
          {children}
        </div>
      </div>
    </div>
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

function Stepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button onClick={() => onChange(Math.max(0, value - 1))} style={stepperBtn}><Minus size={14} /></button>
      <input
        className="input"
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        style={{ textAlign: "center", flex: 1 }}
      />
      <button onClick={() => onChange(value + 1)} style={stepperBtn}><Plus size={14} /></button>
    </div>
  );
}
const stepperBtn: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 8, border: "1px solid var(--color-border)",
  background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
};

/* ── Adjust Stock modal ── */
function AdjustStockModal({
  item, onClose, onOpenSupplier, hidden,
}: { item: ModalItem; onClose: () => void; onOpenSupplier: () => void; hidden?: boolean }) {
  const [supplier, setSupplier] = useState("");
  const [invoice, setInvoice] = useState("");
  const [qty, setQty] = useState(20);
  const [cost, setCost] = useState(1200);
  const [reason, setReason] = useState("New delivery received from supplier");
  const newStock = item.current + qty;
  const totalCost = qty * cost;

  return (
    <ModalShell title="Adjust Stock" onClose={onClose} hidden={hidden}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: "var(--color-bg-soft)", marginBottom: 20 }}>
        <span style={{ fontWeight: 600, color: "var(--color-text)" }}>{item.name}</span>
        {item.status && <StatusBadge status={item.status} />}
      </div>

      <Field label="Supplier">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select className="input" value={supplier} onChange={(e) => setSupplier(e.target.value)} style={{ flex: 1, minWidth: 160 }}>
            <option value="">Select supplier</option>
            <option value="fresh-farm">Fresh Farm Limited</option>
          </select>
          <button
            onClick={onOpenSupplier}
            style={{
              padding: "0 14px", height: 42, borderRadius: 8, border: "1px solid var(--color-primary)",
              background: "#fff", color: "var(--color-primary)", fontWeight: 600, fontSize: "0.85rem",
              cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
            }}
          >
            Add New Supplier
          </button>
        </div>
      </Field>

      <Field label="Invoice Number">
        <input className="input" placeholder="INV-12345....." value={invoice} onChange={(e) => setInvoice(e.target.value)} />
      </Field>

      <p style={{ margin: "0 0 6px", fontSize: "0.85rem", color: "var(--color-text)" }}>
        Current: <strong>{item.current} {item.unit}</strong>
      </p>
      <div style={{ marginBottom: 16 }}>
        <Stepper value={qty} onChange={setQty} />
      </div>

      <p style={{ margin: "0 0 16px", fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text)" }}>
        New Stock: {newStock} {item.unit}
      </p>

      <Field label="Cost price per unit">
        <input className="input" type="number" value={cost} onChange={(e) => setCost(Number(e.target.value) || 0)} />
      </Field>

      <p style={{ margin: "-6px 0 16px", fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text)" }}>
        Total cost: ₦{totalCost.toLocaleString()}
      </p>

      <Field label="Reason (required)">
        <textarea className="input" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button onClick={onClose} style={cancelBtn}>Cancel</button>
        <button className="btn btn-primary" style={{ padding: "9px 18px", fontSize: "0.85rem" }} onClick={onClose}>Apply Change</button>
      </div>
    </ModalShell>
  );
}

/* ── Transfer Stock modal ── */
function TransferStockModal({ item, onClose }: { item: ModalItem; onClose: () => void }) {
  const [from, setFrom] = useState("Foodies 1 Lekki");
  const [to, setTo] = useState("Maitama");
  const [qty, setQty] = useState(20);
  const [manager, setManager] = useState("");
  const [reason, setReason] = useState("High demand in Maitama, surplus in Foodies 1");
  const needsApproval = qty > 10;

  return (
    <ModalShell title="Transfer Stock" onClose={onClose}>
      <div style={{ padding: "10px 14px", borderRadius: 10, background: "var(--color-bg-soft)", marginBottom: 20, fontWeight: 600, color: "var(--color-text)" }}>
        {item.name}
      </div>

      <p style={{ margin: "0 0 8px", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)" }}>Transfer:</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <Field label="From">
          <select className="input" value={from} onChange={(e) => setFrom(e.target.value)}>
            <option>Foodies 1 Lekki</option>
            <option>Foodies 2 Lekki</option>
            <option>Foodies Maitama</option>
          </select>
        </Field>
        <Field label="To">
          <select className="input" value={to} onChange={(e) => setTo(e.target.value)}>
            <option>Maitama</option>
            <option>Foodies 1 Lekki</option>
            <option>Foodies 2 Lekki</option>
          </select>
        </Field>
      </div>

      <p style={{ margin: "0 0 6px", fontSize: "0.85rem", color: "var(--color-text)" }}>
        Available Stock: <strong>{item.current} {item.unit}</strong>
      </p>
      <p style={{ margin: "0 0 6px", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)" }}>Quantity to transfer</p>
      <div style={{ marginBottom: 12 }}>
        <Stepper value={qty} onChange={setQty} />
      </div>

      {needsApproval && (
        <p style={{ display: "flex", alignItems: "center", gap: 6, margin: "0 0 16px", fontSize: "0.8rem", color: "#a07a00" }}>
          <AlertTriangle size={14} strokeWidth={1.8} />
          Approval Required: Quantity exceeds 10 units - requires second manager
        </p>
      )}

      <Field label="Approving Manager:">
        <select className="input" value={manager} onChange={(e) => setManager(e.target.value)}>
          <option value="">Select Manager</option>
          <option value="michael">Michael E.</option>
        </select>
      </Field>

      <Field label="Reason:">
        <textarea className="input" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>

      <div style={{ padding: 14, borderRadius: 10, background: "rgba(225,11,28,0.05)", border: "1px solid rgba(225,11,28,0.25)", marginBottom: 20 }}>
        <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: "0.85rem", color: "var(--color-text)" }}>Transfer will:</p>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem", color: "var(--color-text)" }}>
          <li>Deduct {qty} from {from}</li>
          <li>Add {qty} to {to}</li>
          <li>Log both transactions</li>
        </ul>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button onClick={onClose} style={cancelBtn}>Cancel</button>
        <button className="btn btn-primary" style={{ padding: "9px 18px", fontSize: "0.85rem" }} onClick={onClose}>Confirm Transfer</button>
      </div>
    </ModalShell>
  );
}

/* ── Remove Stock Wastage modal ── */
const WASTAGE_REASONS = ["Spoiled / Expired", "Damaged during preparation", "Customer return", "Overproduction", "Other (please specify)"];

function RemoveStockModal({ item, onClose }: { item: ModalItem; onClose: () => void }) {
  const [qty, setQty] = useState(3);
  const [cost, setCost] = useState(1200);
  const [reason, setReason] = useState("Other (please specify)");
  const [details, setDetails] = useState("Sauce spilled during transfer");
  const newStock = Math.max(0, item.current - qty);
  const totalCost = qty * cost;

  return (
    <ModalShell title="Remove Stock Wastage - Food Items" onClose={onClose}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: "var(--color-bg-soft)", marginBottom: 20 }}>
        <span style={{ fontWeight: 600, color: "var(--color-text)" }}>{item.name}</span>
        {item.status && <StatusBadge status={item.status} />}
      </div>

      <p style={{ margin: "0 0 6px", fontSize: "0.85rem", color: "var(--color-text)" }}>
        Current stock: <strong>{item.current}</strong>
      </p>

      <Field label="Quantity to remove">
        <input className="input" type="number" value={qty} onChange={(e) => setQty(Number(e.target.value) || 0)} />
      </Field>

      <p style={{ margin: "-6px 0 16px", fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text)" }}>New Stock: {newStock}</p>

      <Field label="Cost price per unit">
        <input className="input" type="number" value={cost} onChange={(e) => setCost(Number(e.target.value) || 0)} />
      </Field>

      <p style={{ margin: "-6px 0 16px", fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text)" }}>
        Total cost: ₦{totalCost.toLocaleString()}
      </p>

      <Field label="Wastage Reason">
        <select className="input" value={reason} onChange={(e) => setReason(e.target.value)}>
          {WASTAGE_REASONS.map((r) => <option key={r}>{r}</option>)}
        </select>
      </Field>

      {reason.startsWith("Other") && (
        <Field label="Other details (please specify)">
          <input className="input" value={details} onChange={(e) => setDetails(e.target.value)} />
        </Field>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button onClick={onClose} style={cancelBtn}>Cancel</button>
        <button className="btn btn-primary" style={{ padding: "9px 18px", fontSize: "0.85rem" }} onClick={onClose}>Remove</button>
      </div>
    </ModalShell>
  );
}

/* ── Add New Supplier modal ── */
function AddSupplierModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("Fresh farm limited");
  const [contact, setContact] = useState("+234 813 6666 888");
  const [address, setAddress] = useState("Zone 9. Ajagbe Estate, Ogun State");

  return (
    <ModalShell title="Add New Supplier" onClose={onClose} width={420}>
      <Field label="Name">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Contact">
        <input className="input" value={contact} onChange={(e) => setContact(e.target.value)} />
      </Field>
      <Field label="Address">
        <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
      </Field>
      <button className="btn btn-primary" style={{ width: "100%", padding: "10px 0", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
        Add
      </button>
    </ModalShell>
  );
}

/* ── Threshold Configuration view ── */
function ThresholdView({ onBack }: { onBack: () => void }) {
  const [rows, setRows] = useState(THRESHOLD_ROWS);
  const [defaultThreshold, setDefaultThreshold] = useState(10);
  const [search, setSearch] = useState("");

  const updateRow = (i: number, patch: Partial<ThresholdRow>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const filtered = rows.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 600, color: "var(--color-heading)" }}>
        Low Stock Thresholds
      </h2>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <ActionButton icon={<Plus size={16} strokeWidth={2} />} label="Adjust Stock" onClick={onBack} />
        <ActionButton icon={<ArrowLeftRight size={16} strokeWidth={1.8} />} label="Transfer" onClick={onBack} />
        <ActionButton icon={<PackageMinus size={16} strokeWidth={1.8} />} label="Remove Stock" onClick={onBack} />
        <button
          className="btn btn-primary"
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", fontSize: "0.85rem" }}
        >
          <SlidersHorizontal size={16} strokeWidth={1.8} />
          Threshold Configuration
        </button>
      </div>

      <Field label="Default threshold for all food items">
        <input
          className="input"
          value={`${defaultThreshold} units`}
          onChange={(e) => setDefaultThreshold(Number(e.target.value.replace(/\D/g, "")) || 0)}
          style={{ maxWidth: 260 }}
        />
      </Field>

      <div style={{ position: "relative" }}>
        <Search size={16} strokeWidth={1.8} color="var(--color-text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
        <input
          className="input"
          placeholder="Search Item specific thresholds..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", paddingLeft: 38 }}
        />
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "18px 20px 4px" }}>
          <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.04em", color: "var(--color-text-muted)" }}>
            ITEM SPECIFIC THRESHOLDS
          </p>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {["Item", "Threshold", "Notify?", "Auto-reorder"].map((c) => <th key={c}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr key={row.name}>
                  <td>
                    <p style={{ margin: 0, fontWeight: 600, color: "var(--color-text)" }}>{row.name}</p>
                    <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-text-muted)" }}>{row.unit}</p>
                  </td>
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
                  <td>
                    <Radio checked={row.autoReorder} onClick={() => updateRow(i, { autoReorder: !row.autoReorder })} label="Yes" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
        Auto-Reorder: When stock reaches threshold, system can auto-generate purchase order for manager approval.
      </p>

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

const cancelBtn: React.CSSProperties = {
  padding: "9px 18px", borderRadius: 8, border: "1px solid var(--color-border)", background: "#fff",
  cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)", fontFamily: "var(--font-sans)",
};