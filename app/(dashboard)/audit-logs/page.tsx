"use client";
import { useEffect, useState } from "react";
import { useBranch } from "../layout";
import { useAuditLogStore } from "@/store/useAuditLogsStore";
import { AuditLogExportFormat } from "@/types/audit-log.types";
import { SkeletonText } from "@/components/ui/Skeleton";

const ACTION_STYLES: Record<string, { bg: string; text: string }> = {
  "Morning Count": { bg: "#EFF6FF", text: "#2563EB" },
  "Delivery Add": { bg: "#F0FDF4", text: "#16A34A" },
  "POS Sale": { bg: "#FFF7ED", text: "#E05C2A" },
  "Order Taker": { bg: "#FAF5FF", text: "#7C3AED" },
  "Stock Adjustment": { bg: "#FEF3C7", text: "#B45309" },
  "Reservation Update": { bg: "#ECFEFF", text: "#0891B2" },
};

function IconFilter() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="14" y1="6" y2="6" /><line x1="4" x2="21" y1="12" y2="12" /><line x1="4" x2="10" y1="18" y2="18" />
      <circle cx="17" cy="6" r="2" fill="#374151" stroke="none" />
      <circle cx="14" cy="18" r="2" fill="#374151" stroke="none" />
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

export default function AuditLogsPage() {
  const branch = useBranch();

  const {
    logs, logsTotal, logsLoading, logsError, fetchLogs,
    actionTypes, fetchActionTypes,
    users, fetchUsers,
    exportLogs, isExporting,
  } = useAuditLogStore();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [actionType, setActionType] = useState("");
  const [userId, setUserId] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => {
    fetchActionTypes();
    fetchUsers();
  }, [fetchActionTypes, fetchUsers]);

  useEffect(() => {
    // branch.id scopes the query to AuditLog.branchId (see schema —
    // branchId is optional there, so branch-agnostic events like
    // vendor-level settings changes will still be excluded once a
    // specific branch is selected, by design).
    fetchLogs({
      branchId: branch.id,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      actionType: actionType || undefined,
      userId: userId || undefined,
      page,
      limit: PAGE_SIZE,
    });
  }, [branch, startDate, endDate, actionType, userId, page, fetchLogs]);

  const runExport = (format: AuditLogExportFormat) => {
    exportLogs({
      branchId: branch.id,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      actionType: actionType || undefined,
      userId: userId || undefined,
      format,
    });
  };

  const totalPages = Math.max(1, Math.ceil(logsTotal / PAGE_SIZE));

  return (
    <div style={{ margin: "0 auto" }}>
      <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "var(--color-primary)" }}>
        {branch.name} Branch
      </p>
      <h1 style={{ margin: "6px 0 0", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-heading)" }}>
        AUDIT LOGS
      </h1>
      <p style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--color-text-muted)", margin: "0 0 24px" }}>
        Every change is logged with user, timestamp and target
      </p>

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
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              style={{ height: 42, padding: "0 12px", background: "#FAFAFA", border: "1px solid #EBEBEB", borderRadius: 8, fontSize: 13.5, color: "#374151" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              style={{ height: 42, padding: "0 12px", background: "#FAFAFA", border: "1px solid #EBEBEB", borderRadius: 8, fontSize: 13.5, color: "#374151" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Action Type</label>
            <select
              value={actionType}
              onChange={(e) => { setActionType(e.target.value); setPage(1); }}
              style={{ height: 42, padding: "0 12px", background: "#FAFAFA", border: "1px solid #EBEBEB", borderRadius: 8, fontSize: 13.5, color: "#374151" }}
            >
              <option value="">All</option>
              {actionTypes?.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>User</label>
            <select
              value={userId}
              onChange={(e) => { setUserId(e.target.value); setPage(1); }}
              style={{ height: 42, padding: "0 12px", background: "#FAFAFA", border: "1px solid #EBEBEB", borderRadius: 8, fontSize: 13.5, color: "#374151" }}
            >
              <option value="">All</option>
              {users?.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

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
              {logsLoading && Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} style={TD_STYLE}><SkeletonText width="75%" height={12} /></td>
                  ))}
                </tr>
              ))}

              {!logsLoading && (logsError || !logs?.length) && (
                <tr>
                  <td colSpan={5} style={{ ...TD_STYLE, textAlign: "center", padding: "48px 0", color: "#9CA3AF" }}>
                    No audit entries found.
                  </td>
                </tr>
              )}

              {!logsLoading && !logsError && logs?.map((l) => {
                const chip = ACTION_STYLES[l.action] ?? { bg: "#F3F4F6", text: "#374151" };
                return (
                  <tr
                    key={l.id}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ ...TD_STYLE, fontWeight: 600, color: "#111827" }}>{l.timestamp}</td>
                    <td style={TD_STYLE}>{l.userName}</td>
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
              })}
            </tbody>
          </table>
        </div>

        {!logsLoading && !logsError && logs && logs.length > 0 && (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 14, padding: "14px 20px", fontSize: 13 }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ background: "none", border: "none", cursor: page === 1 ? "default" : "pointer", color: page === 1 ? "#D1D5DB" : "#E05C2A", fontWeight: 600 }}>
              Previous
            </button>
            <span style={{ color: "#9CA3AF" }}>Page {page} of {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ background: "none", border: "none", cursor: page === totalPages ? "default" : "pointer", color: page === totalPages ? "#D1D5DB" : "#E05C2A", fontWeight: 600 }}>
              Next
            </button>
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {([
          { label: "Export to CSV", format: "csv" as AuditLogExportFormat },
          { label: "Export to Excel", format: "xlsx" as AuditLogExportFormat },
          { label: "Export to PDF", format: "pdf" as AuditLogExportFormat },
        ]).map((e) => (
          <button
            key={e.label}
            onClick={() => runExport(e.format)}
            disabled={isExporting}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 16px", borderRadius: 8,
              border: "1px solid #E5E7EB", background: "#fff",
              fontSize: 13.5, fontWeight: 500, color: "#374151", cursor: isExporting ? "default" : "pointer",
              opacity: isExporting ? 0.6 : 1,
            }}
            onMouseEnter={(ev) => !isExporting && (ev.currentTarget.style.background = "#FAFAFA")}
            onMouseLeave={(ev) => (ev.currentTarget.style.background = "#fff")}
          >
            <IconDownload />
            {e.label}
          </button>
        ))}
        <button
          onClick={() => window.print()}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 16px", borderRadius: 8,
            border: "1px solid #E5E7EB", background: "#fff",
            fontSize: 13.5, fontWeight: 500, color: "#374151", cursor: "pointer",
          }}
          onMouseEnter={(ev) => (ev.currentTarget.style.background = "#FAFAFA")}
          onMouseLeave={(ev) => (ev.currentTarget.style.background = "#fff")}
        >
          <IconPrinter />
          Print Audit Report
        </button>
      </div>
    </div>
  );
}