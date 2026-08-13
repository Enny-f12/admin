"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  ChevronDown,
  FileClock,
  CheckCircle2,
  SquarePen,
  X,
} from "lucide-react";
import { useMorningCountStore } from "@/store/useMorningCountStore";
import { useBranch } from "../../layout";

const STATUS_CLASS: Record<string, string> = {
  Updated: "badge badge-green",
  Pending: "badge badge-grey",
  "Out of stock": "badge badge-red",
};

// CHANGED — was a hardcoded "outlet_1" string, sent as-is to the backend
// and causing a 500 (the backend expects a real branch UUID, same failure
// mode as the earlier delivery-zones bug). Now sourced from the branch
// switcher in the layout, which is backed by GET /auth/branches.
const TODAY = new Date().toISOString().slice(0, 10);

export default function MorningCountPage() {
  const branch = useBranch();

  const {
    sheet,
    sheetLoading,
    sheetError,
    selectedCategoryId,
    isSavingDraft,
    fetchSheet,
    selectCategory,
    selectedCategory,
    updateItemCurrent,
    updateItemUom,
    saveDraft,
    submitSelectedCategory,
  } = useMorningCountStore();

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [editing, setEditing] = useState<{ itemId: string } | null>(null);
  const [editUnit, setEditUnit] = useState("");
  const [editPackSize, setEditPackSize] = useState("");

  // CHANGED — only fetch once a real branch id is available. branch.id is
  // "" while GET /auth/branches is still loading (see layout.tsx), so
  // guard against firing the request with an empty outletId.
  useEffect(() => {
    if (branch.id) {
      fetchSheet(branch.id, TODAY);
    }
  }, [fetchSheet, branch.id]);

  const category = selectedCategory();

  const openEdit = (itemId: string) => {
    if (!category) return;
    const item = category.items.find((i) => i.id === itemId);
    if (!item) return;
    setEditUnit(item.unit);
    setEditPackSize(item.packSize);
    setEditing({ itemId });
  };

  const saveEdit = async () => {
    if (!editing) return;
    const ok = await updateItemUom(editing.itemId, editUnit, editPackSize);
    if (ok) setEditing(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, position: "relative" }}>

      {/* Header — always renders, independent of sheet load state */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "var(--color-primary)" }}>
            {sheet?.outletName ?? "—"} <span style={{ margin: "0 4px" }}>•</span>{" "}
            <span style={{ fontWeight: 700 }}>(FOOD ITEMS ONLY)</span>
          </p>
          <h1 style={{ margin: "6px 0 0", fontSize: "1.25rem", fontWeight: 700, letterSpacing: "0.01em", color: "var(--color-heading)" }}>
            MORNING STOCK COUNT
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            Count every food item to unlock the day&apos;s operations
          </p>
        </div>

        <button
          onClick={() => saveDraft()}
          disabled={isSavingDraft || !sheet}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 16px",
            borderRadius: 8,
            border: "1px solid var(--color-primary)",
            background: "#fff",
            color: "var(--color-primary)",
            fontSize: "0.85rem",
            fontWeight: 600,
            fontFamily: "var(--font-sans)",
            cursor: isSavingDraft || !sheet ? "default" : "pointer",
            opacity: isSavingDraft || !sheet ? 0.6 : 1,
          }}
        >
          <Clock size={15} strokeWidth={1.8} />
          {isSavingDraft ? "Saving…" : "Save Draft"}
        </button>
      </div>

      {/* Meta rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: -8 }}>
        {[
          ["Date:", sheet?.date ?? "–"],
          ["Counter Staff:", sheet?.counterStaffName ?? "–"],
          ["Time:", sheet?.time ?? "–"],
        ].map(([label, value]) => (
          <p key={label} style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text)" }}>
            <span style={{ color: "var(--color-text-muted)" }}>{label}</span>{" "}
            <span style={{ fontWeight: 600 }}>{value}</span>
          </p>
        ))}
      </div>

      {/* Instructions */}
      <div className="card" style={{ border: "1px solid rgba(225,11,28,0.35)" }}>
        <p style={{ margin: "0 0 8px", fontSize: "0.9rem", fontWeight: 700, color: "var(--color-text)" }}>
          INSTRUCTIONS:
        </p>
        <p style={{ margin: "0 0 12px", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)" }}>
          Please physically count each FOOD ITEM and enter the quantity.
        </p>
        <p style={{ margin: "0 0 6px", fontSize: "0.85rem", color: "var(--color-text)" }}>
          &ldquo;Previous column shows&rdquo;
        </p>
        <ul style={{ margin: "0 0 12px", paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            "Previous day closing stock (if available)",
            "Last manual adjustment value (if no closing stock)",
            "Default value (10) if never inventoried",
            "\u201C_\u201D if first time - manual entry required",
          ].map((line) => (
            <li key={line} style={{ fontSize: "0.85rem", color: "var(--color-text)" }}>
              {line}
            </li>
          ))}
        </ul>
        <p style={{ margin: "0 0 4px", fontSize: "0.85rem", color: "var(--color-text)" }}>
          Items left blank <span style={{ margin: "0 4px" }}>→</span> Keep previous value
        </p>
        <p style={{ margin: "0 0 12px", fontSize: "0.85rem", color: "var(--color-text)" }}>
          Items marked &ldquo;0&rdquo; <span style={{ margin: "0 4px" }}>→</span>{" "}
          <span style={{ color: "var(--color-error, #E10B1C)", fontWeight: 600 }}>Out of stock</span>
        </p>
        <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)" }}>
          DRINKS are NOT counted here. Use Drinks Inventory tab.
        </p>
      </div>

      {/* Category selector + submission status — only meaningful once a sheet exists */}
      {sheet && category && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setCategoryOpen((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
                justifyContent: "space-between",
                minWidth: 200,
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid var(--color-border)",
                background: "#fff",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: 500,
                color: "var(--color-text)",
                fontFamily: "var(--font-sans)",
              }}
            >
              {category.name}
              <ChevronDown size={16} strokeWidth={1.8} color="var(--color-text-muted)" />
            </button>

            {categoryOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  left: 0,
                  minWidth: 200,
                  background: "#fff",
                  border: "1px solid var(--color-border)",
                  borderRadius: 10,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                  overflow: "hidden",
                  zIndex: 60,
                }}
              >
                {sheet.categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      selectCategory(cat.id);
                      setCategoryOpen(false);
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 14px",
                      background: cat.id === selectedCategoryId ? "var(--color-bg-soft)" : "#fff",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      fontFamily: "var(--font-sans)",
                      color: "var(--color-text)",
                    }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {category.submitted ? (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid rgba(22,163,74,0.35)",
                background: "rgba(22,163,74,0.06)",
                color: "#16A34A",
                fontSize: "0.85rem",
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={15} strokeWidth={1.8} />
              Submitted
            </span>
          ) : (
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid var(--color-border)",
                background: "#fff",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: 500,
                color: "var(--color-text)",
                fontFamily: "var(--font-sans)",
              }}
            >
              <FileClock size={15} strokeWidth={1.8} color="#a07a00" />
              Pending Submissions
            </button>
          )}
        </div>
      )}

      {/* Category table */}
      <div className="card" style={{ padding: sheet && category ? 0 : undefined, overflow: "hidden" }}>
        {sheetLoading && (
          <p style={{ padding: 20, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Loading…</p>
        )}

        {!sheetLoading && (sheetError || !sheet || !category) && (
          <p style={{ padding: 20, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            No count sheet available
          </p>
        )}

        {!sheetLoading && sheet && category && (
          <>
            <div style={{ padding: "20px 20px 4px" }}>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, letterSpacing: "0.02em", color: "var(--color-heading)" }}>
                {category.name.toUpperCase()}
              </h3>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    {["Item", "Pack Size", "Previous", "Current", "Status", "UoM"].map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {category.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <p style={{ margin: 0, fontWeight: 600, color: "var(--color-text)" }}>{item.name}</p>
                        <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-text-muted)" }}>{item.unit}</p>
                      </td>
                      <td style={{ fontWeight: 400 }}>{item.packSize}</td>
                      <td style={{ fontWeight: 500, color: "var(--color-text)" }}>{item.previous}</td>
                      <td>
                        <input
                          type="number"
                          className="input"
                          disabled={category.submitted}
                          value={item.current === null ? "" : item.current}
                          onChange={(e) =>
                            updateItemCurrent(item.id, e.target.value === "" ? null : Number(e.target.value))
                          }
                          style={{ width: 90, opacity: category.submitted ? 0.6 : 1 }}
                        />
                      </td>
                      <td>{item.status && <span className={STATUS_CLASS[item.status]}>{item.status}</span>}</td>
                      <td>
                        <button
                          onClick={() => openEdit(item.id)}
                          disabled={category.submitted}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 12px",
                            borderRadius: 8,
                            border: "1px solid var(--color-border)",
                            background: "#fff",
                            cursor: category.submitted ? "default" : "pointer",
                            opacity: category.submitted ? 0.6 : 1,
                            fontSize: "0.8rem",
                            fontWeight: 500,
                            color: "var(--color-text)",
                            fontFamily: "var(--font-sans)",
                          }}
                        >
                          <SquarePen size={13} strokeWidth={1.8} />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Summary */}
      <div className="card">
        <p style={{ margin: "0 0 10px", fontSize: "0.95rem", fontWeight: 700, color: "var(--color-heading)" }}>
          Summary:
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text)" }}>
            Total Items updated: <strong>{sheet?.summary.totalUpdated ?? "–"}</strong>
          </p>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text)" }}>
            Items pending: <strong>{sheet?.summary.totalPending ?? "–"}</strong>
          </p>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text)" }}>
            Items marked out of stock: <strong>{sheet?.summary.totalOutOfStock ?? "–"}</strong>
          </p>
        </div>
      </div>

      {/* Footer actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button
          style={{
            padding: "10px 20px",
            borderRadius: 8,
            border: "1px solid var(--color-border)",
            background: "#fff",
            cursor: "pointer",
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "var(--color-text)",
            fontFamily: "var(--font-sans)",
          }}
          onClick={() => branch.id && fetchSheet(branch.id, TODAY)}
        >
          Reset
        </button>
        <button
          className="btn btn-primary"
          style={{ padding: "10px 20px", fontSize: "0.85rem" }}
          disabled={!category || category.submitted}
          onClick={() => submitSelectedCategory()}
        >
          Submit Count
        </button>
      </div>

      {/* Dim overlay + Edit UoM modal */}
      {editing && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={() => setEditing(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 400,
              maxWidth: "90vw",
              background: "#fff",
              borderRadius: 14,
              padding: 24,
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--color-heading)" }}>
                Edit UoM
              </h3>
              <button
                onClick={() => setEditing(null)}
                aria-label="Close"
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)" }}>Unit</label>
              <input className="input" value={editUnit} onChange={(e) => setEditUnit(e.target.value)} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)" }}>Pack size</label>
              <input className="input" value={editPackSize} onChange={(e) => setEditPackSize(e.target.value)} />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setEditing(null)}
                style={{
                  padding: "9px 18px",
                  borderRadius: 8,
                  border: "1px solid var(--color-border)",
                  background: "#fff",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--color-text)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                Cancel
              </button>
              <button onClick={saveEdit} className="btn btn-primary" style={{ padding: "9px 18px", fontSize: "0.85rem" }}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}