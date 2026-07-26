// app/(admin)/dashboard/page.tsx
"use client";

import { useEffect } from "react";
import {
  DollarSign,
  ClipboardList,
  Users,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Clock,
  Eye,
  Box,
  ChefHat,
  CreditCard,
  Calculator,
  FileText,
  ShieldCheck,
  Settings,
  FileSearch,
} from "lucide-react";
import { useBranch } from "../layout";
import { useDashboardStore } from "@/store/useDashboardStore";

/* ── Types ── */
type StatCard = {
  label: string;
  value: string;
  change: string;
  up: boolean;
  icon: React.ElementType;
};

const CYCLE_STEPS = [
  { label: "Inventory", icon: Box },
  { label: "Orders", icon: ClipboardList },
  { label: "Kitchen", icon: ChefHat },
  { label: "Payments", icon: CreditCard },
  { label: "Accounting", icon: Calculator },
  { label: "Audit", icon: FileText },
];

const QUICK_ACTIONS = [
  { label: "Accounting", icon: Calculator, bg: "rgba(225,11,28,0.08)", color: "#E10B1C" },
  { label: "Audit Logs", icon: FileSearch, bg: "rgba(37,99,235,0.08)", color: "#2563EB" },
  { label: "User & Roles", icon: ShieldCheck, bg: "rgba(22,163,74,0.08)", color: "#16A34A" },
  { label: "Settings", icon: Settings, bg: "rgba(252,208,99,0.15)", color: "#a07a00" },
];

const STATUS_CLASS: Record<string, string> = {
  RECEIVED: "badge badge-yellow",
  PREPARING: "badge badge-red",
  READY_FOR_PICKUP: "badge badge-yellow",
  OUT_FOR_DELIVERY: "badge badge-yellow",
  DELIVERED: "badge badge-green",
  COMPLETED: "badge badge-green",
  CANCELLED: "badge badge-red",
};

function formatOrderType(type?: string) {
  if (!type) return "–";
  return type === "DINE_IN" ? "Dine In" : type === "TAKEAWAY" ? "Takeaway" : "Delivery";
}

function timeAgo(iso?: string) {
  if (!iso) return "–";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}

