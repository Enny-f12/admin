"use client";

import { useState } from "react";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Search,
  ChevronDown,
  Upload,
  Download,
  DollarSign,
  Plus,
  Minus,
  ArrowLeftRight,
  Bell,
  Check,
  ChefHat,
  GlassWater,
  X,
  Calendar,
} from "lucide-react";

type Status = "In Stock" | "Low Stock" | "Out of Stock";

type FoodItem = {
  name: string;
  category: string;
  unit: string;
  pack: number;
  stock: number;
  threshold: number;
  status: Status;
};

type DrinkItem = {
  name: string;
  unit: string;
  pack: number; // fridge quantity
  stock: number; // warehouse quantity
  threshold: number;
  status: Status;
};

const FOOD_CATEGORIES = ["All Categories", "Pastry", "Swallow", "Soup", "Protein", "Intercontinental", "Africana", "Salad", "Catering"];
const STATUS_OPTIONS: (Status | "All Status")[] = ["All Status", "In Stock", "Low Stock", "Out of Stock"];

const FOOD_ITEMS: FoodItem[] = [
  { name: "Puff puff",      category: "Pastry",          unit: "Piece",   pack: 4, stock: 0,  threshold: 4,  status: "Out of Stock" },
  { name: "Chicken pie",    category: "Pastry",          unit: "Piece",   pack: 1, stock: 0,  threshold: 5,  status: "Out of Stock" },
  { name: "Meat pie",       category: "Pastry",          unit: "Piece",   pack: 1, stock: 0,  threshold: 2,  status: "Out of Stock" },
  { name: "Milk doughnut",  category: "Pastry",          unit: "Piece",   pack: 1, stock: 0,  threshold: 5,  status: "Out of Stock" },
  { name: "Sugar doughnut", category: "Pastry",          unit: "Piece",   pack: 1, stock: 0,  threshold: 4,  status: "Out of Stock" },
  { name: "Semo",           category: "Swallow",         unit: "Wrap",    pack: 1, stock: 5,  threshold: 10, status: "Low Stock"    },
  { name: "Pounded yam",    category: "Swallow",         unit: "Wrap",    pack: 1, stock: 3,  threshold: 5,  status: "Low Stock"    },
  { name: "Eba",            category: "Swallow",         unit: "Wrap",    pack: 1, stock: 2,  threshold: 7,  status: "Low Stock"    },
  { name: "Poundo yam",     category: "Swallow",         unit: "Wrap",    pack: 1, stock: 1,  threshold: 4,  status: "Low Stock"    },
  { name: "Fufu",           category: "Swallow",         unit: "Wrap",    pack: 1, stock: 4,  threshold: 6,  status: "Low Stock"    },
  { name: "Starch",         category: "Swallow",         unit: "Wrap",    pack: 1, stock: 2,  threshold: 5,  status: "Low Stock"    },
  { name: "Egusi soup",     category: "Soup",            unit: "Bowl",    pack: 1, stock: 12, threshold: 10, status: "Low Stock"    },
  { name: "Grilled chicken", category: "Protein",        unit: "Piece",   pack: 1, stock: 0,  threshold: 5,  status: "Out of Stock" },
  { name: "Jollof Rice",    category: "Intercontinental", unit: "Serving", pack: 1, stock: 55, threshold: 10, status: "In Stock"    },
];

const DRINK_ITEMS: DrinkItem[] = [
  { name: "Can Coke",       unit: "Can",    pack: 45, stock: 100, threshold: 145, status: "In Stock"     },
  { name: "Plastic Coke",   unit: "Bottle", pack: 20, stock: 50,  threshold: 70,  status: "In Stock"     },
  { name: "Can Fanta",      unit: "Can",    pack: 3,  stock: 20,  threshold: 23,  status: "Low Stock"    },
  { name: "Can Sprite",     unit: "Can",    pack: 0,  stock: 15,  threshold: 15,  status: "Low Stock"    },
  { name: "Can Monster",    unit: "Can",    pack: 0,  stock: 0,   threshold: 0,   status: "Out of Stock" },
  { name: "Aquafina Water", unit: "Bottle", pack: 25, stock: 100, threshold: 125, status: "In Stock"     },
];

const PAGE_SIZE = 6;

