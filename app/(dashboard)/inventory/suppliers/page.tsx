"use client";

import { useState } from "react";
import {
  Plus,
  X,
  Phone,
  MapPin,
  Building2,
  ChevronDown,
  Check,
} from "lucide-react";

type Payment = {
  date: string;
  invoice: string;
  amount: string;
  paid: boolean;
  reference: string;
};

type PurchaseOrder = {
  poNumber: string;
  date: string;
  items: string;
  status: string;
  deliveryDate: string;
};

type Supplier = {
  name: string;
  phone: string;
  address: string;
  deliveries: number;
  outstanding: number;
  payments: Payment[];
  purchaseOrders: PurchaseOrder[];
};

const SUPPLIERS: Supplier[] = [
  {
    name: "FARM FRESH LIMITED",
    phone: "+234 811 8888 999",
    address: "Mile 12 Market, Lagos",
    deliveries: 42,
    outstanding: 184000,
    payments: [
      { date: "May 10, 2026", invoice: "INV-123", amount: "₦70,000", paid: true, reference: "TRANSFER-005" },
      { date: "May 5, 2026",  invoice: "INV-120", amount: "₦48,000", paid: true, reference: "TRANSFER-001" },
    ],
    purchaseOrders: [
      { poNumber: "POOO6", date: "May 5, 2026", items: "Fish  x50",    status: "Delivered", deliveryDate: "May 10, 2026" },
      { poNumber: "POOO1", date: "May 1, 2026", items: "Chicken  x50", status: "Delivered", deliveryDate: "May 4, 2026"  },
    ],
  },
  {
    name: "LAGOS BEVERAGE CO.",
    phone: "+234 810 0000 345",
    address: "Apapa Industrial, Lagos",
    deliveries: 28,
    outstanding: 0,
    payments: [],
    purchaseOrders: [],
  },
  {
    name: "GOLDEN GRAIN",
    phone: "+234 812 8976 342",
    address: "Zone 9 Ikeja, Lagos",
    deliveries: 56,
    outstanding: 0,
    payments: [],
    purchaseOrders: [],
  },
  {
    name: "SPICE ROUTE IMPORTS",
    phone: "+234 811 6543 909",
    address: "2 Anthony Estate, Victoria Island, Lagos",
    deliveries: 15,
    outstanding: 10000,
    payments: [],
    purchaseOrders: [],
  },
  {
    name: "ZARTECH LTD",
    phone: "+234 811 1023 900",
    address: "26 Oluyole Estate Ibadan, Oyo",
    deliveries: 90,
    outstanding: 50000,
    payments: [],
    purchaseOrders: [],
  },
  {
    name: "LACASERA COMPANY PLC",
    phone: "+234 810 9087 234",
    address: "Apapa Industrial, Lagos",
    deliveries: 12,
    outstanding: 0,
    payments: [],
    purchaseOrders: [],
  },
];

