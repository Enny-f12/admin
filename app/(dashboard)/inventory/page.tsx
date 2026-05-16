"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Package,
  TriangleAlert,
  Plus,
  ArrowLeftRight,
  FileText,
  Search,
  ChevronDown,
  X,
  Check,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

/* ══════════════════════════════════════════
   TYPES
══════════════════════════════════════════ */
type StockStatus = "In Stock" | "Low Stock" | "Critical";

type InventoryItem = {
  id: number;
  name: string;
  category: string;
  unit: string;
  lekki1: number;
  lekki2: number;
  maitama: number;
};

type AdjustTarget = { item: InventoryItem; branch: Branch } | null;
type TransferTarget = { item: InventoryItem } | null;

type Branch = "Lekki 1" | "Lekki 2" | "Maitama";

const BRANCHES: Branch[] = ["Lekki 1", "Lekki 2", "Maitama"];
const BRANCH_FILTER_OPTIONS = ["All Branches", ...BRANCHES] as const;
const ADJUST_REASONS = ["Restock", "Damage", "Audit Correction", "Other"] as const;

const LOW_STOCK_THRESHOLD  = 20;
const CRITICAL_THRESHOLD   = 5;

/* ══════════════════════════════════════════
   SEED DATA
══════════════════════════════════════════ */
const SEED_ITEMS: InventoryItem[] = [
  { id: 1, name: "Egusi",           category: "Soup",            unit: "kg",    lekki1: 45,  lekki2: 30,  maitama: 55  },
  { id: 2, name: "Jollof Rice",     category: "Intercontinental", unit: "kg",   lekki1: 8,   lekki2: 10,  maitama: 15  },
  { id: 3, name: "Fried Rice",      category: "Intercontinental", unit: "kg",   lekki1: 120, lekki2: 150, maitama: 100 },
  { id: 4, name: "Grilled Turkey",  category: "Protein",         unit: "kg",    lekki1: 0,   lekki2: 0,   maitama: 0   },
  { id: 5, name: "Pounded Yam",     category: "Swallow",         unit: "kg",    lekki1: 100, lekki2: 80,  maitama: 100 },
  { id: 6, name: "Can Cocacola (50cl)", category: "Drinks",      unit: "packs", lekki1: 5,   lekki2: 8,   maitama: 13  },
  { id: 7, name: "Afang Soup",      category: "Soup",            unit: "kg",    lekki1: 30,  lekki2: 25,  maitama: 40  },
  { id: 8, name: "Starch",          category: "Swallow",         unit: "kg",    lekki1: 60,  lekki2: 50,  maitama: 70  },
];

/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */
function branchQty(item: InventoryItem, branch: Branch) {
  return branch === "Lekki 1" ? item.lekki1
       : branch === "Lekki 2" ? item.lekki2
       : item.maitama;
}

function totalQty(item: InventoryItem) {
  return item.lekki1 + item.lekki2 + item.maitama;
}

function getStatus(item: InventoryItem, branch: Branch | "All Branches"): StockStatus {
  const qty = branch === "All Branches" ? totalQty(item) : branchQty(item, branch as Branch);
  if (qty <= CRITICAL_THRESHOLD)  return "Critical";
  if (qty <= LOW_STOCK_THRESHOLD) return "Low Stock";
  return "In Stock";
}

const STATUS_STYLE: Record<StockStatus, { bg: string; color: string }> = {
  "In Stock":  { bg: "rgba(34,197,94,0.12)",  color: "#16a34a" },
  "Low Stock": { bg: "rgba(245,158,11,0.12)", color: "#b45309" },
  "Critical":  { bg: "rgba(239,68,68,0.10)",  color: "#dc2626" },
};

