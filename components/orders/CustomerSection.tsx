"use client";

import { Search, UserPlus, X } from "lucide-react";
import { Customer } from "@/types/orders.types";

type Props = {
  customers: Customer[];
  selected: Customer | null;
  search: string;
  onSearch: (v: string) => void;
  onSelect: (c: Customer) => void;
  onClear: () => void;
  onNewCustomer: () => void;
};

export default function CustomerSection({
  customers, selected, search, onSearch, onSelect, onClear, onNewCustomer,
}: Props) {
  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-heading)" }}>Customer</span>
        <button
          onClick={onNewCustomer}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
            borderRadius: 8, border: "none", background: "var(--color-secondary)",
            color: "#6b4c00", fontSize: "0.825rem", fontWeight: 500,
            cursor: "pointer", fontFamily: "var(--font-sans)",
          }}
        >
          <UserPlus size={14} strokeWidth={1.8} />
          New
        </button>
      </div>

      {selected ? (
        /* Selected customer chip */
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "var(--color-bg-soft)", borderRadius: 8 }}>
          <div>
            <p style={{ margin: 0, fontWeight: 500, fontSize: "0.875rem", color: "var(--color-text)" }}>{selected.name}</p>
            <p style={{ margin: "2px 0 0", fontWeight: 400, fontSize: "0.78rem", color: "var(--color-text-muted)" }}>{selected.phone}</p>
          </div>
          <button
            onClick={onClear}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", padding: 4 }}
          >
            <X size={15} strokeWidth={1.8} />
          </button>
        </div>
      ) : (
        <>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <Search size={14} strokeWidth={1.8} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
            <input
              className="input"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>

          {/* Customer list */}
          {filtered.map((c) => (
            <button
              key={c.phone + c.name}
              onClick={() => onSelect(c)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "flex-start",
                padding: "10px 14px", background: "var(--color-bg-soft)",
                borderRadius: 8, border: "none", cursor: "pointer", width: "100%",
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--color-bg-hover)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--color-bg-soft)")}
            >
              <span style={{ fontWeight: 500, fontSize: "0.875rem", color: "var(--color-text)" }}>{c.name}</span>
              <span style={{ fontWeight: 400, fontSize: "0.78rem", color: "var(--color-text-muted)" }}>{c.phone}</span>
            </button>
          ))}
        </>
      )}
    </div>
  );
}