export default function SuppliersPage() {
  const [suppliers] = useState(SUPPLIERS);
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [successName, setSuccessName] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "var(--color-primary)" }}>
            Foodies 1 LEKKI
          </p>
          <h1 style={{ margin: "6px 0 0", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-heading)" }}>
            SUPPLIERS
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            Vendor directory, deliveries and invoices
          </p>
        </div>

        <button
          onClick={() => setAddOpen(true)}
          className="btn btn-primary"
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", fontSize: "0.85rem" }}
        >
          <Plus size={16} strokeWidth={2} />
          Add Supplier
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        {suppliers.map((s) => (
          <button
            key={s.name}
            onClick={() => setSelected(s)}
            className="card"
            style={{ textAlign: "left", cursor: "pointer", position: "relative", border: "1px solid var(--color-border)", background: "#fff" }}
          >
            {s.outstanding > 0 && (
              <span
                style={{
                  position: "absolute", top: 20, right: 20, padding: "5px 12px", borderRadius: 999,
                  border: "1px solid rgba(225,11,28,0.3)", background: "rgba(225,11,28,0.06)",
                  color: "var(--color-primary)", fontWeight: 700, fontSize: "0.8rem",
                }}
              >
                ₦{s.outstanding.toLocaleString()}
              </span>
            )}

            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div
                style={{
                  width: 38, height: 38, borderRadius: 8, background: "var(--color-secondary)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}
              >
                <Building2 size={18} strokeWidth={1.8} color="#7a5500" />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem", color: "var(--color-heading)" }}>{s.name}</p>
                <p style={{ display: "flex", alignItems: "center", gap: 6, margin: "4px 0 0", fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                  <Phone size={13} strokeWidth={1.8} />
                  {s.phone}
                </p>
              </div>
            </div>

            <p style={{ display: "flex", alignItems: "center", gap: 6, margin: "10px 0 14px", fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
              <MapPin size={13} strokeWidth={1.8} />
              {s.address}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ padding: "12px 10px", borderRadius: 10, background: "var(--color-bg-soft)", textAlign: "center" }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "1rem", color: "var(--color-heading)" }}>{s.deliveries}</p>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>deliveries</p>
              </div>
              <div style={{ padding: "12px 10px", borderRadius: 10, background: "var(--color-bg-soft)", textAlign: "center" }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "1rem", color: s.outstanding > 0 ? "var(--color-primary)" : "var(--color-heading)" }}>
                  ₦{s.outstanding.toLocaleString()}
                </p>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>outstanding</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {selected && <SupplierDetailModal supplier={selected} onClose={() => setSelected(null)} />}

      {addOpen && (
        <AddSupplierModal
          onClose={() => setAddOpen(false)}
          onSaved={(name) => {
            setAddOpen(false);
            setSuccessName(name);
          }}
        />
      )}

      {successName && <SuccessModal name={successName} onClose={() => setSuccessName(null)} />}
    </div>
  );
}

/* ── Shared modal shell (scrollable, capped height) ── */
function ModalShell({ title, onClose, children, width = 700 }: { title?: string; onClose: () => void; children: React.ReactNode; width?: number }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        zIndex: 100, padding: "5vh 20px", overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width, maxWidth: "94vw", maxHeight: "88vh", background: "#fff", borderRadius: 14,
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        {title && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", flexShrink: 0, borderBottom: "1px solid var(--color-border)" }}>
            <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, letterSpacing: "0.01em", color: "var(--color-heading)" }}>{title}</h3>
            <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex" }}>
              <X size={18} />
            </button>
          </div>
        )}
        <div style={{ padding: title ? "20px 24px 24px" : 0, overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

/* ── Supplier detail modal ── */
function SupplierDetailModal({ supplier, onClose }: { supplier: Supplier; onClose: () => void }) {
  return (
    <ModalShell title={supplier.name} onClose={onClose}>
      <div style={{ padding: "14px 16px", borderRadius: 10, background: "var(--color-bg-soft)", display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.9rem", color: "var(--color-text)" }}>
          <Phone size={15} strokeWidth={1.8} color="var(--color-primary)" />
          {supplier.phone}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.9rem", color: "var(--color-text)" }}>
          <MapPin size={15} strokeWidth={1.8} color="var(--color-primary)" />
          {supplier.address}
        </span>
      </div>

      <p style={{ margin: "0 0 10px", fontSize: "0.95rem", fontWeight: 700, color: "var(--color-heading)" }}>
        Supplier Payment Tracking:
      </p>
      <div style={{ borderRadius: 10, background: "var(--color-bg-soft)", padding: "4px 16px", marginBottom: 24 }}>
        {supplier.payments.length === 0 ? (
          <p style={{ margin: "12px 0", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>No payment records yet.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Date", "Invoice #", "Amount", "Paid", "Reference"].map((c) => (
                  <th key={c} style={{ textAlign: "left", fontSize: "0.78rem", fontWeight: 600, color: "var(--color-text-muted)", padding: "12px 8px", borderBottom: "1px solid var(--color-border)" }}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {supplier.payments.map((p, i) => (
                <tr key={i}>
                  <td style={cellStyle}>{p.date}</td>
                  <td style={cellStyle}>{p.invoice}</td>
                  <td style={{ ...cellStyle, fontWeight: 600 }}>{p.amount}</td>
                  <td style={cellStyle}>{p.paid ? "Yes" : "No"}</td>
                  <td style={cellStyle}>{p.reference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p style={{ margin: "0 0 10px", fontSize: "0.95rem", fontWeight: 700, color: "var(--color-heading)" }}>
        Purchase Order History:
      </p>
      <div style={{ borderRadius: 10, background: "var(--color-bg-soft)", padding: "4px 16px" }}>
        {supplier.purchaseOrders.length === 0 ? (
          <p style={{ margin: "12px 0", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>No purchase orders yet.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["PO #", "Date", "Items", "Status", "Delivery Date"].map((c) => (
                  <th key={c} style={{ textAlign: "left", fontSize: "0.78rem", fontWeight: 600, color: "var(--color-text-muted)", padding: "12px 8px", borderBottom: "1px solid var(--color-border)" }}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {supplier.purchaseOrders.map((po, i) => (
                <tr key={i}>
                  <td style={cellStyle}>{po.poNumber}</td>
                  <td style={cellStyle}>{po.date}</td>
                  <td style={cellStyle}>{po.items}</td>
                  <td style={cellStyle}>{po.status}</td>
                  <td style={cellStyle}>{po.deliveryDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </ModalShell>
  );
}
const cellStyle: React.CSSProperties = { padding: "12px 8px", fontSize: "0.85rem", color: "var(--color-text)", borderBottom: "1px solid var(--color-border)" };

/* ── Add Supplier modal (Name/Type/Specify/Contact/Phone/Address) ── */
const SUPPLIER_TYPES = ["Food Supplier", "Beverage Supplier", "Packaging Supplier", "Other"];

function AddSupplierModal({ onClose, onSaved }: { onClose: () => void; onSaved: (name: string) => void }) {
  const [name, setName] = useState("Fresh farm limited");
  const [type, setType] = useState("");
  const [specify, setSpecify] = useState("+234 813 6666 888");
  const [contactPerson, setContactPerson] = useState("Mr. Adaralegbe");
  const [phone, setPhone] = useState("+234 813 6666 888");
  const [address, setAddress] = useState("Zone 9. Ajagbe Estate, Ogun State");

  return (
    <ModalShell title="Add New Supplier" onClose={onClose} width={460}>
      <Field label="Name">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>

      <Field label="Type">
        <div style={{ position: "relative" }}>
          <select className="input" value={type} onChange={(e) => setType(e.target.value)} style={{ appearance: "none", width: "100%" }}>
            <option value="">select type....</option>
            {SUPPLIER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDown size={16} strokeWidth={1.8} color="var(--color-text-muted)" style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        </div>
      </Field>

      {type === "Other" && (
        <Field label="Specfy Here">
          <input className="input" value={specify} onChange={(e) => setSpecify(e.target.value)} />
        </Field>
      )}

      <Field label="Contact Person">
        <input className="input" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
      </Field>
      <Field label="Phone">
        <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </Field>
      <Field label="Address">
        <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
      </Field>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button onClick={onClose} style={outlineBtn}>Cancel</button>
        <button
          className="btn btn-primary"
          style={{ padding: "9px 18px", fontSize: "0.85rem" }}
          onClick={() => onSaved(name)}
        >
          Save
        </button>
      </div>
    </ModalShell>
  );
}

/* ── Success confirmation ── */
function SuccessModal({ name, onClose }: { name: string; onClose: () => void }) {
  return (
    <ModalShell onClose={onClose} width={420}>
      <div style={{ padding: "40px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 6 }}>
        <div
          style={{
            width: 56, height: 56, borderRadius: "50%", background: "var(--color-primary)",
            display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10,
          }}
        >
          <Check size={28} strokeWidth={2.5} color="#fff" />
        </div>
        <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "var(--color-heading)" }}>
          New Supplier Added
        </h3>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-text-muted)" }}>{name}.</p>
      </div>
    </ModalShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
      <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)" }}>{label}</label>
      {children}
    </div>
  );
}

const outlineBtn: React.CSSProperties = {
  padding: "9px 18px", borderRadius: 8, border: "1px solid var(--color-border)", background: "#fff",
  cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)", fontFamily: "var(--font-sans)",
};