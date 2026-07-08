"use client";

import { useState } from "react";
import {
  Calendar,
  ChevronDown,
  Search,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";

type ReconItem = {
  name: string;
  category: string;
  unit: string;
  system: number;
  physical: number;
};

const CATEGORIES = ["All Categories", "Pastry", "Swallow", "Soup", "Intercontinental", "Protein", "Drinks"];

const ITEMS: ReconItem[] = [
  { name: "Puff puff",       category: "Pastry",          unit: "Piece",   system: 55,  physical: 53   },
  { name: "Semo",            category: "Swallow",         unit: "Wrap",    system: 12,  physical: 9    },
  { name: "Egusi soup",      category: "Soup",            unit: "Bowl",    system: 9,   physical: 8    },
  { name: "Jollof rice",     category: "Intercontinental", unit: "Serving", system: 40,  physical: 40   },
  { name: "Cocacola",        category: "Drinks",          unit: "Can",     system: 240, physical: 235  },
  { name: "Grilled chicken", category: "Protein",         unit: "Piece",   system: 12,  physical: 11.4 },
  { name: "Egg roll",        category: "Pastry",          unit: "Piece",   system: 20,  physical: 15   },
  { name: "Milky doughnut",  category: "Pastry",          unit: "Piece",   system: 10,  physical: 8    },
  { name: "Chicken pie",     category: "Pastry",          unit: "Piece",   system: 25,  physical: 25   },
  { name: "Meat pie",        category: "Pastry",          unit: "Piece",   system: 40,  physical: 36   },
  { name: "Sugar doughnut",  category: "Pastry",          unit: "Piece",   system: 50,  physical: 45   },
];

const PAGE_SIZE = 6;

export default function ReconciliationPage() {
  const [countDate, setCountDate] = useState("May 15, 2025");
  const [conductedBy, setConductedBy] = useState("Sarah Johnson");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [reasonForVariance, setReasonForVariance] = useState("Counting error");
  const [adjustItem, setAdjustItem] = useState<ReconItem | null>(null);

  const filtered = ITEMS.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) &&
      (category === "All Categories" || i.category === category)
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, position: "relative" }}>
      <div>
        <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "var(--color-primary)" }}>Foodies 1 LEKKI</p>
        <h1 style={{ margin: "6px 0 0", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-heading)" }}>
          PHYSICAL COUNT RECONCILIATION
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          Physical count vs system records
        </p>
      </div>

      <div className="card">
        <Field label="Count Date">
          <div style={{ position: "relative", maxWidth: 260 }}>
            <Calendar size={16} strokeWidth={1.8} color="var(--color-primary)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
            <input className="input" value={countDate} onChange={(e) => setCountDate(e.target.value)} style={{ paddingLeft: 38, width: "100%" }} />
            <ChevronDown size={15} strokeWidth={1.8} color="var(--color-text-muted)" style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          </div>
        </Field>

        <Field label="Conducted by:">
          <div style={{ position: "relative", maxWidth: 260 }}>
            <select
              className="input"
              value={conductedBy}
              onChange={(e) => setConductedBy(e.target.value)}
              style={{ width: "100%", appearance: "none" }}
            >
              <option>Sarah Johnson</option>
              <option>Michael E.</option>
              <option>Tunde</option>
            </select>
            <ChevronDown size={15} strokeWidth={1.8} color="var(--color-text-muted)" style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          </div>
        </Field>
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

          <div style={{ position: "relative", minWidth: 170 }}>
            <button
              onClick={() => setCategoryOpen((v) => !v)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, width: "100%",
                padding: "10px 14px", borderRadius: 8, border: "1px solid var(--color-border)", background: "#fff",
                cursor: "pointer", fontSize: "0.85rem", color: "var(--color-text)", fontFamily: "var(--font-sans)",
              }}
            >
              {category}
              <ChevronDown size={15} strokeWidth={1.8} color="var(--color-text-muted)" />
            </button>
            {categoryOpen && (
              <div
                style={{
                  position: "absolute", top: "calc(100% + 6px)", left: 0, minWidth: 190,
                  background: "#fff", border: "1px solid var(--color-border)", borderRadius: 10,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.10)", overflow: "hidden", zIndex: 60,
                }}
              >
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setCategory(c); setCategoryOpen(false); setPage(1); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px",
                      background: c === category ? "var(--color-bg-soft)" : "#fff", border: "none", cursor: "pointer",
                      fontSize: "0.85rem", fontFamily: "var(--font-sans)", color: "var(--color-text)", textAlign: "left",
                    }}
                  >
                    {c === category && <Check size={13} strokeWidth={2} />}
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {["Item", "Unit", "System", "Physical", "Variance", "Action"].map((c) => <th key={c}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {paged.map((item) => {
                const variance = Math.round((item.physical - item.system) * 10) / 10;
                const isMatch = variance === 0;
                return (
                  <tr key={item.name}>
                    <td style={{ fontWeight: 600, color: "var(--color-text)" }}>{item.name}</td>
                    <td>{item.unit}</td>
                    <td>{item.system}</td>
                    <td>{item.physical}</td>
                    <td>
                      {isMatch ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#16A34A", fontWeight: 600 }}>
                          <Check size={14} strokeWidth={2} />
                          Match
                        </span>
                      ) : (
                        <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--color-primary)", fontWeight: 600 }}>
                          <AlertTriangle size={14} strokeWidth={1.8} />
                          {variance.toFixed(1)}
                        </span>
                      )}
                    </td>
                    <td>
                      {!isMatch && (
                        <button
                          onClick={() => setAdjustItem(item)}
                          style={{
                            padding: "7px 16px", borderRadius: 8, border: "1px solid var(--color-border)",
                            background: "#fff", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600,
                            color: "var(--color-text)", fontFamily: "var(--font-sans)",
                          }}
                        >
                          Adjust
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {paged.length === 0 && (
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
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-primary)", fontWeight: 600 }}>
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
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-primary)", fontWeight: 600 }}>
            Next
          </button>
        </div>
      </div>

      <Field label="Reason for variance:">
        <input className="input" value={reasonForVariance} onChange={(e) => setReasonForVariance(e.target.value)} style={{ maxWidth: 400 }} />
      </Field>

      <div style={{ display: "flex", gap: 10 }}>
        <button style={outlineBtn}>Cancel</button>
        <button className="btn btn-primary" style={{ padding: "10px 20px", fontSize: "0.85rem" }}>
          Confirm &amp; Sync
        </button>
      </div>

      {adjustItem && <AdjustModal item={adjustItem} onClose={() => setAdjustItem(null)} />}
    </div>
  );
}

const REASONS = ["Spoilage/Waste", "Counting Error", "Theft", "Damaged", "Other"];

function AdjustModal({ item, onClose }: { item: ReconItem; onClose: () => void }) {
  const [newValue, setNewValue] = useState(item.physical);
  const [reason, setReason] = useState("Spoilage/Waste");
  const [notes, setNotes] = useState("");
  const netAdjustment = Math.round((newValue - item.system) * 10) / 10;

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
          width: 460, maxWidth: "92vw", maxHeight: "88vh", background: "#fff", borderRadius: 14,
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "20px 24px 16px", flexShrink: 0, borderBottom: "1px solid var(--color-border)" }}>
          <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--color-heading)", paddingRight: 16 }}>
            Reconcile system records with physical count for {item.name}.
          </h3>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", flexShrink: 0 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "20px 24px 24px", overflowY: "auto" }}>
          <Field label={`New Stock Value (${item.unit === "Piece" ? "PCS" : item.unit.toUpperCase()})`}>
            <input className="input" type="number" value={newValue} onChange={(e) => setNewValue(Number(e.target.value) || 0)} />
          </Field>

          <p style={{ margin: "-6px 0 16px", fontSize: "0.85rem", color: "var(--color-text)" }}>
            Net adjustment:{" "}
            <span style={{ color: netAdjustment === 0 ? "#16A34A" : "var(--color-primary)", fontWeight: 700 }}>
              {netAdjustment > 0 ? "+" : ""}{netAdjustment} {item.unit.toLowerCase()}
            </span>
          </p>

          <Field label="Reason">
            <select className="input" value={reason} onChange={(e) => setReason(e.target.value)}>
              {REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </Field>

          <Field label="Notes">
            <textarea className="input" rows={3} placeholder="Add context for auditors...." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>

          <button
            className="btn btn-primary"
            style={{ width: "100%", padding: "10px 0", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={onClose}
          >
            Confirm Adjustment
          </button>
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

const outlineBtn: React.CSSProperties = {
  padding: "10px 20px", borderRadius: 8, border: "1px solid var(--color-border)", background: "#fff",
  cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)", fontFamily: "var(--font-sans)",
};