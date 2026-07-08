"use client";

import { useState } from "react";
import {
  CalendarDays,
  DollarSign,
  CreditCard,
  FileText,
  AlertTriangle,
  Package,
  Plus,
  X,
  Check,
} from "lucide-react";

type Tab = "payments" | "pos" | "manual";
type PayMethod = "Cash" | "POS" | "Bank Transfer";

type LineItem = { name: string; qty: number; type: "Food" | "Drink"; unitPrice: number };

const ORDER_SUMMARY_ITEMS = [
  { name: "Jollof Rice x2",    price: 5000 },
  { name: "Grilled Chicken x1", price: 6000 },
  { name: "Can Coke x2",       price: 2000 },
];

const INITIAL_SALE_ITEMS: LineItem[] = [
  { name: "Jollof Rice", qty: 2, type: "Food",  unitPrice: 3000 },
  { name: "Beef",        qty: 2, type: "Food",  unitPrice: 2500 },
  { name: "Can Coke",    qty: 2, type: "Drink", unitPrice: 800  },
];

const POS_ORDERS = [
  { time: "10:15 AM", terminal: "T1", items: "Jollof x2", total: 6000, deducted: true,  verified: true  },
  { time: "10:00 AM", terminal: "T2", items: "Egusi x1",  total: 3500, deducted: true,  verified: false },
  { time: "09:45 AM", terminal: "T1", items: "Amala x1",  total: 1500, deducted: true,  verified: false },
];

export default function PaymentsPage() {
  const [tab, setTab] = useState<Tab>("payments");

  const heading =
    tab === "payments" ? "RECORD PAYMENTS" :
    tab === "pos"       ? "POS INTEGRATION STATUS - Moniepoint" :
    "Manual Sale Entry";

  const subtitle =
    tab === "payments" ? "Record payments and close transactions" :
    tab === "pos"       ? "Track POS payments" :
    "Record counter sale";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "var(--color-primary)" }}>Foodies 1 LEKKI</p>
          <h1 style={{ margin: "6px 0 0", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-heading)" }}>{heading}</h1>
          <p style={{ margin: "4px 0 0", fontSize: "0.875rem", color: "var(--color-text-muted)" }}>{subtitle}</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", border: "1px solid var(--color-border)", borderRadius: 8, background: "var(--color-bg-card)", fontSize: "0.825rem", color: "var(--color-text)" }}>
          <CalendarDays size={14} strokeWidth={1.8} color="var(--color-primary)" />
          Today
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <TabButton active={tab === "payments"} onClick={() => setTab("payments")} icon={<DollarSign size={16} strokeWidth={1.8} />} label="Payments" />
        <TabButton active={tab === "pos"} onClick={() => setTab("pos")} icon={<CreditCard size={16} strokeWidth={1.8} />} label="POS Integration" />
        <TabButton active={tab === "manual"} onClick={() => setTab("manual")} icon={<FileText size={16} strokeWidth={1.8} />} label="Manual Sale Entry" />
      </div>

      {tab === "payments" && <RecordPaymentsView />}
      {tab === "pos" && <POSIntegrationView />}
      {tab === "manual" && <ManualSaleEntryView />}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={active ? "btn btn-primary" : undefined}
      style={{
        display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 8,
        border: active ? "none" : "1px solid var(--color-border)",
        background: active ? undefined : "#fff",
        cursor: "pointer", fontSize: "0.85rem", fontWeight: 500,
        color: active ? undefined : "var(--color-text)", fontFamily: "var(--font-sans)",
      }}
    >
      {icon}
      {label}
    </button>
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

function RadioRow({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: "0.9rem", color: "var(--color-text)" }}
        >
          <span
            style={{
              width: 16, height: 16, borderRadius: "50%", border: `1.5px solid ${opt === value ? "var(--color-secondary)" : "var(--color-border)"}`,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}
          >
            {opt === value && <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--color-secondary)" }} />}
          </span>
          {opt}
        </button>
      ))}
    </div>
  );
}

const outlineBtn: React.CSSProperties = {
  padding: "10px 20px", borderRadius: 8, border: "1px solid var(--color-border)", background: "#fff",
  cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)", fontFamily: "var(--font-sans)",
};