const STATUS_CLASS: Record<Status, string> = {
  "In Stock":  "badge badge-green",
  "Low Stock": "badge badge-yellow",
  "Out of Stock": "badge badge-red",
};

const StatusBadge = ({ status }: { status: Status }) => (
  <span className={STATUS_CLASS[status]} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
    {status === "In Stock" && <TrendingUp size={12} strokeWidth={2} />}
    {status === "Low Stock" && <TrendingDown size={12} strokeWidth={2} />}
    {status === "Out of Stock" && <AlertTriangle size={12} strokeWidth={2} />}
    {status}
  </span>
);

export default function InventoryDashboardPage() {
  const [tab, setTab] = useState<"food" | "drinks">("food");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [status, setStatus] = useState<Status | "All Status">("All Status");
  const [page, setPage] = useState(1);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [fridgeAlertOpen, setFridgeAlertOpen] = useState(true);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);

  const switchTab = (t: "food" | "drinks") => {
    setTab(t);
    setPage(1);
    setSearch("");
    setStatus("All Status");
    setCategory("All Categories");
    if (t === "drinks") setFridgeAlertOpen(true);
  };

  const filteredFood = FOOD_ITEMS.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) &&
      (category === "All Categories" || i.category === category) &&
      (status === "All Status" || i.status === status)
  );
  const filteredDrinks = DRINK_ITEMS.filter(
    (i) => i.name.toLowerCase().includes(search.toLowerCase()) && (status === "All Status" || i.status === status)
  );

  const rows = tab === "food" ? filteredFood : filteredDrinks;
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pagedRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // stat card figures — mock's own headline numbers (kept independent of the sample rows above)
  const stats =
    tab === "food"
      ? { total: 25, low: 4, out: 3, value: "₦450,000" }
      : { total: 18, low: 2, out: 1, value: "₦125,000" };

  const inStockRows = rows.filter((r) => r.status === "In Stock");
  const lowStockRows = rows.filter((r) => r.status === "Low Stock");
  const outOfStockRows = rows.filter((r) => r.status === "Out of Stock");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, position: "relative" }}>
      <div>
        <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "var(--color-primary)" }}>Foodies 1 LEKKI</p>
        <h1 style={{ margin: "6px 0 0", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-heading)" }}>Inventory</h1>
        <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Food &amp; Drinks inventory</p>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <TabButton active={tab === "food"} onClick={() => switchTab("food")} icon={<ChefHat size={16} strokeWidth={1.8} />} label="Food Inventory" />
        <TabButton active={tab === "drinks"} onClick={() => switchTab("drinks")} icon={<GlassWater size={16} strokeWidth={1.8} />} label="Drinks Inventory" />
      </div>

      <div className="card">
        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text)" }}>
          <strong>Last Updated:</strong> Today, 8:35 AM by Sarah Johnson (Counter)
        </p>
        <p style={{ margin: "6px 0 0", fontSize: "0.85rem", color: "var(--color-text)" }}>
          <strong>Next morning count due:</strong> Tomorrow, 8:00 AM
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <div className="card" style={{ textAlign: "center" }}>
          {tab === "food"
            ? <ChefHat size={20} strokeWidth={1.8} color="#E10B1C" style={{ margin: "0 auto" }} />
            : <GlassWater size={20} strokeWidth={1.8} color="#E10B1C" style={{ margin: "0 auto" }} />}
          <p style={{ margin: "6px 0 0", fontSize: "1.5rem", fontWeight: 700, color: "var(--color-heading)" }}>{stats.total}</p>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Total Items</p>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <AlertTriangle size={20} strokeWidth={1.8} color="#a07a00" style={{ margin: "0 auto" }} />
          <p style={{ margin: "6px 0 0", fontSize: "1.5rem", fontWeight: 700, color: "#a07a00" }}>{stats.low}</p>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Low Stock</p>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <AlertTriangle size={20} strokeWidth={1.8} color="#E10B1C" style={{ margin: "0 auto" }} />
          <p style={{ margin: "6px 0 0", fontSize: "1.5rem", fontWeight: 700, color: "#E10B1C" }}>{stats.out}</p>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Out of Stock</p>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <DollarSign size={20} strokeWidth={1.8} color="var(--color-heading)" style={{ margin: "0 auto" }} />
          <p style={{ margin: "6px 0 0", fontSize: "1.5rem", fontWeight: 700, color: "var(--color-heading)" }}>{stats.value}</p>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Total Value</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <OutlineButton icon={<Upload size={15} strokeWidth={1.8} />} label="Export to CSV" />
        <OutlineButton icon={<Download size={15} strokeWidth={1.8} />} label="Print" />
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", padding: 20 }}>
          <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
            <Search size={16} strokeWidth={1.8} color="var(--color-text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
            <input
              className="input"
              placeholder="Search item..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ width: "100%", paddingLeft: 38 }}
            />
          </div>

          {tab === "food" && (
            <Dropdown
              value={category}
              options={FOOD_CATEGORIES}
              open={categoryOpen}
              setOpen={setCategoryOpen}
              onChange={(v) => { setCategory(v); setPage(1); }}
            />
          )}

          <Dropdown
            value={status}
            options={STATUS_OPTIONS}
            open={statusOpen}
            setOpen={setStatusOpen}
            onChange={(v) => { setStatus(v as Status | "All Status"); setPage(1); }}
            withStatusIcons
          />
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {["Item", "Unit", "Pack", "Stock", "Threshold", "Status"].map((c) => <th key={c}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((item) => (
                <tr key={item.name}>
                  <td style={{ fontWeight: 600, color: "var(--color-text)" }}>{item.name}</td>
                  <td>{item.unit}</td>
                  <td>{item.pack}</td>
                  <td>{item.stock}</td>
                  <td>{item.threshold}</td>
                  <td><StatusBadge status={item.status} /></td>
                </tr>
              ))}
              {pagedRows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "24px 0", color: "var(--color-text-muted)" }}>
                    No items match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 14, padding: "14px 20px", fontSize: "0.85rem" }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-primary)", fontWeight: 600 }}
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                width: 28, height: 28, borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600,
                background: p === page ? "var(--color-secondary)" : "transparent",
                color: p === page ? "#7a5500" : "var(--color-text)",
              }}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-primary)", fontWeight: 600 }}
          >
            Next
          </button>
        </div>
      </div>

      {tab === "food" ? (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {inStockRows.length > 0 && (
            <p style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: "0.85rem", color: "var(--color-text)" }}>
              <TrendingUp size={14} strokeWidth={2} color="#16A34A" />
              <strong>In Stock:</strong> {inStockRows.length} items well stocked
            </p>
          )}
          {lowStockRows.length > 0 && (
            <p style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: "0.85rem", color: "var(--color-text)" }}>
              <AlertTriangle size={14} strokeWidth={1.8} color="#a07a00" />
              <strong>Low Stock Alert:</strong> {lowStockRows.length} items below threshold
            </p>
          )}
          {outOfStockRows.length > 0 && (
            <p style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: "0.85rem", color: "var(--color-text)" }}>
              <AlertTriangle size={14} strokeWidth={1.8} color="#E10B1C" />
              <strong>Out of Stock:</strong> {outOfStockRows.length} items - customers cannot order
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {lowStockRows.length > 0 && (
              <p style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: "0.85rem", color: "var(--color-text)" }}>
                <AlertTriangle size={14} strokeWidth={1.8} color="#a07a00" />
                <strong>Low Fridge Alert:</strong>{" "}
                {lowStockRows.map((r, i) => `${r.name} (${r.pack} left)`).join(", ")}
              </p>
            )}
            {outOfStockRows.length > 0 && (
              <p style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: "0.85rem", color: "var(--color-text)" }}>
                <AlertTriangle size={14} strokeWidth={1.8} color="#E10B1C" />
                <strong>Out of Stock:</strong> {outOfStockRows.map((r) => r.name).join(", ")} - order from supplier
              </p>
            )}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <OutlineButton icon={<Plus size={15} strokeWidth={1.8} />} label="Receive Delivery" onClick={() => setReceiveOpen(true)} />
            <OutlineButton icon={<ArrowLeftRight size={15} strokeWidth={1.8} />} label="Transfer to Fridge" onClick={() => setTransferOpen(true)} />
            <OutlineButton icon={<Plus size={15} strokeWidth={1.8} />} label="Adjust Stock" onClick={() => setAdjustOpen(true)} />
          </div>
        </>
      )}

      {receiveOpen && <ReceiveDeliveryModal onClose={() => setReceiveOpen(false)} />}
      {transferOpen && <TransferModal onClose={() => setTransferOpen(false)} />}
      {adjustOpen && <AdjustStockModal onClose={() => setAdjustOpen(false)} />}

      {tab === "drinks" && fridgeAlertOpen && (
        <LowFridgeAlertModal
          lowStockItems={DRINK_ITEMS.filter((i) => i.status === "Low Stock")}
          outOfStockItems={DRINK_ITEMS.filter((i) => i.status === "Out of Stock")}
          onDismiss={() => setFridgeAlertOpen(false)}
        />
      )}
    </div>
  );
}

