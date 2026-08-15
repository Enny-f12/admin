// app/(admin)/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  X,
  MapPin,
  User as UserIcon,
} from "lucide-react";
import { useBranch } from "../layout";
import { useDashboardStore } from "@/store/useDashboardStore";
import { AdminOrder } from "@/types/dashboard";

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


const QUICK_ACTIONS: {
  label: string;
  icon: React.ElementType;
  bg: string;
  color: string;
  href: string | null;
}[] = [
  { label: "Accounting", icon: Calculator, bg: "rgba(225,11,28,0.08)", color: "#E10B1C", href: "/accounting" },
  { label: "Audit Logs", icon: FileSearch, bg: "rgba(37,99,235,0.08)", color: "#2563EB", href: "/audit-logs" },
  { label: "User & Roles", icon: ShieldCheck, bg: "rgba(22,163,74,0.08)", color: "#16A34A", href: null },
  { label: "Settings", icon: Settings, bg: "rgba(252,208,99,0.15)", color: "#a07a00", href: "/settings" },
];

// Dashboard previews are capped to this many rows; "View more" / "View
// all" hands off to the full page.
const PREVIEW_ROWS = 5;
const ORDERS_HREF = "/orders";
// Not given explicitly in the request — matches the "Stock Inventory"
// sidebar item. Flag/change this if a dedicated alerts route exists.
const LOW_STOCK_HREF = "/stock-inventory";

const STATUS_CLASS: Record<string, string> = {
  RECEIVED: "badge badge-yellow",
  PREPARING: "badge badge-red",
  READY_FOR_PICKUP: "badge badge-yellow",
  OUT_FOR_DELIVERY: "badge badge-yellow",
  DELIVERED: "badge badge-green",
  COMPLETED: "badge badge-green",
  CANCELLED: "badge badge-red",
};


const ACTION_LABEL: Record<string, string> = {
  CREATE: "created",
  UPDATE: "updated",
  STATUS_CHANGE: "changed the status of",
  DELETE: "deleted",
};

function actionLabel(action: string) {
  return ACTION_LABEL[action] ?? action.toLowerCase().replace(/_/g, " ");
}

function formatOrderType(type?: string) {
  if (!type) return "–";
  return type === "DINE_IN" ? "Dine In" : type === "TAKEAWAY" ? "Takeaway" : "Delivery";
}

// Money fields come back from /admin/orders as numeric strings (e.g.
// "8000"), not numbers — always route through this rather than calling
// .toLocaleString() directly on the raw value.
function formatNaira(amount: string | number | null | undefined) {
  const n = Number(amount ?? 0);
  return `₦${Number.isFinite(n) ? n.toLocaleString() : "0"}`;
}

