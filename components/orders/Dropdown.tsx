"use client";

import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";

type Props = {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  minWidth?: number | string;
};

export default function Dropdown({ options, value, onChange, minWidth = 160 }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative", minWidth }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "9px 12px",
          border: "1px solid var(--color-border)",
          borderRadius: 8,
          background: "var(--color-bg-input)",
          fontSize: "0.855rem",
          color: "var(--color-text)",
          cursor: "pointer",
          fontFamily: "var(--font-sans)",
          gap: 8,
        }}
      >
        <span>{value}</span>
        <ChevronDown size={14} strokeWidth={1.8} color="var(--color-text-muted)" />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 60,
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            overflow: "hidden",
          }}
        >
          {options.map((o) => (
            <button
              key={o}
              onClick={() => { onChange(o); setOpen(false); }}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "9px 14px",
                border: "none",
                background: o === value ? "var(--color-bg-soft)" : "transparent",
                color: o === value ? "var(--color-primary)" : "var(--color-text)",
                fontFamily: "var(--font-sans)",
                fontSize: "0.85rem",
                fontWeight: o === value ? 500 : 400,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
              onMouseEnter={(e) => {
                if (o !== value)
                  (e.currentTarget as HTMLButtonElement).style.background = "var(--color-bg-soft)";
              }}
              onMouseLeave={(e) => {
                if (o !== value)
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              {o}
              {o === value && <Check size={13} strokeWidth={2.2} color="var(--color-primary)" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}