/* ── Building blocks ── */
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

function OutlineButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
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

function Dropdown({
  value, options, open, setOpen, onChange, withStatusIcons,
}: {
  value: string; options: string[]; open: boolean; setOpen: (v: boolean) => void; onChange: (v: string) => void; withStatusIcons?: boolean;
}) {
  const iconFor = (opt: string) => {
    if (!withStatusIcons) return null;
    if (opt === "In Stock") return <TrendingUp size={13} strokeWidth={2} color="#16A34A" />;
    if (opt === "Low Stock") return <TrendingDown size={13} strokeWidth={2} color="#a07a00" />;
    if (opt === "Out of Stock") return <AlertTriangle size={13} strokeWidth={1.8} color="#E10B1C" />;
    return null;
  };

  return (
    <div style={{ position: "relative", minWidth: 170 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, width: "100%",
          padding: "10px 14px", borderRadius: 8, border: "1px solid var(--color-border)", background: "#fff",
          cursor: "pointer", fontSize: "0.85rem", color: "var(--color-text)", fontFamily: "var(--font-sans)",
        }}
      >
        {value}
        <ChevronDown size={15} strokeWidth={1.8} color="var(--color-text-muted)" />
      </button>
      {open && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, minWidth: 190,
            background: "#fff", border: "1px solid var(--color-border)", borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.10)", overflow: "hidden", zIndex: 60,
          }}
        >
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
                padding: "10px 14px", background: opt === value ? "var(--color-bg-soft)" : "#fff",
                border: "none", cursor: "pointer", fontSize: "0.85rem", fontFamily: "var(--font-sans)",
                color: "var(--color-text)", textAlign: "left",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {opt === value && <Check size={13} strokeWidth={2} />}
                {opt}
              </span>
              {iconFor(opt)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Shared modal shell (scrollable, capped height) ── */
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
          width, maxWidth: "92vw", maxHeight: "88vh", background: "#fff", borderRadius: 14,
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
      <input className="input" type="number" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} style={{ textAlign: "center", flex: 1 }} />
      <button onClick={() => onChange(value + 1)} style={stepperBtn}><Plus size={14} /></button>
    </div>
  );
}
const stepperBtn: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 8, border: "1px solid var(--color-border)",
  background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
};
const outlineBtn: React.CSSProperties = {
  padding: "9px 18px", borderRadius: 8, border: "1px solid var(--color-border)", background: "#fff",
  cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)", fontFamily: "var(--font-sans)",
};