function formatPaymentMethod(method?: string | null) {
  if (!method) return "–";
  return method
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatDateTime(iso?: string | null) {
  if (!iso) return "–";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
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

/* ── Skeleton primitive — kept local, no extra file per request ── */
function Skeleton({
  width = "100%",
  height = 14,
  radius = 6,
  style = {},
}: {
  width?: string | number;
  height?: number;
  radius?: number;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className="skeleton-shimmer"
      style={{ display: "inline-block", width, height, borderRadius: radius, ...style }}
    />
  );
}

function TotalsRow({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: bold ? "0.95rem" : "0.85rem",
        fontWeight: bold ? 700 : 400,
        color: bold ? "var(--color-text)" : "var(--color-text-secondary)",
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function NoteBlock({ label, text }: { label: string; text: string }) {
  return (
    <div style={{ background: "var(--color-bg-soft)", borderRadius: 8, padding: "10px 12px" }}>
      <p
        style={{
          margin: 0,
          fontSize: "0.7rem",
          fontWeight: 600,
          color: "var(--color-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </p>
      <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--color-text)" }}>{text}</p>
    </div>
  );
}

const modalLabelStyle: React.CSSProperties = {
  margin: "0 0 2px",
  fontSize: "0.7rem",
  fontWeight: 600,
  color: "var(--color-text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};
const modalValueStyle: React.CSSProperties = {
  margin: "0 0 10px",
  fontSize: "0.85rem",
  fontWeight: 500,
  color: "var(--color-text)",
};
const modalSubValueStyle: React.CSSProperties = {
  margin: "0 0 2px",
  fontSize: "0.78rem",
  color: "var(--color-text-muted)",
};

export default function DashboardPage() {
  const branch = useBranch();
  const router = useRouter();
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

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
    // useBranch() returns { id, name } (see layout.tsx SelectedBranch) —
    // id is the real UUID, no more guessing at field names.
    fetchAll(undefined, branch.id);
  }, [fetchAll, branch]);

  const STATS: StatCard[] = [
    {
      label: "Revenue Today",
      value: `₦${(summary?.revenueToday ?? 0).toLocaleString()}`,
      change: summary?.revenueChangePercent != null ? `${summary.revenueChangePercent}%` : "–",
      up: (summary?.revenueChangePercent ?? 0) >= 0,
      icon: DollarSign,
    },
    {
      label: "Orders Today",
      value: `${summary?.ordersToday ?? 0}`,
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

  const totalLowStock = lowStock?.length ?? 0;
  const outOfStockCount = lowStock?.filter((i) => i.status === "OUT_OF_STOCK").length ?? 0;
  const visibleLowStock = lowStock?.slice(0, PREVIEW_ROWS) ?? [];

  const visibleOrders = orders?.slice(0, PREVIEW_ROWS) ?? [];
  const totalOrders = orders?.length ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <style jsx global>{`
        .skeleton-shimmer {
          background: linear-gradient(
            90deg,
            var(--color-bg-soft) 25%,
            rgba(0, 0, 0, 0.06) 37%,
            var(--color-bg-soft) 63%
          );
          background-size: 400% 100%;
          animation: skeleton-shimmer 1.4s ease infinite;
        }
        @keyframes skeleton-shimmer {
          0% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0 50%;
          }
        }
        .dashboard-two-col {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 16px;
          align-items: start;
        }
        .quick-actions-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .cycle-scroll {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: nowrap;
          overflow-x: auto;
          padding-bottom: 2px;
          -webkit-overflow-scrolling: touch;
        }
        .dashboard-header-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .dashboard-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
        }
        .order-modal-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 860px) {
          .dashboard-two-col {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 480px) {
          .quick-actions-grid {
            grid-template-columns: 1fr;
          }
          .dashboard-header-row {
            flex-direction: column;
          }
          .order-modal-grid {
            grid-template-columns: 1fr;
          }
          .order-modal-overlay {
            padding: 0 !important;
            align-items: flex-end !important;
          }
          .order-modal-panel {
            max-width: 100% !important;
            max-height: 92vh !important;
            border-radius: 16px 16px 0 0 !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="dashboard-header-row">
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
            {branch.name} Branch
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
            flexWrap: "wrap",
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
        <div className="cycle-scroll">
          {CYCLE_STEPS.map(({ label, icon: Icon }, i) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
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
                <ArrowRight size={15} strokeWidth={2} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="dashboard-stats-grid">
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
              {!summaryLoading && change !== "–" && (
                <span
                  className={up ? "stat-change" : "stat-change down"}
                  style={{ display: "flex", alignItems: "center", gap: 2, fontWeight: 500 }}
                >
                  {change}
                  {up ? <ArrowUpRight size={13} strokeWidth={2} /> : <ArrowDownRight size={13} strokeWidth={2} />}
                </span>
              )}
            </div>

            <div style={{ margin: "10px 0 0" }}>
              {summaryLoading ? (
                <Skeleton width={70} height={24} />
              ) : (
                <p className="stat-value" style={{ margin: 0, fontWeight: 600, fontSize: "1.6rem" }}>
                  {value}
                </p>
              )}
            </div>

            <p className="stat-label" style={{ margin: 0, fontWeight: 500 }}>
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Low stock + Quick actions */}
      <div className="dashboard-two-col">
        {/* Low stock */}
        <div className="card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <h3 style={{ fontSize: "0.95rem", fontWeight: 600, margin: 0 }}>Low Stock</h3>
            {!lowStockLoading && totalLowStock > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--color-text-muted)",
                    background: "var(--color-bg-soft)",
                    padding: "4px 10px",
                    borderRadius: 999,
                  }}
                >
                  {totalLowStock} total
                </span>
                {outOfStockCount > 0 && (
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
                    {outOfStockCount} out of stock
                  </span>
                )}
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {lowStockLoading &&
              Array.from({ length: PREVIEW_ROWS }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "var(--color-bg-soft)",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <Skeleton width={140} height={12} />
                    <Skeleton width={90} height={10} />
                  </div>
                  <Skeleton width={28} height={16} />
                </div>
              ))}

            {!lowStockLoading && (lowStockError || totalLowStock === 0) && (
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                {lowStockError ? "Could not load low stock alerts" : "No low stock alerts right now"}
              </p>
            )}

            {!lowStockLoading &&
              visibleLowStock.map((item, i) => (
                <div
                  key={`${item.itemName}-${item.branchName}-${i}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "var(--color-bg-soft)",
                    gap: 10,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.88rem",
                        fontWeight: 600,
                        color: "var(--color-text)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.itemName}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                      min {item.reorderThreshold} {item.unit} · {item.branchName}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: item.status === "OUT_OF_STOCK" ? "#E10B1C" : "#a07a00",
                      flexShrink: 0,
                    }}
                  >
                    {item.currentQuantity}
                  </span>
                </div>
              ))}

            {!lowStockLoading && totalLowStock > PREVIEW_ROWS && (
              <button
                onClick={() => router.push(LOW_STOCK_HREF)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-primary)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  padding: "6px 0 0",
                  textAlign: "left",
                }}
              >
                View more ({totalLowStock - PREVIEW_ROWS} more)
              </button>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="card">
          <h3 style={{ fontSize: "0.95rem", fontWeight: 600, margin: "0 0 14px" }}>Quick Actions</h3>
          <div className="quick-actions-grid">
            {QUICK_ACTIONS.map(({ label, icon: Icon, bg, color, href }) => (
              <button
                key={label}
                onClick={() => href && router.push(href)}
                disabled={!href}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "14px 12px",
                  borderRadius: 10,
                  border: "1px solid var(--color-border)",
                  background: "#fff",
                  cursor: href ? "pointer" : "not-allowed",
                  opacity: href ? 1 : 0.55,
                  fontFamily: "var(--font-sans)",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (href) (e.currentTarget as HTMLButtonElement).style.background = "var(--color-bg-soft)";
                }}
                onMouseLeave={(e) => {
                  if (href) (e.currentTarget as HTMLButtonElement).style.background = "#fff";
                }}
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
            onClick={() => router.push("/audit-logs")}
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
          {activityLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "14px 20px",
                  borderBottom: i < 3 ? "1px solid var(--color-border)" : "none",
                }}
              >
                <Skeleton width={30} height={30} radius={999} style={{ flexShrink: 0 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                  <Skeleton width="60%" height={12} />
                  <Skeleton width="35%" height={10} />
                </div>
              </div>
            ))}

          {!activityLoading && (activityError || !Array.isArray(activity) || activity.length === 0) && (
            <p style={{ padding: "14px 20px", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              {activityError ? "Could not load recent activity" : "No recent activity available"}
            </p>
          )}

          {!activityLoading &&
            Array.isArray(activity) &&
            activity.map((item, i) => (
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
                  {item.userName.charAt(0)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 500, color: "var(--color-text)" }}>
                    {item.userName} {actionLabel(item.action)} {item.item}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    {timeAgo(item.timestamp)} · {item.branch}
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
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 600, margin: 0 }}>Recent Orders</h3>
            {!ordersLoading && totalOrders > 0 && (
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  background: "var(--color-bg-soft)",
                  padding: "3px 9px",
                  borderRadius: 999,
                }}
              >
                {totalOrders} total
              </span>
            )}
          </div>
          <button
            onClick={() => router.push(ORDERS_HREF)}
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
              {ordersLoading &&
                Array.from({ length: PREVIEW_ROWS }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j}>
                        <Skeleton width={j === 7 ? 20 : "80%"} height={12} />
                      </td>
                    ))}
                  </tr>
                ))}

              {!ordersLoading && (ordersError || totalOrders === 0) && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 20, color: "var(--color-text-muted)" }}>
                    {ordersError ? "Could not load recent orders" : "No order data available"}
                  </td>
                </tr>
              )}

              {!ordersLoading &&
                visibleOrders.map((order) => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 600, color: "var(--color-text)" }}>{order.orderNumber}</td>
                    <td style={{ fontWeight: 400 }}>
                      {order.customer?.fullName ?? order.guestName ?? "–"}
                    </td>
                    <td style={{ fontWeight: 400 }}>{order.items?.length ?? 0}</td>
                    <td style={{ fontWeight: 500, color: "var(--color-text)" }}>
                      {formatNaira(order.totalAmount)}
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
                        aria-label={`View order ${order.orderNumber}`}
                        onClick={() => setSelectedOrder(order)}
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

        {!ordersLoading && totalOrders > PREVIEW_ROWS && (
          <div style={{ padding: "12px 20px", borderTop: "1px solid var(--color-border)" }}>
            <button
              onClick={() => router.push(ORDERS_HREF)}
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
              View more ({totalOrders - PREVIEW_ROWS} more)
            </button>
          </div>
        )}
      </div>

      {/* Order details modal */}
      {selectedOrder && (
        <div
          className="order-modal-overlay"
          onClick={() => setSelectedOrder(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            className="order-modal-panel"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Order ${selectedOrder.orderNumber} details`}
            style={{
              background: "#fff",
              borderRadius: 14,
              width: "100%",
              maxWidth: 640,
              maxHeight: "88vh",
              overflowY: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                padding: "18px 22px",
                borderBottom: "1px solid var(--color-border)",
                position: "sticky",
                top: 0,
                background: "#fff",
                zIndex: 1,
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    color: "var(--color-text-muted)",
                    textTransform: "uppercase",
                  }}
                >
                  Order
                </p>
                <h3 style={{ margin: "2px 0 0", fontSize: "1.05rem", fontWeight: 700, color: "var(--color-heading)" }}>
                  {selectedOrder.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                aria-label="Close"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-text-muted)",
                  padding: 6,
                  borderRadius: 8,
                  flexShrink: 0,
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Status badges */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <span className={STATUS_CLASS[selectedOrder.status] ?? "badge"}>{selectedOrder.status}</span>
                <span className="badge">{formatOrderType(selectedOrder.orderType)}</span>
                <span className="badge">{selectedOrder.paymentStatus}</span>
              </div>

              {/* Customer + meta */}
              <div className="order-modal-grid">
                <div>
                  <p style={modalLabelStyle}>Customer</p>
                  <p style={{ ...modalValueStyle, display: "flex", alignItems: "center", gap: 6 }}>
                    <UserIcon size={13} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                    {selectedOrder.customer?.fullName ?? selectedOrder.guestName ?? "–"}
                  </p>
                  <p style={modalSubValueStyle}>{selectedOrder.customer?.phone ?? selectedOrder.guestPhone ?? "–"}</p>
                  <p style={modalSubValueStyle}>{selectedOrder.customer?.email ?? selectedOrder.guestEmail ?? "–"}</p>
                </div>
                <div>
                  <p style={modalLabelStyle}>Placed</p>
                  <p style={modalValueStyle}>{formatDateTime(selectedOrder.createdAt)}</p>
                  {selectedOrder.completedAt && (
                    <>
                      <p style={modalLabelStyle}>Completed</p>
                      <p style={modalValueStyle}>{formatDateTime(selectedOrder.completedAt)}</p>
                    </>
                  )}
                  {selectedOrder.cancelledAt && (
                    <>
                      <p style={modalLabelStyle}>Cancelled</p>
                      <p style={modalValueStyle}>{formatDateTime(selectedOrder.cancelledAt)}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Delivery address, delivery orders only */}
              {selectedOrder.orderType === "DELIVERY" && (
                <div>
                  <p style={modalLabelStyle}>Delivery Address</p>
                  <p style={{ ...modalValueStyle, display: "flex", alignItems: "flex-start", gap: 6 }}>
                    <MapPin size={13} strokeWidth={1.8} style={{ flexShrink: 0, marginTop: 2 }} />
                    {[
                      selectedOrder.deliveryAddressLine1,
                      selectedOrder.deliveryAddressLine2,
                      selectedOrder.deliveryCity,
                      selectedOrder.deliveryState,
                      selectedOrder.deliveryCountry,
                    ]
                      .filter(Boolean)
                      .join(", ") || "–"}
                  </p>
                  {selectedOrder.deliveryInstructions && (
                    <p style={modalSubValueStyle}>{selectedOrder.deliveryInstructions}</p>
                  )}
                </div>
              )}

              {/* Items */}
              <div>
                <p style={modalLabelStyle}>Items ({selectedOrder.items?.length ?? 0})</p>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {(selectedOrder.items ?? []).map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        padding: "8px 0",
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)" }}>
                          {item.quantity}× {item.nameSnapshot}
                        </p>
                        {item.notes && (
                          <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                            {item.notes}
                          </p>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 500, color: "var(--color-text)", flexShrink: 0 }}>
                        {formatNaira(item.totalPrice)}
                      </p>
                    </div>
                  ))}
                  {(!selectedOrder.items || selectedOrder.items.length === 0) && (
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>No items on this order</p>
                  )}
                </div>
              </div>

              {/* Totals */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 8, borderTop: "1px solid var(--color-border)" }}>
                <TotalsRow label="Subtotal" value={formatNaira(selectedOrder.subtotalAmount)} />
                <TotalsRow label="Tax" value={formatNaira(selectedOrder.taxAmount)} />
                <TotalsRow label="Delivery Fee" value={formatNaira(selectedOrder.deliveryFeeAmount)} />
                {Number(selectedOrder.discountAmount) > 0 && (
                  <TotalsRow label="Discount" value={`-${formatNaira(selectedOrder.discountAmount)}`} />
                )}
                <TotalsRow label="Total" value={formatNaira(selectedOrder.totalAmount)} bold />
              </div>

              {/* Payment */}
              <div>
                <p style={modalLabelStyle}>Payment</p>
                <p style={modalValueStyle}>
                  {formatPaymentMethod(selectedOrder.paymentMethod)} · {selectedOrder.paymentStatus}
                  {selectedOrder.paymentReference ? ` · ${selectedOrder.paymentReference}` : ""}
                </p>
              </div>

              {/* Notes */}
              {(selectedOrder.customerNotes || selectedOrder.kitchenNotes || selectedOrder.cancelReason) && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {selectedOrder.customerNotes && <NoteBlock label="Customer note" text={selectedOrder.customerNotes} />}
                  {selectedOrder.kitchenNotes && <NoteBlock label="Kitchen note" text={selectedOrder.kitchenNotes} />}
                  {selectedOrder.cancelReason && <NoteBlock label="Cancel reason" text={selectedOrder.cancelReason} />}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}