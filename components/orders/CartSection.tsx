"use client";

import { Plus, Minus, Trash2, Package } from "lucide-react";
import { CartItem, fmt } from "@/types/orders.types";

type Props = {
  cart: CartItem[];
  onAddItem: () => void;
  onChangeQty: (id: number, delta: number) => void;
  onRemove: (id: number) => void;
};

export default function CartSection({ cart, onAddItem, onChangeQty, onRemove }: Props) {
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-heading)" }}>
          Items [{cart.length}]
        </span>
        <button
          className="btn btn-primary"
          onClick={onAddItem}
          style={{ gap: 6, padding: "7px 14px" }}
        >
          <Plus size={14} strokeWidth={2.2} />
          Add Item
        </button>
      </div>

      {/* Empty state */}
      {cart.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "28px 0" }}>
          <Package size={28} strokeWidth={1.4} color="var(--color-text-muted)" />
          <p style={{ margin: 0, fontSize: "0.83rem", fontWeight: 400, color: "var(--color-text-muted)" }}>
            No items yet. Click &quot;Add Item&quot; to start.
          </p>
        </div>
      ) : (
        cart.map((item) => (
          <div
            key={item.id}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--color-border)" }}
          >
            <div>
              <p style={{ margin: 0, fontWeight: 500, fontSize: "0.875rem", color: "var(--color-text)" }}>{item.name}</p>
              <p style={{ margin: "2px 0 0", fontWeight: 400, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                {fmt(item.price)} · Stock: {item.stock}
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Qty controls */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() => onChangeQty(item.id, -1)}
                  style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid var(--color-border)", background: "var(--color-bg-soft)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <Minus size={12} strokeWidth={2} color="var(--color-text-secondary)" />
                </button>
                <span style={{ fontSize: "0.875rem", fontWeight: 500, minWidth: 16, textAlign: "center" }}>{item.qty}</span>
                <button
                  onClick={() => onChangeQty(item.id, 1)}
                  style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid var(--color-border)", background: "var(--color-bg-soft)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <Plus size={12} strokeWidth={2} color="var(--color-text-secondary)" />
                </button>
              </div>

              <span style={{ fontWeight: 500, fontSize: "0.875rem", color: "var(--color-text)", minWidth: 60, textAlign: "right" }}>
                {fmt(item.price * item.qty)}
              </span>

              <button
                onClick={() => onRemove(item.id)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", padding: 2, transition: "color 0.15s" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--color-primary)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)")}
              >
                <Trash2 size={14} strokeWidth={1.8} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}