/* ── Receive Delivery modal ── */
type ReceivedRow = { name: string; qty: number; costPerUnit: number };
const DEFAULT_RECEIVED: ReceivedRow[] = [
  { name: "Can Coke", qty: 50, costPerUnit: 500 },
  { name: "Can Fanta", qty: 50, costPerUnit: 500 },
];

function ReceiveDeliveryModal({ onClose }: { onClose: () => void }) {
  const [supplier, setSupplier] = useState("Beverage Distributor Limited");
  const [deliveryDate, setDeliveryDate] = useState("May 15, 2025");
  const [invoice, setInvoice] = useState("INV-5678.......");
  const [items, setItems] = useState<ReceivedRow[]>(DEFAULT_RECEIVED);

  const totalCost = items.reduce((sum, i) => sum + i.qty * i.costPerUnit, 0);

  const addItem = () => setItems((prev) => [...prev, { name: "New item", qty: 1, costPerUnit: 0 }]);
  const updateItem = (i: number, patch: Partial<ReceivedRow>) =>
    setItems((prev) => prev.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  return (
    <ModalShell title="Receive Delivery" onClose={onClose} width={620}>
      <Field label="Supplier">
        <select className="input" value={supplier} onChange={(e) => setSupplier(e.target.value)}>
          <option>Beverage Distributor Limited</option>
          <option>Fresh Farm Limited</option>
        </select>
      </Field>
      <Field label="Delivery Date">
        <div style={{ position: "relative" }}>
          <Calendar size={16} strokeWidth={1.8} color="var(--color-primary)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
          <input className="input" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} style={{ paddingLeft: 38 }} />
        </div>
      </Field>
      <Field label="Invoice Number">
        <input className="input" value={invoice} onChange={(e) => setInvoice(e.target.value)} />
      </Field>

      <p style={{ margin: "0 0 10px", fontSize: "0.85rem", fontWeight: 700, color: "var(--color-heading)" }}>
        ITEMS RECEIVED (adds to Warehouse)
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
        {items.map((row, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1.4fr 0.8fr 0.9fr auto", gap: 8, alignItems: "center" }}>
            <input className="input" value={row.name} onChange={(e) => updateItem(i, { name: e.target.value })} />
            <input className="input" type="number" value={row.qty} onChange={(e) => updateItem(i, { qty: Number(e.target.value) || 0 })} placeholder="Qty" />
            <input className="input" type="number" value={row.costPerUnit} onChange={(e) => updateItem(i, { costPerUnit: Number(e.target.value) || 0 })} placeholder="Cost/unit" />
            <span style={{ fontWeight: 600, fontSize: "0.85rem", whiteSpace: "nowrap" }}>₦{(row.qty * row.costPerUnit).toLocaleString()}</span>
          </div>
        ))}
      </div>
      <button
        onClick={addItem}
        style={{
          display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8,
          border: "1px solid rgba(225,11,28,0.3)", background: "rgba(225,11,28,0.05)",
          color: "var(--color-primary)", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer",
          fontFamily: "var(--font-sans)", marginBottom: 16,
        }}
      >
        <Plus size={15} strokeWidth={2} />
        Add Item
      </button>

      <p style={{ margin: "0 0 16px", fontSize: "1rem", fontWeight: 700, color: "var(--color-heading)" }}>
        Total Cost: ₦{totalCost.toLocaleString()}
      </p>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button onClick={onClose} style={outlineBtn}>Save Draft</button>
        <button className="btn btn-primary" style={{ padding: "9px 18px", fontSize: "0.85rem" }} onClick={onClose}>
          Confirm Receipt
        </button>
      </div>
    </ModalShell>
  );
}

