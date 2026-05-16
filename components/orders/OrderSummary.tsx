"use client";

import { Check } from "lucide-react";
import { fmt, TAX_RATE } from "@/types/orders.types";

type Props = {
  subtotal: number;
  canCreate: boolean;
  onCreate: () => void;
  onBack: () => void;
};

export default function OrderSummary({ subtotal, canCreate, onCreate, onBack }: Props) {
  const tax   = Math.round(subtotal * TAX_RATE);
  const total = subtotal + tax;

  return (
    <div style={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-heading)" }}>Summary</span>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { label: "Subtotal",   val: fmt(subtotal) },
            { label: "Tax (7.5%)", val: fmt(tax) },
          ].map(({ label, val }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 400, color: "var(--color-text-secondary)" }}>{label}</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 400, color: "var(--color-text)" }}>{val}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid var(--color-border)" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-heading)" }}>Total</span>
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-primary)" }}>{fmt(total)}</span>
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={onCreate}
          disabled={!canCreate}
          style={{ width: "100%", justifyContent: "center", padding: "12px", gap: 6, opacity: canCreate ? 1 : 0.55 }}
        >
          <Check size={15} strokeWidth={2.2} />
          Create Order
        </button>

        <button
          onClick={onBack}
          style={{
            width: "100%", padding: "9px", borderRadius: 8,
            border: "1px solid var(--color-border)", background: "none",
            cursor: "pointer", fontSize: "0.825rem", fontWeight: 500,
            color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)",
          }}
        >
          ← Back to Orders
        </button>
      </div>
    </div>
  );
}