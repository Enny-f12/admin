"use client";

import { useEffect, useState } from "react";
import { Download, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuditLogStore } from "@/store/useMorningCountStore";

export default function AuditLogPage() {
  const { entries, total, page, limit, loading, isExporting, filters, setFilters, fetch, exportLog } =
    useAuditLogStore();

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    fetch(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = () => {
    setFilters({ ...filters, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined });
    fetch(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <style jsx global>{`
        .audit-btn {
          transition: background 0.15s ease, transform 0.15s ease, border-color 0.15s ease;
        }
        .audit-btn:hover:not(:disabled) {
          border-color: var(--color-primary);
          transform: translateY(-1px);
        }
        .audit-row {
          transition: background 0.15s ease;
        }
        .audit-row:hover {
          background: var(--color-bg-soft);
        }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "var(--color-heading)" }}>
            Audit Log — Morning Count
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            Read-only. One row per category submitted, with who submitted it and what changed.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="audit-btn" disabled={isExporting} onClick={() => exportLog("csv")} style={btnStyle}>
            <Download size={14} /> CSV
          </button>
          <button className="audit-btn" disabled={isExporting} onClick={() => exportLog("pdf")} style={btnStyle}>
            <FileText size={14} /> PDF
          </button>
        </div>
      </div>

      <div className="card" style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>From</label>
          <input type="date" className="input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>To</label>
          <input type="date" className="input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <button className="btn btn-primary audit-btn" onClick={applyFilters} style={{ padding: "9px 16px", fontSize: "0.85rem" }}>
          Apply
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {["Staff", "Email", "Branch", "Date", "Time", "Category", "Items Updated", "Total"].map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} style={{ padding: 20, textAlign: "center", color: "var(--color-text-muted)" }}>Loading…</td></tr>
              )}
              {!loading && entries.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 20, textAlign: "center", color: "var(--color-text-muted)" }}>No entries found.</td></tr>
              )}
              {!loading && entries.map((e) => (
                <tr key={e.id} className="audit-row">
                  <td style={{ fontWeight: 600 }}>{e.staffName}</td>
                  <td>{e.staffEmail}</td>
                  <td>{e.branchName}</td>
                  <td>{e.date}</td>
                  <td>{e.time}</td>
                  <td>{e.categoryName}</td>
                  <td style={{ maxWidth: 260 }} title={e.itemsUpdated.join(", ")}>
                    {e.itemsUpdated.slice(0, 3).join(", ")}
                    {e.itemsUpdated.length > 3 ? ` +${e.itemsUpdated.length - 3} more` : ""}
                  </td>
                  <td>{e.totalItemsUpdated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
        <button className="audit-btn" disabled={page <= 1} onClick={() => fetch(page - 1)} style={pageBtnStyle}>
          <ChevronLeft size={14} />
        </button>
        <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          Page {page} of {totalPages}
        </span>
        <button className="audit-btn" disabled={page >= totalPages} onClick={() => fetch(page + 1)} style={pageBtnStyle}>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "9px 14px",
  borderRadius: 8,
  border: "1px solid var(--color-border)",
  background: "#fff",
  cursor: "pointer",
  fontSize: "0.85rem",
  fontWeight: 600,
  color: "var(--color-text)",
  fontFamily: "var(--font-sans)",
};

const pageBtnStyle: React.CSSProperties = {
  ...btnStyle,
  padding: "6px 10px",
};