/* ── Transfer to Fridge modal ── */
function TransferModal({ onClose }: { onClose: () => void }) {
  const [itemName, setItemName] = useState(DRINK_ITEMS[2].name); // Can Fanta by default
  const item = DRINK_ITEMS.find((i) => i.name === itemName) ?? DRINK_ITEMS[0];
  const [qty, setQty] = useState(7);
  const [reason, setReason] = useState("Restock fridge for lunch rush");

  const newFridgeStock = item.pack + qty;
  const newWarehouseStock = item.stock - qty;
  const belowThreshold = item.pack < item.threshold;

  return (
    <ModalShell title="Transfer to Fridge" onClose={onClose}>
      <Field label="Item">
        <select className="input" value={itemName} onChange={(e) => setItemName(e.target.value)}>
          {DRINK_ITEMS.map((i) => <option key={i.name}>{i.name}</option>)}
        </select>
      </Field>
      <Field label="Current Fridge Stock (packs)">
        <input className="input" value={item.pack} readOnly />
      </Field>
      <Field label="Current Warehouse Stock (packs)">
        <input className="input" value={item.stock} readOnly />
      </Field>
      <Field label="Fridge Threshold">
        <input className="input" value={`${item.threshold} units`} readOnly />
      </Field>

      {belowThreshold && (
        <p style={{ display: "flex", alignItems: "center", gap: 6, margin: "-6px 0 14px", fontSize: "0.85rem", color: "#a07a00" }}>
          <AlertTriangle size={14} strokeWidth={1.8} />
          Fridge is below threshold. Restocking recommended.
        </p>
      )}

      <Field label="Qty to Transfer (packs)">
        <Stepper value={qty} onChange={setQty} />
      </Field>
      <Field label="New Fridge Stock (packs)">
        <input className="input" value={newFridgeStock} readOnly />
      </Field>
      <Field label="New Warehouse Stock (packs)">
        <input className="input" value={newWarehouseStock} readOnly />
      </Field>
      <Field label="Reason">
        <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button onClick={onClose} style={outlineBtn}>Cancel</button>
        <button className="btn btn-primary" style={{ padding: "9px 18px", fontSize: "0.85rem" }} onClick={onClose}>
          Transfer to Fridge
        </button>
      </div>
    </ModalShell>
  );
}