/* ── small reusable dropdown ── */
function Dropdown<T extends string>({
  options, value, onChange, minWidth = 140,
}: { options: readonly T[]; value: T; onChange: (v: T) => void; minWidth?: number | string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative", minWidth }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "9px 12px", border: "1px solid var(--color-border)", borderRadius: 8,
          background: "var(--color-bg-input)", fontSize: "0.855rem", color: "var(--color-text)",
          cursor: "pointer", fontFamily: "var(--font-sans)", gap: 8,
        }}
      >
        <span>{value}</span>
        <ChevronDown size={14} strokeWidth={1.8} color="var(--color-text-muted)" />
      </button>
      {open && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 4px)", left: 0, right: 0, zIndex: 200,
          background: "var(--color-bg-card)", border: "1px solid var(--color-border)",
          borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", overflow: "hidden",
        }}>
          {options.map((o) => (
            <button key={o} onClick={() => { onChange(o); setOpen(false); }}
              style={{
                width: "100%", textAlign: "left", padding: "9px 14px", border: "none",
                background: o === value ? "var(--color-bg-soft)" : "transparent",
                color: o === value ? "var(--color-primary)" : "var(--color-text)",
                fontFamily: "var(--font-sans)", fontSize: "0.85rem",
                fontWeight: o === value ? 500 : 400, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}
              onMouseEnter={(e) => { if (o !== value) (e.currentTarget as HTMLButtonElement).style.background = "var(--color-bg-soft)"; }}
              onMouseLeave={(e) => { if (o !== value) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              {o}
              {o === value && <Check size={13} strokeWidth={2.2} color="var(--color-primary)" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── qty stepper ── */
function Stepper({ value, onChange, min = 0 }: { value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--color-border)", borderRadius: 8, overflow: "hidden" }}>
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        style={{ width: 36, height: 38, border: "none", background: "var(--color-bg-soft)", cursor: "pointer", fontSize: "1.1rem", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}
      >−</button>
      <span style={{ flex: 1, textAlign: "center", fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text)", minWidth: 60 }}>{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        style={{ width: 36, height: 38, border: "none", background: "var(--color-bg-soft)", cursor: "pointer", fontSize: "1.1rem", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}
      >+</button>
    </div>
  );
}

/* ── modal shell ── */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: "var(--color-bg-card)", borderRadius: 16, width: "100%", maxWidth: 480, padding: 28, display: "flex", flexDirection: "column", gap: 18, maxHeight: "90vh", overflowY: "auto" }} className="no-scrollbar">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "var(--color-heading)" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", padding: 4 }}>
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
export default function InventoryPage() {
  const [items, setItems]             = useState<InventoryItem[]>(SEED_ITEMS);
  const [branchFilter, setBranchFilter] = useState<typeof BRANCH_FILTER_OPTIONS[number]>("All Branches");
  const [search, setSearch]           = useState("");

  /* modals */
  const [adjustTarget, setAdjustTarget]     = useState<AdjustTarget>(null);
  const [transferTarget, setTransferTarget] = useState<TransferTarget>(null);

  /* adjust form state */
  const [adjustBranch, setAdjustBranch] = useState<Branch>("Lekki 1");
  const [adjustQty, setAdjustQty]       = useState(0);
  const [adjustReason, setAdjustReason] = useState<typeof ADJUST_REASONS[number]>("Restock");

  /* transfer form state */
  const [transferFrom, setTransferFrom] = useState<Branch>("Lekki 1");
  const [transferTo, setTransferTo]     = useState<Branch>("Maitama");
  const [transferQty, setTransferQty]   = useState(0);

  /* ── derived stats ── */
  const totalItems  = items.length;
  const lowStockCnt = items.filter((i) => getStatus(i, "All Branches") === "Low Stock").length;
  const criticalCnt = items.filter((i) => getStatus(i, "All Branches") === "Critical").length;
  const criticalItems = items.filter((i) => getStatus(i, "All Branches") === "Critical" || getStatus(i, "All Branches") === "Low Stock");

  /* ── filtered rows ── */
  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  /* ── open adjust ── */
  const openAdjust = (item: InventoryItem) => {
    setAdjustTarget({ item, branch: "Lekki 1" });
    setAdjustBranch("Lekki 1");
    setAdjustQty(0);
    setAdjustReason("Restock");
  };

  /* ── open transfer ── */
  const openTransfer = (item: InventoryItem) => {
    setTransferTarget({ item });
    setTransferFrom("Lekki 1");
    setTransferTo("Maitama");
    setTransferQty(0);
  };

  /* ── submit adjust ── */
  const handleAdjust = () => {
    if (!adjustTarget) return;
    const { item } = adjustTarget;
    setItems((prev) => prev.map((i) => {
      if (i.id !== item.id) return i;
      const delta = adjustReason === "Damage" ? -adjustQty : adjustQty;
      return {
        ...i,
        lekki1:   adjustBranch === "Lekki 1"  ? Math.max(0, i.lekki1   + delta) : i.lekki1,
        lekki2:   adjustBranch === "Lekki 2"  ? Math.max(0, i.lekki2   + delta) : i.lekki2,
        maitama:  adjustBranch === "Maitama"  ? Math.max(0, i.maitama  + delta) : i.maitama,
      };
    }));
    toast.success(`${item.name} stock adjusted`, { description: `${adjustReason} · ${adjustBranch}` });
    setAdjustTarget(null);
  };

  /* ── submit transfer ── */
  const handleTransfer = () => {
    if (!transferTarget) return;
    const { item } = transferTarget;
    const available = branchQty(item, transferFrom);
    if (transferQty > available) {
      toast.error("Insufficient stock", { description: `Only ${available} ${item.unit} available in ${transferFrom}` });
      return;
    }
    setItems((prev) => prev.map((i) => {
      if (i.id !== item.id) return i;
      const update = { ...i };
      if (transferFrom === "Lekki 1")  update.lekki1   = i.lekki1   - transferQty;
      if (transferFrom === "Lekki 2")  update.lekki2   = i.lekki2   - transferQty;
      if (transferFrom === "Maitama")  update.maitama  = i.maitama  - transferQty;
      if (transferTo   === "Lekki 1")  update.lekki1   = update.lekki1   + transferQty;
      if (transferTo   === "Lekki 2")  update.lekki2   = update.lekki2   + transferQty;
      if (transferTo   === "Maitama")  update.maitama  = update.maitama  + transferQty;
      return update;
    }));
    toast.success(`${item.name} transferred`, { description: `${transferQty} ${item.unit} · ${transferFrom} → ${transferTo}` });
    setTransferTarget(null);
  };

  /* ── column visibility ── */
  const showLekki1   = branchFilter === "All Branches" || branchFilter === "Lekki 1";
  const showLekki2   = branchFilter === "All Branches" || branchFilter === "Lekki 2";
  const showMaitama  = branchFilter === "All Branches" || branchFilter === "Maitama";

  const getCellQty = (item: InventoryItem, branch: Branch) => {
    if (branchFilter !== "All Branches" && branchFilter !== branch) return null;
    return branchQty(item, branch);
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Sub-header */}
        <p style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--color-text-muted)", margin: 0 }}>
          Stock levels across all locations
        </p>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            { label: "Total Items", value: totalItems, icon: <Package size={22} strokeWidth={1.6} color="var(--color-primary)" />,      iconBg: "rgba(225,11,28,0.08)"  },
            { label: "Low Stock",   value: lowStockCnt, icon: <TriangleAlert size={22} strokeWidth={1.6} color="#b45309" />,             iconBg: "rgba(245,158,11,0.10)" },
            { label: "Critical",    value: criticalCnt, icon: <TriangleAlert size={22} strokeWidth={1.6} color="var(--color-primary)" />, iconBg: "rgba(225,11,28,0.08)"  },
          ].map(({ label, value, icon, iconBg }) => (
            <div key={label} className="stat-card" style={{ alignItems: "center", gap: 10 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {icon}
              </div>
              <p style={{ margin: 0, fontSize: "1.6rem", fontWeight: 600, color: "var(--color-heading)", lineHeight: 1 }}>{value}</p>
              <p className="stat-label" style={{ margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Action bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="btn btn-primary" onClick={() => openAdjust(items[0])} style={{ gap: 6 }}>
            <Plus size={15} strokeWidth={2.2} /> Adjust Stock
          </button>
          <button
            onClick={() => openTransfer(items[0])}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-bg-card)", fontSize: "0.825rem", fontWeight: 500, color: "var(--color-text)", cursor: "pointer", fontFamily: "var(--font-sans)" }}
          >
            <ArrowLeftRight size={15} strokeWidth={1.8} /> Transfer
          </button>
          <button
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-bg-card)", fontSize: "0.825rem", fontWeight: 500, color: "var(--color-text)", cursor: "pointer", fontFamily: "var(--font-sans)" }}
          >
            <FileText size={15} strokeWidth={1.8} /> Reports
          </button>
        </div>

        {/* Filter row */}
        <div style={{ display: "flex", gap: 12 }}>
          <Dropdown options={BRANCH_FILTER_OPTIONS} value={branchFilter} onChange={setBranchFilter} minWidth={160} />
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={14} strokeWidth={1.8} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
            <input className="input" placeholder="Search inventory..." value={search}
              onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
          </div>
        </div>

        {/* Critical alert banner */}
        {criticalItems.length > 0 && (
          <div style={{ borderRadius: 10, border: "1px solid rgba(225,11,28,0.2)", background: "rgba(225,11,28,0.04)", padding: "14px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <TriangleAlert size={15} strokeWidth={1.8} color="var(--color-primary)" />
              <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-primary)" }}>Critical Stock Alert</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {criticalItems.map((item) => {
                const minQty = Math.min(item.lekki1, item.lekki2, item.maitama);
                const branch = item.lekki1 === minQty ? "Lekki 1" : item.lekki2 === minQty ? "Lekki 2" : "Maitama";
                return (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.855rem", fontWeight: 400, color: "var(--color-text)" }}>{item.name}</span>
                    <span style={{ fontSize: "0.855rem", fontWeight: 500, color: "var(--color-primary)" }}>
                      {minQty} {item.unit} left · {branch}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ minWidth: 200 }}>Item</th>
                  {showLekki1  && <th>Lekki 1</th>}
                  {showLekki2  && <th>Lekki 2</th>}
                  {showMaitama && <th>Maitama</th>}
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "var(--color-text-muted)" }}>No items found</td></tr>
                ) : (
                  filtered.map((item) => {
                    const status = getStatus(item, branchFilter);
                    const total  = branchFilter === "All Branches"
                      ? totalQty(item)
                      : branchQty(item, branchFilter as Branch);

                    return (
                      <tr key={item.id}>
                        <td>
                          <p style={{ margin: 0, fontWeight: 500, fontSize: "0.875rem", color: "var(--color-text)" }}>{item.name}</p>
                          <p style={{ margin: "1px 0 0", fontWeight: 400, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                            {item.category} · {item.unit}
                          </p>
                        </td>
                        {showLekki1  && <td style={{ fontWeight: 400 }}>{getCellQty(item, "Lekki 1")  ?? "–"}</td>}
                        {showLekki2  && <td style={{ fontWeight: 400 }}>{getCellQty(item, "Lekki 2")  ?? "–"}</td>}
                        {showMaitama && <td style={{ fontWeight: 400 }}>{getCellQty(item, "Maitama")  ?? "–"}</td>}
                        <td style={{ fontWeight: 500, color: "var(--color-text)" }}>{total}</td>
                        <td>
                          <span
                            className="badge"
                            style={{ background: STATUS_STYLE[status].bg, color: STATUS_STYLE[status].color, gap: 5 }}
                          >
                            {status === "In Stock"  && <TrendingUp  size={11} strokeWidth={2} />}
                            {status === "Low Stock" && <TrendingDown size={11} strokeWidth={2} />}
                            {status === "Critical"  && <TriangleAlert size={11} strokeWidth={2} />}
                            {status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {/* Adjust */}
                            <button
                              onClick={() => openAdjust(item)}
                              aria-label="Adjust stock"
                              style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid var(--color-border)", background: "var(--color-bg-soft)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-secondary)", transition: "border-color 0.15s" }}
                              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-primary)")}
                              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border)")}
                            >
                              <Plus size={13} strokeWidth={2.2} />
                            </button>
                            {/* Transfer */}
                            <button
                              onClick={() => openTransfer(item)}
                              aria-label="Transfer stock"
                              style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid var(--color-border)", background: "var(--color-bg-soft)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-secondary)", transition: "border-color 0.15s" }}
                              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-primary)")}
                              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border)")}
                            >
                              <ArrowLeftRight size={13} strokeWidth={1.8} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ══ ADJUST STOCK MODAL ══ */}
      {adjustTarget && (
        <Modal title="Adjust Stock" onClose={() => setAdjustTarget(null)}>
          {/* Item info */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "var(--color-bg-soft)", borderRadius: 8 }}>
            <div>
              <p style={{ margin: 0, fontWeight: 500, fontSize: "0.875rem", color: "var(--color-text)" }}>{adjustTarget.item.name}</p>
              <p style={{ margin: "2px 0 0", fontWeight: 400, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{adjustTarget.item.category}</p>
            </div>
            <span className="badge" style={{ background: STATUS_STYLE[getStatus(adjustTarget.item, adjustBranch)].bg, color: STATUS_STYLE[getStatus(adjustTarget.item, adjustBranch)].color }}>
              {getStatus(adjustTarget.item, adjustBranch)}
            </span>
          </div>

          {/* Branch */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>Branch</label>
            <Dropdown options={BRANCHES} value={adjustBranch} onChange={setAdjustBranch} minWidth="100%" />
          </div>

          {/* Current + Stepper */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>
              Current: {branchQty(adjustTarget.item, adjustBranch)} {adjustTarget.item.unit}
            </label>
            <Stepper value={adjustQty} onChange={setAdjustQty} />
          </div>

          {/* Reason */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>Reason</label>
            <Dropdown options={ADJUST_REASONS} value={adjustReason} onChange={setAdjustReason} minWidth="100%" />
          </div>

          <button
            className="btn btn-primary"
            onClick={handleAdjust}
            style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: "0.875rem" }}
          >
            Apply Adjustment
          </button>
        </Modal>
      )}

      {/* ══ TRANSFER STOCK MODAL ══ */}
      {transferTarget && (
        <Modal title="Transfer Stock" onClose={() => setTransferTarget(null)}>
          {/* Item info */}
          <div style={{ padding: "12px 14px", background: "var(--color-bg-soft)", borderRadius: 8 }}>
            <p style={{ margin: 0, fontWeight: 500, fontSize: "0.875rem", color: "var(--color-text)" }}>{transferTarget.item.name}</p>
            <p style={{ margin: "3px 0 0", fontWeight: 400, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
              Lekki 1: {transferTarget.item.lekki1} {transferTarget.item.unit} ·{" "}
              Lekki 2: {transferTarget.item.lekki2} {transferTarget.item.unit} ·{" "}
              Maitama: {transferTarget.item.maitama} {transferTarget.item.unit}
            </p>
          </div>

          {/* From / To */}
          <div>
            <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)", display: "block", marginBottom: 8 }}>Transfer:</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.78rem", fontWeight: 400, color: "var(--color-text-muted)" }}>From</label>
                <Dropdown options={BRANCHES} value={transferFrom} onChange={setTransferFrom} minWidth="100%" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.78rem", fontWeight: 400, color: "var(--color-text-muted)" }}>To</label>
                <Dropdown options={BRANCHES} value={transferTo} onChange={setTransferTo} minWidth="100%" />
              </div>
            </div>
          </div>

          {/* Quantity */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>
              Quantity ({transferTarget.item.unit})
            </label>
            <Stepper value={transferQty} onChange={setTransferQty} />
            <p style={{ margin: "4px 0 0", fontSize: "0.75rem", fontWeight: 400, color: "var(--color-text-muted)" }}>
              Available: {branchQty(transferTarget.item, transferFrom)} {transferTarget.item.unit}
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleTransfer}
            style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: "0.875rem" }}
          >
            Transfer Stock
          </button>
        </Modal>
      )}
    </>
  );
}