"use client";

import { X } from "lucide-react";
import { MenuItem, fmt } from "@/types/orders.types";

type Props = {
  items: MenuItem[];
  onAdd: (item: MenuItem) => void;
  onClose: () => void;
};

export default function AddItemModal({ items, onAdd, onClose }: Props) {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{ background: "var(--color-bg-card)", borderRadius: 16, width: "100%", maxWidth: 440, padding: 24, display: "flex", flexDirection: "column", gap: 12, maxHeight: "80vh", overflowY: "auto" }}
        className="no-scrollbar"
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "var(--color-heading)" }}>Add Item</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", padding: 4 }}>
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onAdd(item)}
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 14px", borderRadius: 10,
              border: "1px solid var(--color-border)",
              background: item.stock === 0 ? "var(--color-bg-soft)" : "var(--color-bg-card)",
              cursor: item.stock === 0 ? "not-allowed" : "pointer",
              opacity: item.stock === 0 ? 0.6 : 1,
              transition: "border-color 0.12s",
            }}
            onMouseEnter={(e) => { if (item.stock > 0) (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-primary)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border)"; }}
          >
            <div style={{ textAlign: "left" }}>
              <p style={{ margin: 0, fontWeight: 500, fontSize: "0.875rem", color: "var(--color-text)" }}>{item.name}</p>
              <p style={{ margin: "2px 0 0", fontWeight: 400, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                Stock:{" "}
                {item.stock === 0
                  ? <span style={{ color: "var(--color-error)" }}>Out of stock</span>
                  : item.stock}
              </p>
            </div>
            <span style={{ fontWeight: 500, fontSize: "0.875rem", color: "var(--color-primary)" }}>
              {fmt(item.price)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}