/* ── Adjust Stock modal ── */
function AdjustStockModal({ onClose }: { onClose: () => void }) {
  const [itemName, setItemName] = useState(DRINK_ITEMS[0].name);
  const item = DRINK_ITEMS.find((i) => i.name === itemName) ?? DRINK_ITEMS[0];
  const [qty, setQty] = useState(20);
  const [cost, setCost] = useState(500);
  const [reason, setReason] = useState("New delivery received from supplier");

  const newStock = item.stock + qty;
  const totalCost = qty * cost;

  return (
    <ModalShell title="Adjust Stock" onClose={onClose}>
      <Field label="Item">
        <select className="input" value={itemName} onChange={(e) => setItemName(e.target.value)}>
          {DRINK_ITEMS.map((i) => <option key={i.name}>{i.name}</option>)}
        </select>
      </Field>

      <p style={{ margin: "0 0 6px", fontSize: "0.85rem", color: "var(--color-text)" }}>
        Current: <strong>{item.stock} {item.unit}</strong>
      </p>
      <Field label="Qty to Adjust">
        <Stepper value={qty} onChange={setQty} />
      </Field>

      <p style={{ margin: "0 0 16px", fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text)" }}>
        New Stock: {newStock} {item.unit}
      </p>

      <Field label="Cost per unit">
        <input className="input" type="number" value={cost} onChange={(e) => setCost(Number(e.target.value) || 0)} />
      </Field>
      <p style={{ margin: "-6px 0 16px", fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text)" }}>
        Total cost: ₦{totalCost.toLocaleString()}
      </p>

      <Field label="Reason">
        <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button onClick={onClose} style={outlineBtn}>Cancel</button>
        <button className="btn btn-primary" style={{ padding: "9px 18px", fontSize: "0.85rem" }} onClick={onClose}>
          Apply Change
        </button>
      </div>
    </ModalShell>
  );
}
function LowFridgeAlertModal({
  lowStockItems, outOfStockItems, onDismiss,
}: { lowStockItems: DrinkItem[]; outOfStockItems: DrinkItem[]; onDismiss: () => void }) {
  return (
    <div
      onClick={onDismiss}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: 520, maxWidth: "92vw", background: "var(--color-primary)", borderRadius: 14, padding: 28, color: "#fff", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
      >
        <p style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 18px", fontSize: "1.1rem", fontWeight: 700 }}>
          <Bell size={18} strokeWidth={2} />
          LOW FRIDGE ALERT
        </p>

        {lowStockItems.length > 0 && (
          <>
            <p style={{ margin: "0 0 8px", fontSize: "0.9rem" }}>
              The following are drinks low in fridge but available in warehouse:
            </p>
            <ul style={{ margin: "0 0 16px", paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
              {lowStockItems.map((i) => (
                <li key={i.name} style={{ fontSize: "0.9rem" }}>
                  {i.name} ({i.pack} in fridge, {i.stock} in warehouse){" "}
                  <a href="#" style={{ color: "#fff", textDecoration: "underline", fontStyle: "italic" }} onClick={(e) => e.preventDefault()}>
                    Transfer to Fridge
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}

        {outOfStockItems.length > 0 && (
          <>
            <p style={{ margin: "0 0 8px", fontSize: "0.9rem" }}>
              The following are drinks OUT in both fridge and warehouse:
            </p>
            <ul style={{ margin: "0 0 20px", paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
              {outOfStockItems.map((i) => (
                <li key={i.name} style={{ fontSize: "0.9rem" }}>
                  {i.name} ({i.pack} fridge, {i.stock} warehouse){" "}
                  <a href="#" style={{ color: "#fff", textDecoration: "underline", fontStyle: "italic" }} onClick={(e) => e.preventDefault()}>
                    Order from Supplier
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}

        <button
          onClick={onDismiss}
          style={{
            padding: "9px 20px", borderRadius: 8, border: "1px solid #fff", background: "transparent",
            color: "#fff", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", fontFamily: "var(--font-sans)",
          }}
        >
          Dismiss All
        </button>
      </div>
    </div>
  );
}