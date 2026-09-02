// app/(dashboard)/inventory/morning-count/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  ChevronDown,
  FileClock,
  CheckCircle2,
  SquarePen,
  X,
  Loader2,
  ClipboardList,
} from "lucide-react";
import { useMorningCountStore } from "@/store/useMorningCountStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useBranch } from "../../layout";

const STATUS_CLASS: Record<string, string> = {
  Updated: "badge badge-green",
  Pending: "badge badge-grey",
  "Out of stock": "badge badge-red",
};

const TODAY = new Date().toISOString().slice(0, 10);

// Roles allowed to see the staff audit log from this page. Adjust these
// two strings if your role enum names them differently.
const STAFF_LOG_ROLES = ["SUPER_ADMIN", "MANAGER"];

// Backend sends sheet.date as a raw ISO string (e.g.
// "2026-08-14T00:00:00.000Z") — display it as "14 August 2026" instead.
function formatDayMonthYear(iso?: string | null) {
  if (!iso) return "–";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
}

export default function MorningCountPage() {
  const branch = useBranch();
  const router = useRouter();
  const { user } = useAuthStore();

  const {
    sheet,
    sheetLoading,
    sheetError,
    selectedCategoryId,
    isSavingDraft,
    updatingItemIds,
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

  // Morning Count is inherently single-branch — you physically count
  // stock at one location. "All Branches" no longer exists as a
  // selectable option (see app/(admin)/layout.tsx), so this now just
  // guards the brief window before a picker's initial branch selection
  // lands.
  const hasUsableBranch = Boolean(branch.id);

  const canViewStaffLogs = Boolean(user?.role && STAFF_LOG_ROLES.includes(user.role));

  useEffect(() => {
    if (hasUsableBranch) {
      fetchSheet(branch.id, TODAY);
    }
  }, [fetchSheet, branch.id, hasUsableBranch]);

  const category = selectedCategory();

  // CHANGED — display name now sourced from useBranch() (GET
  // /auth/branches, same source as the sidebar/dashboard header), not
  // sheet.outletName. Two endpoints independently returning a branch
  // name risks them drifting out of sync; branch.id is already what
  // fetchSheet is keyed on, so branch.name is the consistent choice for
  // what to *display* too. sheet?.outletName kept only as a last-resort
  // fallback in case branch.name is ever empty mid-load.
  const outletDisplayName = branch.name || sheet?.outletName || "—";

  const metaRows: [string, string][] = [
    ["Date:", formatDayMonthYear(sheet?.date)],
    ["Counter Staff:", sheet?.counterStaffName ?? "–"],
    ["Time:", sheet?.time ?? "–"],
  ];

  // FIX — the /morning-count/sheet response doesn't include a `summary`
  // object at all (verified in the Network tab: the payload is just
  // { id, branchId, date, categories }), so `sheet?.summary.totalUpdated`
  // crashed with "Cannot read properties of undefined (reading
  // 'totalUpdated')" the moment a sheet loaded. Computing the counts
  // client-side from categories/items removes the dependency on a field
  // the backend never sends, and stays correct even if that changes later.
  //
  // Also note: item.status is trusted as the source of truth here
  // ("Updated" / "Pending" / "Out of stock"), matching STATUS_CLASS.
  // Any status value other than those three falls into "pending" so the
  // counts always add up to the total item count.
  const summary = useMemo(() => {
    if (!sheet) return null;
    let totalUpdated = 0;
    let totalOutOfStock = 0;
    let totalPending = 0;
    for (const cat of sheet.categories) {
      for (const item of cat.items) {
        if (item.status === "Updated") totalUpdated++;
        else if (item.status === "Out of stock") totalOutOfStock++;
        else totalPending++;
      }
    }
    return { totalUpdated, totalPending, totalOutOfStock };
  }, [sheet]);

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
      <style jsx global>{`
        .spin {
          animation: morning-count-spin 0.8s linear infinite;
        }
        @keyframes morning-count-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

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
            {outletDisplayName}
          </p>
          <h1 style={{ margin: "6px 0 0", fontSize: "1.25rem", fontWeight: 700, letterSpacing: "0.01em", color: "var(--color-heading)" }}>
            MORNING STOCK COUNT
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            Count every item to unlock the day&apos;s operations
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {canViewStaffLogs && (
            <button
              onClick={() => router.push("/inventory/morning-count/audit-logs")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 16px",
                borderRadius: 8,
                border: "1px solid var(--color-border)",
                background: "#fff",
                color: "var(--color-text)",
                fontSize: "0.85rem",
                fontWeight: 600,
                fontFamily: "var(--font-sans)",
                cursor: "pointer",
                transition: "background 0.18s cubic-bezier(0.16, 1, 0.3, 1), transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--color-bg-soft)";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#fff";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              }}
            >
              <ClipboardList size={15} strokeWidth={1.8} />
              View Staff Logs
            </button>
          )}

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
              transition: "opacity 0.18s cubic-bezier(0.16, 1, 0.3, 1), transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <Clock size={15} strokeWidth={1.8} />
            {isSavingDraft ? "Saving…" : "Save Draft"}
          </button>
        </div>
      </div>

      {/* Meta rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: -8 }}>
        {metaRows.map(([label, value]) => (
          <p key={label} style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text)" }}>
            <span style={{ color: "var(--color-text-muted)" }}>{label}</span>{" "}
            <span style={{ fontWeight: 600 }}>{value}</span>
          </p>
        ))}
      </div>

      {/* Instructions */}
      <div className="card" style={{ background: "rgba(225,11,28,0.08)", border: "1px solid rgba(225,11,28,0.35)" }}>
        <p style={{ margin: "0 0 8px", fontSize: "0.9rem", fontWeight: 700, color: "var(--color-text)" }}>
          INSTRUCTIONS:
        </p>
        <p style={{ margin: "0 0 12px", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)" }}>
          Please physically count each ITEM and enter the quantity.
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
        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text)" }}>
          Items marked &ldquo;0&rdquo; <span style={{ margin: "0 4px" }}>→</span>{" "}
          <span style={{ color: "var(--color-error, #E10B1C)", fontWeight: 600 }}>Out of stock</span>
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
                transition: "border-color 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              {category.name}
              <ChevronDown
                size={16}
                strokeWidth={1.8}
                color="var(--color-text-muted)"
                style={{
                  transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  transform: categoryOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
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
                  animation: "morning-count-dropdown-in 0.16s cubic-bezier(0.16, 1, 0.3, 1)",
                  transformOrigin: "top",
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
                      transition: "background 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                    onMouseEnter={(e) => {
                      if (cat.id !== selectedCategoryId) {
                        (e.currentTarget as HTMLButtonElement).style.background = "var(--color-bg-soft)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (cat.id !== selectedCategoryId) {
                        (e.currentTarget as HTMLButtonElement).style.background = "#fff";
                      }
                    }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* FIX — backend field is `isSubmitted`, not `submitted`. This
              previously never matched, so submitted categories would
              silently render as still-editable. */}
          {category.isSubmitted ? (
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
                transition: "background 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--color-bg-soft)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#fff";
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

        {!sheetLoading && !hasUsableBranch && (
          <p style={{ padding: 20, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            Loading your branch...
          </p>
        )}

        {!sheetLoading && hasUsableBranch && (sheetError || !sheet || !category) && (
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
                    <tr key={item.id} style={{ transition: "background 0.15s cubic-bezier(0.16, 1, 0.3, 1)" }}>
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
                          disabled={category.isSubmitted}
                          value={item.current === null ? "" : item.current}
                          onChange={(e) =>
                            updateItemCurrent(item.id, e.target.value === "" ? null : Number(e.target.value))
                          }
                          style={{
                            width: 90,
                            opacity: category.isSubmitted ? 0.6 : updatingItemIds[item.id] ? 0.85 : 1,
                            transition: "opacity 0.18s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                          }}
                        />
                      </td>
                      <td>
                        {updatingItemIds[item.id] ? (
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              fontSize: "0.78rem",
                              color: "var(--color-text-muted)",
                            }}
                          >
                            <Loader2 size={13} strokeWidth={2} className="spin" />
                            Saving…
                          </span>
                        ) : (
                          item.status && <span className={STATUS_CLASS[item.status]}>{item.status}</span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => openEdit(item.id)}
                          disabled={category.isSubmitted}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 12px",
                            borderRadius: 8,
                            border: "1px solid var(--color-border)",
                            background: "#fff",
                            cursor: category.isSubmitted ? "default" : "pointer",
                            opacity: category.isSubmitted ? 0.6 : 1,
                            fontSize: "0.8rem",
                            fontWeight: 500,
                            color: "var(--color-text)",
                            fontFamily: "var(--font-sans)",
                            transition: "background 0.18s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                          }}
                          onMouseEnter={(e) => {
                            if (!category.isSubmitted) {
                              (e.currentTarget as HTMLButtonElement).style.background = "var(--color-bg-soft)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = "#fff";
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

      {/* Summary — computed client-side from sheet.categories (see `summary`
          above); the backend response has no summary field to read. */}
      <div className="card">
        <p style={{ margin: "0 0 10px", fontSize: "0.95rem", fontWeight: 700, color: "var(--color-heading)" }}>
          Summary:
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text)" }}>
            Total Items updated: <strong>{summary?.totalUpdated ?? "–"}</strong>
          </p>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text)" }}>
            Items pending: <strong>{summary?.totalPending ?? "–"}</strong>
          </p>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text)" }}>
            Items marked out of stock: <strong>{summary?.totalOutOfStock ?? "–"}</strong>
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
            transition: "background 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--color-bg-soft)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#fff";
          }}
          onClick={() => hasUsableBranch && fetchSheet(branch.id, TODAY)}
        >
          Reset
        </button>
        <button
          className="btn btn-primary"
          style={{ padding: "10px 20px", fontSize: "0.85rem", transition: "opacity 0.18s cubic-bezier(0.16, 1, 0.3, 1), transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)" }}
          disabled={!category || category.isSubmitted}
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
            animation: "morning-count-fade-in 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
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
              animation: "morning-count-modal-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--color-heading)" }}>
                Edit UoM
              </h3>
              <button
                onClick={() => setEditing(null)}
                aria-label="Close"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-text-muted)",
                  display: "flex",
                  transition: "color 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
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
                  transition: "background 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "var(--color-bg-soft)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#fff";
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="btn btn-primary"
                style={{ padding: "9px 18px", fontSize: "0.85rem", transition: "opacity 0.18s cubic-bezier(0.16, 1, 0.3, 1)" }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes morning-count-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes morning-count-modal-in {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes morning-count-dropdown-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}