/* ══════════════════════════ Record Payments ══════════════════════════ */
function RecordPaymentsView() {
  const [orderNum, setOrderNum] = useState("1234.............................");
  const [loaded, setLoaded] = useState(true);
  const [method, setMethod] = useState<PayMethod>("Cash");
  const [amountReceived, setAmountReceived] = useState(15000);
  const [reference, setReference] = useState("Trx 1234..............");

  const total = ORDER_SUMMARY_ITEMS.reduce((s, i) => s + i.price, 0);
  const change = Math.max(0, amountReceived - total);

  return (
    <>
      <div style={{ padding: "14px 18px", borderRadius: 10, background: "rgba(225,11,28,0.06)", fontSize: "0.85rem", color: "var(--color-text)" }}>
        <strong>Last Updated:</strong> Today, 8:35 AM by Sarah Johnson (Cashier)
      </div>

      <div className="card">
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <Field label="Order #">
            <input className="input" value={orderNum} onChange={(e) => setOrderNum(e.target.value)} style={{ minWidth: 260 }} />
          </Field>
          <button onClick={() => setLoaded(true)} style={{ ...outlineBtn, marginBottom: 14 }}>Load Order</button>
        </div>
      </div>

      {loaded && (
        <>
          <div className="card">
            <p style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 14px", fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.03em", color: "var(--color-heading)" }}>
              <Package size={15} strokeWidth={1.8} color="var(--color-primary)" />
              ORDER SUMMARY
            </p>
            <p style={{ margin: "0 0 10px", fontSize: "0.9rem", color: "var(--color-text)" }}>Customer: Sarah James</p>
            <p style={{ margin: "0 0 6px", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)" }}>Items</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              {ORDER_SUMMARY_ITEMS.map((i) => (
                <div key={i.name} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "var(--color-text)" }}>
                  <span>{i.name}</span>
                  <span>₦{i.price.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid var(--color-border)", fontWeight: 700, color: "var(--color-heading)", marginBottom: 8 }}>
              <span>Total</span>
              <span>₦{total.toLocaleString()}</span>
            </div>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-primary)", fontWeight: 600 }}>Status: Pending Payment</p>
          </div>

          <div className="card">
            <p style={{ margin: "0 0 12px", fontSize: "0.9rem", fontWeight: 700, color: "var(--color-heading)" }}>Payment Method:</p>
            <RadioRow options={["Cash", "POS (Moniepoint)", "Bank Transfer"]} value={method === "POS" ? "POS (Moniepoint)" : method} onChange={(v) => setMethod(v.startsWith("POS") ? "POS" : (v as PayMethod))} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
              <Field label="Amount Received">
                <input className="input" type="number" value={amountReceived} onChange={(e) => setAmountReceived(Number(e.target.value) || 0)} />
              </Field>
              <Field label="Change">
                <input className="input" value={`₦${change.toLocaleString()}`} readOnly />
              </Field>
            </div>

            {method === "Bank Transfer" && (
              <Field label="Payment Reference (if transfer)">
                <input className="input" value={reference} onChange={(e) => setReference(e.target.value)} />
              </Field>
            )}

            <div style={{ margin: "10px 0 20px" }}>
              <p style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 8px", fontSize: "0.88rem", fontWeight: 600, color: "var(--color-text)" }}>
                <AlertTriangle size={15} strokeWidth={1.8} color="var(--color-primary)" />
                Recording Payment will:
              </p>
              <ul style={{ margin: 0, paddingLeft: 34, display: "flex", flexDirection: "column", gap: 4 }}>
                {[
                  "Mark order as PAID",
                  "Deduct stock from inventory (food stock + drink fridge)",
                  "Print receipt",
                  "Send SMS confirmation to customer (if phone provided)",
                ].map((line) => (
                  <li key={line} style={{ fontSize: "0.85rem", fontStyle: "italic", color: "var(--color-primary)" }}>{line}</li>
                ))}
              </ul>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ ...outlineBtn, display: "flex", alignItems: "center", gap: 6 }}>
                <X size={14} strokeWidth={2} />
                Cancel
              </button>
              <button className="btn btn-primary" style={{ padding: "10px 20px", fontSize: "0.85rem" }}>
                Confirm Payment &amp; Close Order
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