export default function DashboardPage() {
  const branch = useBranch();

  const {
    summary,
    summaryLoading,
    summaryError,
    lowStock,
    lowStockLoading,
    lowStockError,
    auditLogs: activity,
    auditLogsLoading: activityLoading,
    auditLogsError: activityError,
    orders,
    ordersLoading,
    ordersError,
    fetchAll,
  } = useDashboardStore();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const STATS: StatCard[] = [
    {
      label: "Revenue Today",
      value: summaryLoading ? "…" : `₦${(summary?.revenueToday ?? 0).toLocaleString()}`,
      change: summary?.revenueChangePercent != null ? `${summary.revenueChangePercent}%` : "–",
      up: (summary?.revenueChangePercent ?? 0) >= 0,
      icon: DollarSign,
    },
    {
      label: "Orders Today",
      value: summaryLoading ? "…" : `${summary?.ordersToday ?? 0}`,
      change: summary?.ordersChangePercent != null ? `${summary.ordersChangePercent}%` : "–",
      up: (summary?.ordersChangePercent ?? 0) >= 0,
      icon: ClipboardList,
    },
    {
      label: "Active Customers",
      // TODO(BACKEND): no total customer count endpoint yet — see request doc #4
      value: "–",
      change: "–",
      up: true,
      icon: Users,
    },
    {
      label: "System Health",
      // Not a backend concern — static/infra
      value: "99.8%",
      change: "0",
      up: true,
      icon: Activity,
    },
  ];

  const criticalCount = lowStock?.length ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
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
          <p
            style={{
              margin: 0,
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.04em",
              color: "var(--color-primary)",
              textTransform: "uppercase",
            }}
          >
            {branch} Branch
          </p>
          <h1
            style={{
              margin: "4px 0 0",
              fontSize: "1.4rem",
              fontWeight: 700,
              color: "var(--color-heading)",
            }}
          >
            Operations Cockpit
          </h1>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "0.85rem",
              color: "var(--color-text-muted)",
            }}
          >
            Real-time view across the restaurant lifecycle
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: "0.8rem",
            color: "var(--color-text-muted)",
            marginTop: 6,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: summaryError ? "#E10B1C" : "#16A34A",
                flexShrink: 0,
              }}
            />
            {summaryError ? "Connection issue" : "All systems operational"}
          </span>
          <span>·</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--color-text-muted)",
                flexShrink: 0,
              }}
            />
            {/* TODO(BACKEND): no POS sync status endpoint — see request doc #7 */}
            POS sync –
          </span>
        </div>
      </div>

      {/* Operational cycle */}
      <div className="card">
        <p
          style={{
            margin: "0 0 12px",
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.06em",
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
          }}
        >
          Operational Cycle
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {CYCLE_STEPS.map(({ label, icon: Icon }, i) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 14px",
                  borderRadius: 10,
                  background: "rgba(252,208,99,0.12)",
                  border: "1px solid rgba(160,122,0,0.20)",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  color: "var(--color-text)",
                  whiteSpace: "nowrap",
                }}
              >
                <Icon size={16} strokeWidth={1.8} color="#a07a00" />
                {label}
              </div>
              {i < CYCLE_STEPS.length - 1 && (
                <ArrowRight size={15} strokeWidth={2} color="var(--color-text-muted)" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
        }}
      >
        {STATS.map(({ label, value, change, up, icon: Icon }) => (
          <div key={label} className="stat-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "rgba(252,208,99,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={17} color="#a07a00" strokeWidth={1.8} />
              </div>
              {change !== "–" && (
                <span
                  className={up ? "stat-change" : "stat-change down"}
                  style={{ display: "flex", alignItems: "center", gap: 2, fontWeight: 500 }}
                >
                  {change}
                  {up ? <ArrowUpRight size={13} strokeWidth={2} /> : <ArrowDownRight size={13} strokeWidth={2} />}
                </span>
              )}
            </div>

            <p className="stat-value" style={{ margin: "10px 0 0", fontWeight: 600, fontSize: "1.6rem" }}>
              {value}
            </p>

            <p className="stat-label" style={{ margin: 0, fontWeight: 500 }}>
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Low stock + Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, alignItems: "start" }}>
        {/* Low stock */}
        <div className="card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <h3 style={{ fontSize: "0.95rem", fontWeight: 600, margin: 0 }}>Low Stock</h3>
            {criticalCount > 0 && (
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#E10B1C",
                  background: "rgba(225,11,28,0.08)",
                  padding: "4px 10px",
                  borderRadius: 999,
                }}
              >
                {criticalCount} critical
              </span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {lowStockLoading && (
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Loading…</p>
            )}
            {!lowStockLoading && (lowStockError || !lowStock?.length) && (
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                {/* TODO(BACKEND): GET /admin/inventory/alerts not implemented — see request doc #1 */}
                No stock data available
              </p>
            )}
            {!lowStockLoading &&
              lowStock?.map((item) => (
                <div
                  key={item.itemName}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "var(--color-bg-soft)",
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 600, color: "var(--color-text)" }}>
                      {item.itemName}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                      min {item.reorderThreshold} {item.unit}
                    </p>
                  </div>
                  <span style={{ fontSize: "1rem", fontWeight: 700, color: "#E10B1C" }}>
                    {item.currentQuantity}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="card">
          <h3 style={{ fontSize: "0.95rem", fontWeight: 600, margin: "0 0 14px" }}>Quick Actions</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {QUICK_ACTIONS.map(({ label, icon: Icon, bg, color }) => (
              <button
                key={label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "14px 12px",
                  borderRadius: 10,
                  border: "1px solid var(--color-border)",
                  background: "#fff",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--color-bg-soft)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#fff")}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={15} strokeWidth={1.8} color={color} />
                </div>
                <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--color-text)" }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <h3 style={{ fontSize: "0.95rem", fontWeight: 600, margin: 0 }}>Recent Activity</h3>
          <button
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-primary)",
              fontFamily: "var(--font-sans)",
              fontSize: "0.8rem",
              fontWeight: 500,
              padding: 0,
            }}
          >
            View Audit Logs
          </button>
        </div>

        <div>
          {activityLoading && (
            <p style={{ padding: "14px 20px", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              Loading…
            </p>
          )}
          {!activityLoading && (activityError || !activity?.length) && (
            <p style={{ padding: "14px 20px", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              {/* TODO(BACKEND): GET /admin/audit-logs not implemented — see request doc #2 */}
              No recent activity available
            </p>
          )}
          {!activityLoading &&
            activity?.map((item, i) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "14px 20px",
                  borderBottom: i < activity.length - 1 ? "1px solid var(--color-border)" : "none",
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: "var(--color-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                    fontSize: "0.72rem",
                    color: "#7a5500",
                    flexShrink: 0,
                  }}
                >
                  {item.actorInitial}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 500, color: "var(--color-text)" }}>
                    {item.actorName} {item.action}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    {timeAgo(item.createdAt)} · {item.entityType}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Recent orders */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <h3 style={{ fontSize: "0.95rem", fontWeight: 600, margin: 0 }}>Recent Orders</h3>
          <button
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-primary)",
              fontFamily: "var(--font-sans)",
              fontSize: "0.8rem",
              fontWeight: 500,
              padding: 0,
            }}
          >
            View All
          </button>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {["Order ID", "Customer", "Items", "Total Amount", "Type", "Status", "Time", "Action"].map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ordersLoading && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 20, color: "var(--color-text-muted)" }}>
                    Loading…
                  </td>
                </tr>
              )}
              {!ordersLoading && (ordersError || !orders?.length) && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 20, color: "var(--color-text-muted)" }}>
                    {/* TODO(BACKEND): GET /admin/orders response shape unconfirmed — see request doc #5 */}
                    No order data available
                  </td>
                </tr>
              )}
              {!ordersLoading &&
                orders?.map((order) => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 600, color: "var(--color-text)" }}>{order.id}</td>
                    <td style={{ fontWeight: 400 }}>{order.customerName ?? "–"}</td>
                    <td style={{ fontWeight: 400 }}>{order.itemCount ?? "–"}</td>
                    <td style={{ fontWeight: 500, color: "var(--color-text)" }}>
                      {order.totalAmount != null ? `₦${order.totalAmount.toLocaleString()}` : "–"}
                    </td>
                    <td style={{ fontWeight: 400 }}>{formatOrderType(order.orderType)}</td>
                    <td>
                      <span className={STATUS_CLASS[order.status] ?? "badge"}>{order.status ?? "–"}</span>
                    </td>
                    <td>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          color: "var(--color-text-secondary)",
                          fontSize: "0.83rem",
                          fontWeight: 400,
                        }}
                      >
                        <Clock size={13} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                        {timeAgo(order.createdAt)}
                      </span>
                    </td>
                    <td>
                      <button
                        aria-label={`View order ${order.id}`}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--color-text-muted)",
                          display: "flex",
                          padding: 4,
                          borderRadius: 6,
                          transition: "color 0.15s",
                        }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--color-text)")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)")}
                      >
                        <Eye size={15} strokeWidth={1.8} />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}