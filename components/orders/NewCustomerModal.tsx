"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Customer } from "@/types/orders.types";

type Props = {
  onClose: () => void;
  onCreate: (c: Customer) => void;
};

export default function NewCustomerModal({ onClose, onCreate }: Props) {
  const [form, setForm] = useState({ name: "", phone: "", email: "" });

  const handleCreate = () => {
    if (!form.name || !form.phone) return;
    onCreate({ name: form.name, phone: form.phone });
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: "var(--color-bg-card)", borderRadius: 16, width: "100%", maxWidth: 440, padding: 28, display: "flex", flexDirection: "column", gap: 18 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "var(--color-heading)" }}>
            Create New Customer
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", padding: 4 }}>
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        {/* Fields */}
        {([ 
          { label: "Full Name", key: "name"  as const, placeholder: "enter name...",         type: "text"  },
          { label: "Phone",     key: "phone" as const, placeholder: "enter phone number...", type: "tel"   },
          { label: "Email",     key: "email" as const, placeholder: "enter email...",        type: "email" },
        ]).map(({ label, key, placeholder, type }) => (
          <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>
              {label} <span style={{ color: "var(--color-primary)" }}>*</span>
            </label>
            <input
              className="input"
              type={type}
              placeholder={placeholder}
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            />
          </div>
        ))}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            style={{ flex: 1, justifyContent: "center", padding: "11px" }}
          >
            Create
          </button>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: "11px", borderRadius: 8, border: "1px solid var(--color-border)", background: "none", cursor: "pointer", fontSize: "0.855rem", fontWeight: 500, color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}