/* ══════════════════════════ POS Integration ══════════════════════════ */
function POSIntegrationView() {
  const [orders, setOrders] = useState(POS_ORDERS);

  const toggleVerified = (i: number) =>
    setOrders((prev) => prev.map((o, idx) => (idx === i ? { ...o, verified: !o.verified } : o)));

  return (
    <>
      <div>
        <p style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 6px", fontSize: "0.9rem", color: "var(--color-text)" }}>
          <strong>Status:</strong>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#16A34A", display: "inline-block" }} />
          Connected
        </p>
        <p style={{ margin: "0 0 10px", fontSize: "0.9rem", color: "var(--color-text)" }}>
          <strong>Last sync:</strong> Today 10:23 AM - 12 orders synced
        </p>
        <p style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: "0.85rem", color: "var(--color-primary)" }}>
          <AlertTriangle size={14} strokeWidth={1.8} />
          If API is offline, use manual POS entry form below.
        </p>
      </div>

      <div className="card">
        <p style={{ margin: "0 0 14px", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.04em", color: "var(--color-text-muted)" }}>
          RECENT POS ORDERS SYNCED
        </p>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {["Time", "Terminal", "Items", "Total", "Stock Deducted"].map((c) => <th key={c}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => (
                <tr key={i}>
                  <td>{o.time}</td>
                  <td>{o.terminal}</td>
                  <td>{o.items}</td>
                  <td style={{ fontWeight: 600, color: "var(--color-text)" }}>₦{o.total.toLocaleString()}</td>
                  <td>
                    <button
                      onClick={() => toggleVerified(i)}
                      style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: "0.9rem", color: "var(--color-text)" }}
                    >
                      <span
                        style={{
                          width: 18, height: 18, borderRadius: "50%", border: "1.5px solid var(--color-border)",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}
                      >
                        {o.verified && <Check size={12} strokeWidth={2.5} color="var(--color-text)" />}
                      </span>
                      {o.deducted ? "Yes" : "No"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button style={outlineBtn}>Test Connection</button>
        <button style={outlineBtn}>View POS Order History</button>
      </div>
    </>
  );
}

/* ══════════════════════════ Manual Sale Entry ══════════════════════════ */
function ManualSaleEntryView() {
  const [customer, setCustomer] = useState("Sarah James");
  const [method, setMethod] = useState<PayMethod>("Cash");
  const [items, setItems] = useState<LineItem[]>(INITIAL_SALE_ITEMS);
  const [amountReceived, setAmountReceived] = useState(15000);

  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const tax = Math.round(subtotal * 0.075);
  const total = subtotal + tax;
  const change = Math.max(0, amountReceived - total);

  const removeItem = (name: string) => setItems((prev) => prev.filter((i) => i.name !== name));
  const addItem = () =>
    setItems((prev) => [...prev, { name: "New item", qty: 1, type: "Food", unitPrice: 0 }]);

  return (
    <>
      <div className="card">
        <Field label="Customer">
          <input className="input" value={customer} onChange={(e) => setCustomer(e.target.value)} />
        </Field>
        <p style={{ margin: "0 0 12px", fontSize: "0.9rem", fontWeight: 700, color: "var(--color-heading)" }}>Payment Method:</p>
        <RadioRow options={["Cash", "POS (auto-sync)", "Bank Transfer"]} value={method === "POS" ? "POS (auto-sync)" : method} onChange={(v) => setMethod(v.startsWith("POS") ? "POS" : (v as PayMethod))} />
      </div>

      <div className="card">
        <p style={{ margin: "0 0 14px", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.04em", color: "var(--color-text-muted)" }}>ITEMS</p>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {["Item", "Qty", "Type", "Unit Price", "Subtotal", "Actions"].map((c) => <th key={c}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.name}>
                  <td style={{ fontWeight: 600, color: "var(--color-text)" }}>{item.name}</td>
                  <td>{item.qty}</td>
                  <td>{item.type}</td>
                  <td>₦{item.unitPrice.toLocaleString()}</td>
                  <td style={{ fontWeight: 600 }}>₦{(item.qty * item.unitPrice).toLocaleString()}</td>
                  <td>
                    <button onClick={() => removeItem(item.name)} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid var(--color-border)", background: "#fff", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text)", fontFamily: "var(--font-sans)" }}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "16px 0 0" }}>
          <button
            onClick={addItem}
            className="btn btn-primary"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", fontSize: "0.85rem" }}
          >
            <Plus size={15} strokeWidth={2} />
            Add Item
          </button>
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "var(--color-text)" }}>
            <span>Sub total:</span><span>₦{subtotal.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "var(--color-text)" }}>
            <span>Tax (7.5%):</span><span>₦{tax.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem", fontWeight: 700, color: "var(--color-heading)" }}>
            <span>Total:</span><span>₦{total.toLocaleString()}</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <Field label="Amount Received">
            <input className="input" type="number" value={amountReceived} onChange={(e) => setAmountReceived(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Change">
            <input className="input" value={`₦${change.toLocaleString()}`} readOnly />
          </Field>
        </div>

        <div style={{ marginBottom: 20 }}>
          <p style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 8px", fontSize: "0.88rem", fontWeight: 600, color: "var(--color-text)" }}>
            <AlertTriangle size={15} strokeWidth={1.8} color="var(--color-primary)" />
            This sale will;
          </p>
          <ul style={{ margin: 0, paddingLeft: 34, display: "flex", flexDirection: "column", gap: 4 }}>
            {[
              "Deduct food items from FOOD inventory",
              "Deduct food items from FRIDGE inventory",
              "Create a sales record for accountant",
              "Log the transaction with your name as source",
            ].map((line) => (
              <li key={line} style={{ fontSize: "0.85rem", fontStyle: "italic", color: "var(--color-primary)" }}>{line}</li>
            ))}
          </ul>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button style={outlineBtn}>Print Receipt</button>
          <button style={outlineBtn}>Email Receipt</button>
          <button style={outlineBtn}>Record Sale</button>
        </div>
      </div>
    </>
  );
}