"use client";
import { useState } from "react";

interface LogEntry {
  id: number;
  timestamp: string;
  user: string;
  branch: string;
  action: string;
  item: string;
}

const LOGS: LogEntry[] = [
  { id: 1, timestamp: "May 15, 08:35", user: "Sarah Johnson", branch: "Lekki 1", action: "Morning Count", item: "All Dish" },
  { id: 2, timestamp: "May 14, 14:30", user: "John Manager", branch: "Lekki 1", action: "Delivery Add", item: "Egusi" },
  { id: 3, timestamp: "May 14, 12:00", user: "Moniepoint API", branch: "Lekki 1", action: "POS Sale", item: "Jollof rice, Chicken" },
  { id: 4, timestamp: "May 14, 11:30", user: "Micheal Emmanuel", branch: "Lekki 2", action: "Order Taker", item: "Jollof rice, Chicken" },
];

const ACTION_STYLES: Record<string, { bg: string; text: string }> = {
  "Morning Count": { bg: "#EFF6FF", text: "#2563EB" },
  "Delivery Add": { bg: "#F0FDF4", text: "#16A34A" },
  "POS Sale": { bg: "#FFF7ED", text: "#E05C2A" },
  "Order Taker": { bg: "#FAF5FF", text: "#7C3AED" },
};

// ── Icons ─────────────────────────────────────────────────────────────────────
function IconFilter() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="14" y1="6" y2="6" /><line x1="4" x2="21" y1="12" y2="12" /><line x1="4" x2="10" y1="18" y2="18" />
      <circle cx="17" cy="6" r="2" fill="#374151" stroke="none" />
      <circle cx="17" cy="12" r="0" />
      <circle cx="14" cy="18" r="2" fill="#374151" stroke="none" />
    </svg>
  );
}
function IconChevronDown() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
function IconDownload() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}
function IconPrinter() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect width="12" height="8" x="6" y="14" />
    </svg>
  );
}

// ── Select ────────────────────────────────────────────────────────────────────
function FilterSelect({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{label}</label>
      <button
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 8, height: 42, padding: "0 12px",
          background: "#FAFAFA", border: "1px solid #EBEBEB", borderRadius: 8,
          fontSize: 13.5, color: "#374151", cursor: "pointer", width: "100%",
        }}
      >
        {value}
        <IconChevronDown />
      </button>
    </div>
  );
}

const EXPORTS = [
  { label: "Export to CSV", icon: true },
  { label: "Export to Excel", icon: true },
  { label: "Export to PDF", icon: true },
  { label: "Print Audit Report", icon: false },
];

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AuditLogsPage() {
  const [logs] = useState<LogEntry[]>(LOGS);

  const TH_STYLE: React.CSSProperties = {
    padding: "14px 20px",
    fontSize: 13,
    fontWeight: 600,
    color: "#6B7280",
    textAlign: "left",
    whiteSpace: "nowrap",
    borderBottom: "1px solid #F0F0F0",
    background: "#fff",
  };

  const TD_STYLE: React.CSSProperties = {
    padding: "18px 20px",
    fontSize: 14,
    color: "#374151",
    borderBottom: "1px solid #F5F5F5",
    whiteSpace: "nowrap",
  };

  return (
    <div style={{ margin: "0 auto" }}>
      {/* Page title */}
      <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "var(--color-primary)" }}>
        Foodies 1 LEKKI
      </p>
      <h1 style={{ margin: "6px 0 0", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-heading)" }}>
        AUDIT LOGS
      </h1>
      <p style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--color-text-muted)", margin: "0 0 24px" }}>
        Every change is logged with user, timestamp and target
      </p>

      {/* Filter card */}
      <div
        style={{
          background: "#fff", borderRadius: 16, border: "1px solid #EBEBEB",
          boxShadow: "0 1px 6px rgba(0,0,0,0.05)", padding: 20, marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
          <IconFilter />
          <span style={{ fontSize: 14.5, fontWeight: 700, color: "#111827" }}>Filter</span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 16,
          }}
        >
          <FilterSelect label="Date Range" value="May" />
          <FilterSelect label="Branch" value="All" />
          <FilterSelect label="Action Type" value="All" />
          <FilterSelect label="User" value="All" />
        </div>
      </div>

      {/* Table card */}
      <div
        style={{
          background: "#fff", borderRadius: 16, border: "1px solid #EBEBEB",
          boxShadow: "0 1px 6px rgba(0,0,0,0.05)", overflow: "hidden", marginBottom: 20,
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={TH_STYLE}>Timestamp</th>
                <th style={TH_STYLE}>User</th>
                <th style={TH_STYLE}>Branch</th>
                <th style={TH_STYLE}>Action</th>
                <th style={TH_STYLE}>Item</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ ...TD_STYLE, textAlign: "center", padding: "48px 0", color: "#9CA3AF" }}>
                    No audit entries found.
                  </td>
                </tr>
              ) : (
                logs.map((l) => {
                  const chip = ACTION_STYLES[l.action] ?? { bg: "#F3F4F6", text: "#374151" };
                  return (
                    <tr
                      key={l.id}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ ...TD_STYLE, fontWeight: 600, color: "#111827" }}>{l.timestamp}</td>
                      <td style={TD_STYLE}>{l.user}</td>
                      <td style={TD_STYLE}>{l.branch}</td>
                      <td style={TD_STYLE}>
                        <span
                          style={{
                            display: "inline-block", padding: "4px 10px", borderRadius: 999,
                            fontSize: 12.5, fontWeight: 600, background: chip.bg, color: chip.text,
                          }}
                        >
                          {l.action}
                        </span>
                      </td>
                      <td style={TD_STYLE}>{l.item}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export actions */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {EXPORTS.map((e) => (
          <button
            key={e.label}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 16px", borderRadius: 8,
              border: "1px solid #E5E7EB", background: "#fff",
              fontSize: 13.5, fontWeight: 500, color: "#374151", cursor: "pointer",
            }}
            onMouseEnter={(ev) => (ev.currentTarget.style.background = "#FAFAFA")}
            onMouseLeave={(ev) => (ev.currentTarget.style.background = "#fff")}
          >
            {e.icon ? <IconDownload /> : <IconPrinter />}
            {e.label}
          </button>
        ))}
      </div>
    </div>
  );
}