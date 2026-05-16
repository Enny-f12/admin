"use client";

import { UserPlus, Clock, Package } from "lucide-react";
import { Order, STATUS_STYLE, fmt } from "@/types/orders.types";

type Props = {
  order: Order;
  onClose: () => void;
  onMarkReady: (id: string) => void;
};

export default function OrderDetailModal({ order, onClose, onMarkReady }: Props) {
  const total = order.items.reduce((s, i) => s + i.price, 0);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: "var(--color-bg-card)", borderRadius: 16, width: "100%", maxWidth: 500, padding: 28, display: "flex", flexDirection: "column", gap: 18 }}>

        {/* Header */}
        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--color-heading)" }}>
          Order {order.id}
        </h3>

        {/* Status + time */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span
            className="badge"
            style={{ background: STATUS_STYLE[order.status].bg, color: STATUS_STYLE[order.status].color }}
          >
            {order.status}
          </span>
          <span style={{ fontSize: "0.85rem", fontWeight: 400, color: "var(--color-text-muted)" }}>
            {order.time}
          </span>
        </div>

        {/* Customer info */}
        <div style={{ background: "var(--color-bg-soft)", borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { icon: <UserPlus size={14} strokeWidth={1.8} />, val: `${order.customer} · ${order.email}` },
            { icon: <Clock    size={14} strokeWidth={1.8} />, val: order.phone },
            { icon: <Package  size={14} strokeWidth={1.8} />, val: order.address },
          ].map(({ icon, val }, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.855rem", fontWeight: 400, color: "var(--color-text-secondary)" }}>
              <span style={{ color: "var(--color-secondary)", display: "flex", flexShrink: 0 }}>{icon}</span>
              {val}
            </div>
          ))}
        </div>

        {/* Order items */}
        <div style={{ background: "var(--color-bg-soft)", borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Package size={14} strokeWidth={1.8} color="var(--color-secondary)" />
            <span style={{ fontSize: "0.855rem", fontWeight: 600, color: "var(--color-text)" }}>Order Items</span>
          </div>
          {order.items.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
              <span style={{ fontWeight: 400, color: "var(--color-text-secondary)" }}>{item.name} x {item.qty}</span>
              <span style={{ fontWeight: 500, color: "var(--color-primary)" }}>{fmt(item.price)}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--color-border)", paddingTop: 8 }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--color-text)" }}>Total</span>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-primary)" }}>{fmt(total)}</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          {order.status === "Preparing" && (
            <button
              className="btn btn-primary"
              onClick={() => onMarkReady(order.id)}
              style={{ flex: 1, justifyContent: "center", padding: "11px" }}
            >
              Mark Ready
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "11px", borderRadius: 8,
              border: "1px solid var(--color-border)", background: "none",
              cursor: "pointer", fontSize: "0.855rem", fontWeight: 500,
              color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}