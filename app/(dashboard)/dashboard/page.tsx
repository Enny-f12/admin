"use client";

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

/* ── Types ── */
type StatCard = {
  label: string;
  value: string;
  change: string;
  up: boolean;
  icon: React.ElementType;
};

type Order = {
  id: string;
  customer: string;
  items: string;
  amount: string;
  type: "Delivery" | "Pick Up";
  status: "Preparing" | "Ready" | "Delivered";
  time: string;
};

type LowStockItem = {
  name: string;
  min: string;
  count: string;
};

type ActivityItem = {
  initial: string;
  text: string;
  time: string;
  category: string;
};

/* ── Data ── */
const CYCLE_STEPS = [
  { label: "Inventory", icon: Box },
  { label: "Orders", icon: ClipboardList },
  { label: "Kitchen", icon: ChefHat },
  { label: "Payments", icon: CreditCard },
  { label: "Accounting", icon: Calculator },
  { label: "Audit", icon: FileText },
];

const STATS: StatCard[] = [
  { label: "Revenue Today",    value: "₦2.84M",  change: "+12%", up: true, icon: DollarSign   },
  { label: "Orders Today",     value: "127",     change: "+8%",  up: true, icon: ClipboardList },
  { label: "Active Customers", value: "3,456",   change: "+5%",  up: true, icon: Users        },
  { label: "System Health",    value: "99.8%",    change: "0",   up: true, icon: Activity      },
];

const LOW_STOCK: LowStockItem[] = [
  { name: "Coca-Cola 50cl (fridge)", min: "min 24", count: "4"   },
  { name: "Chicken Thighs",          min: "min 8",  count: "2.1" },
  { name: "Plantain",                min: "min 5",  count: "1"   },
  { name: "Tigernut (fridge)",       min: "min 24", count: "6"   },
];

const QUICK_ACTIONS = [
  { label: "Accounting", icon: Calculator,  bg: "rgba(225,11,28,0.08)",  color: "#E10B1C" },
  { label: "Audit Logs", icon: FileSearch,  bg: "rgba(37,99,235,0.08)",  color: "#2563EB" },
  { label: "User & Roles", icon: ShieldCheck, bg: "rgba(22,163,74,0.08)", color: "#16A34A" },
  { label: "Settings",   icon: Settings,    bg: "rgba(252,208,99,0.15)", color: "#a07a00" },
];

const RECENT_ACTIVITY: ActivityItem[] = [
  { initial: "K", text: "Kemi (Inventory) submitted morning count",              time: "8 minutes ago",  category: "Inventory" },
  { initial: "B", text: "Bola (Order Taker) sent order #FD-2847 to kitchen",     time: "12 minutes ago", category: "Orders"    },
  { initial: "P", text: "POS Terminal #2 synced ₦14,300 sale via Moniepoint",    time: "14 minutes ago", category: "Payments"  },
  { initial: "T", text: "Tunde (Cashier) closed transaction #TX-9921",          time: "30 minutes ago", category: "Payments"  },
  { initial: "M", text: "Manager received delivery from Farm Fresh Ltd",         time: "2 hours ago",    category: "Inventory" },
];

const ORDERS: Order[] = [
  { id: "#FD-2847", customer: "Sarah M.", items: "2 Items", amount: "₦20,000", type: "Delivery", status: "Preparing", time: "02:30 PM" },
  { id: "#FD-2846", customer: "Mike O.",  items: "1 Item",  amount: "₦15,000", type: "Pick Up",  status: "Ready",     time: "03:00 PM" },
  { id: "#FD-2845", customer: "Ada K.",   items: "3 Items", amount: "₦15,000", type: "Delivery", status: "Delivered", time: "10:00 AM" },
  { id: "#FD-2844", customer: "John C.",  items: "4 Items", amount: "₦20,000", type: "Pick Up",  status: "Delivered", time: "08:00 AM" },
];

const STATUS_CLASS: Record<Order["status"], string> = {
  Preparing: "badge badge-red",
  Ready:     "badge badge-yellow",
  Delivered: "badge badge-green",
};

export default function DashboardPage() {
  const branch = useBranch();

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
                background: "#16A34A",
                flexShrink: 0,
              }}
            />
            All systems operational
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
            POS synced 12s ago
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
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
            {/* Icon + change */}
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
              <span
                className={up ? "stat-change" : "stat-change down"}
                style={{ display: "flex", alignItems: "center", gap: 2, fontWeight: 500 }}
              >
                {change}
                {up
                  ? <ArrowUpRight size={13} strokeWidth={2} />
                  : <ArrowDownRight size={13} strokeWidth={2} />
                }
              </span>
            </div>

            {/* Value */}
            <p
              className="stat-value"
              style={{ margin: "10px 0 0", fontWeight: 600, fontSize: "1.6rem" }}
            >
              {value}
            </p>

            {/* Label */}
            <p className="stat-label" style={{ margin: 0, fontWeight: 500 }}>
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Low stock + Quick actions */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 16,
          alignItems: "start",
        }}
      >
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
            <h3 style={{ fontSize: "0.95rem", fontWeight: 600, margin: 0 }}>
              Low Stock
            </h3>
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
              5 critical
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {LOW_STOCK.map((item) => (
              <div
                key={item.name}
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
                    {item.name}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    {item.min}
                  </p>
                </div>
                <span style={{ fontSize: "1rem", fontWeight: 700, color: "#E10B1C" }}>
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="card">
          <h3 style={{ fontSize: "0.95rem", fontWeight: 600, margin: "0 0 14px" }}>
            Quick Actions
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
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
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background = "var(--color-bg-soft)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background = "#fff")
                }
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
                <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--color-text)" }}>
                  {label}
                </span>
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
          <h3 style={{ fontSize: "0.95rem", fontWeight: 600, margin: 0 }}>
            Recent Activity
          </h3>
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
          {RECENT_ACTIVITY.map((item, i) => (
            <div
              key={item.text}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "14px 20px",
                borderBottom:
                  i < RECENT_ACTIVITY.length - 1 ? "1px solid var(--color-border)" : "none",
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
                {item.initial}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 500, color: "var(--color-text)" }}>
                  {item.text}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                  {item.time} · {item.category}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent orders */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <h3 style={{ fontSize: "0.95rem", fontWeight: 600, margin: 0 }}>
            Recent Orders
          </h3>
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

        {/* Table */}
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {["Order ID", "Customer", "Items", "Total Amount", "Type", "Status", "Time", "Action"].map(
                  (col) => <th key={col}>{col}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {ORDERS.map((order) => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 600, color: "var(--color-text)" }}>
                    {order.id}
                  </td>
                  <td style={{ fontWeight: 400 }}>{order.customer}</td>
                  <td style={{ fontWeight: 400 }}>{order.items}</td>
                  <td style={{ fontWeight: 500, color: "var(--color-text)" }}>
                    {order.amount}
                  </td>
                  <td style={{ fontWeight: 400 }}>{order.type}</td>
                  <td>
                    <span className={STATUS_CLASS[order.status]}>
                      {order.status}
                    </span>
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
                      {order.time}
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
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLButtonElement).style.color = "var(--color-text)")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)")
                      }
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