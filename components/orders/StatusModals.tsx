"use client";

import { X, TriangleAlert, Check } from "lucide-react";
import { MenuItem } from "@/types/orders.types";

/* ── Stock Warning ── */
type StockWarningProps = {
  item: MenuItem;
  onClose: () => void;
};

export function StockWarningModal({ item, onClose }: StockWarningProps) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 110, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "var(--color-bg-card)", borderRadius: 16, width: "100%", maxWidth: 420, padding: 28, display: "flex", flexDirection: "column", gap: 16 }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <TriangleAlert size={18} strokeWidth={1.8} color="var(--color-warning)" />
            <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--color-heading)" }}>Stock Warning</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", padding: 4 }}>
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 400, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
          <strong style={{ color: "var(--color-text)" }}>{item.name}</strong> is currently{" "}
          <span style={{ color: "var(--color-primary)", fontWeight: 500 }}>out of stock</span>.
          You cannot add this item to the order.
        </p>

        <button
          onClick={onClose}
          style={{ alignSelf: "flex-end", padding: "9px 20px", borderRadius: 8, border: "1px solid var(--color-border)", background: "none", cursor: "pointer", fontSize: "0.855rem", fontWeight: 500, color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ── Success ── */
type SuccessProps = {
  customerName: string;
  onClose: () => void;
};

export function SuccessModal({ customerName, onClose }: SuccessProps) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 110, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "var(--color-bg-card)", borderRadius: 16, width: "100%", maxWidth: 360, padding: 36, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>

        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(34,197,94,0.12)", border: "2px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Check size={24} strokeWidth={2.2} color="#16a34a" />
        </div>

        <div>
          <h3 style={{ margin: "0 0 6px", fontSize: "1.05rem", fontWeight: 600, color: "var(--color-heading)" }}>
            Order Created Successfully
          </h3>
          <p style={{ margin: 0, fontSize: "0.855rem", fontWeight: 400, color: "var(--color-text-muted)" }}>
            {customerName}.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={onClose}
          style={{ width: "100%", justifyContent: "center", padding: "11px", marginTop: 4 }}
        >
          View Orders
        </button>
      </div>
    </div>
  );
}