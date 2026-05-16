"use client";

import Dropdown from "./Dropdown";
import { ORDER_TYPES, PAYMENT_METHODS, OrderType } from "@/types/orders.types";

type Props = {
  orderType: OrderType;
  onOrderType: (v: OrderType) => void;
  payment: string;
  onPayment: (v: string) => void;
  notes: string;
  onNotes: (v: string) => void;
};

export default function OrderDetailsSection({
  orderType, onOrderType, payment, onPayment, notes, onNotes,
}: Props) {
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-heading)" }}>
        Order Details
      </span>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>
            Order Type
          </label>
          <Dropdown
            options={ORDER_TYPES}
            value={orderType}
            onChange={(v) => onOrderType(v as OrderType)}
            minWidth="100%"
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>
            Payment Method
          </label>
          <Dropdown
            options={PAYMENT_METHODS}
            value={payment || "Select...."}
            onChange={onPayment}
            minWidth="100%"
          />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>
          Notes (Optional)
        </label>
        <textarea
          className="input"
          placeholder="Special instructions....."
          rows={3}
          value={notes}
          onChange={(e) => onNotes(e.target.value)}
          style={{ resize: "vertical", lineHeight: 1.5 }}
        />
      </div>
    </div>
  );
}