"use client";

import {
  DollarSign,
  ShoppingBag,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Eye,
  Hand,
} from "lucide-react";

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

/* ── Data ── */
const STATS: StatCard[] = [
  { label: "Revenue Today",    value: "₦50,000", change: "+12%", up: true,  icon: DollarSign  },
  { label: "Orders Today",     value: "100",      change: "+8%",  up: true,  icon: ShoppingBag },
  { label: "Active Customers", value: "2,000",    change: "+5%",  up: true,  icon: Users       },
  { label: "Avg. Order Value", value: "₦60.40",   change: "-2%",  up: false, icon: TrendingUp  },
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
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Welcome */}
      <div>
        <h2
          style={{
            fontSize: "1.05rem",
            fontWeight: 600,
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "var(--color-heading)",
          }}
        >
          Welcome back!
          <Hand
            size={18}
            strokeWidth={1.8}
            color="var(--color-secondary)"
            style={{ flexShrink: 0 }}
          />
        </h2>
        <p
          style={{
            marginTop: 4,
            fontSize: "0.85rem",
            fontWeight: 400,
            color: "var(--color-text-muted)",
          }}
        >
          Here&apos;s what&apos;s happening today.
        </p>
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