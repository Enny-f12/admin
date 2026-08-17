"use client";

import { useEffect, useState } from "react";
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
import { useBranch } from "../layout";
import { usePaymentsAdminStore } from "@/store/usePaymentStore";
import { PaymentMethod, ManualSaleLineItem } from "@/types/payment-admin.types";
import { SkeletonText } from "@/components/ui/Skeleton";

type Tab = "payments" | "pos" | "manual";

function formatMoney(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "–";
  const n = Number(value);
  return Number.isFinite(n) ? `₦${n.toLocaleString()}` : "–";
}

export default function PaymentsPage() {
  const branch = useBranch();
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
          <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "var(--color-primary)" }}>{branch.name} Branch</p>
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

      {tab === "payments" && <RecordPaymentsView branchId={branch.id} />}
      {tab === "pos" && <POSIntegrationView branchId={branch.id} />}
      {tab === "manual" && <ManualSaleEntryView branchId={branch.id} />}
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
function RecordPaymentsView({ branchId }: { branchId: string }) {
  const {
    loadedOrder, orderLookupLoading, orderLookupError, lookupOrder,
    recordPayment, isRecordingPayment,
  } = usePaymentsAdminStore();

  const [orderNum, setOrderNum] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [amountReceived, setAmountReceived] = useState(0);
  const [reference, setReference] = useState("");

  const total = loadedOrder ? Number(loadedOrder.totalAmount) : 0;
  const change = Math.max(0, amountReceived - total);
  const methodLabel = method === "POS" ? "POS (Moniepoint)" : method === "BANK_TRANSFER" ? "Bank Transfer" : "Cash";

  const submit = async () => {
    if (!loadedOrder) return;
    const ok = await recordPayment({
      orderId: loadedOrder.id,
      method,
      amountReceived,
      reference: method === "BANK_TRANSFER" ? reference || null : null,
    });
    if (ok) {
      setOrderNum("");
      setAmountReceived(0);
      setReference("");
      setMethod("CASH");
    }
  };

  return (
    <>
      <div style={{ padding: "14px 18px", borderRadius: 10, background: "rgba(225,11,28,0.06)", fontSize: "0.85rem", color: "var(--color-text)" }}>
        {/* TODO(BACKEND): no "last updated" signal on this screen yet — showing static label until an endpoint exists */}
        <strong>Last Updated:</strong> —
      </div>

      <div className="card">
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <Field label="Order #">
            <input className="input" placeholder="e.g. FHS-1778856693602-000" value={orderNum} onChange={(e) => setOrderNum(e.target.value)} style={{ minWidth: 260 }} />
          </Field>
          <button
            onClick={() => orderNum.trim() && lookupOrder(orderNum.trim(), branchId)}
            disabled={!orderNum.trim() || orderLookupLoading}
            style={{ ...outlineBtn, marginBottom: 14, opacity: !orderNum.trim() || orderLookupLoading ? 0.6 : 1 }}
          >
            {orderLookupLoading ? "Loading…" : "Load Order"}
          </button>
        </div>
      </div>

      {orderLookupLoading && (
        <div className="card">
          <SkeletonText width="30%" height={14} />
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            <SkeletonText width="60%" height={13} />
            <SkeletonText width="45%" height={13} />
            <SkeletonText width="50%" height={13} />
          </div>
        </div>
      )}

      {!orderLookupLoading && orderLookupError && (
        <div className="card">
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            {/* TODO(BACKEND): order lookup relies on GET /admin/orders?search — see Orders request doc #2 */}
            Could not look up order.
          </p>
        </div>
      )}

      {!orderLookupLoading && loadedOrder && (
        <>
          <div className="card">
            <p style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 14px", fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.03em", color: "var(--color-heading)" }}>
              <Package size={15} strokeWidth={1.8} color="var(--color-primary)" />
              ORDER SUMMARY
            </p>
            <p style={{ margin: "0 0 10px", fontSize: "0.9rem", color: "var(--color-text)" }}>
              Customer: {loadedOrder.customer?.fullName ?? loadedOrder.guestName ?? "–"}
            </p>
            <p style={{ margin: "0 0 6px", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)" }}>Items</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              {loadedOrder.items.map((i) => (
                <div key={i.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "var(--color-text)" }}>
                  <span>{i.nameSnapshot} x{i.quantity}</span>
                  <span>{formatMoney(i.totalPrice)}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid var(--color-border)", fontWeight: 700, color: "var(--color-heading)", marginBottom: 8 }}>
              <span>Total</span>
              <span>{formatMoney(loadedOrder.totalAmount)}</span>
            </div>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-primary)", fontWeight: 600 }}>
              Status: {loadedOrder.paymentStatus === "PENDING" ? "Pending Payment" : loadedOrder.paymentStatus}
            </p>
          </div>

          <div className="card">
            <p style={{ margin: "0 0 12px", fontSize: "0.9rem", fontWeight: 700, color: "var(--color-heading)" }}>Payment Method:</p>
            <RadioRow
              options={["Cash", "POS (Moniepoint)", "Bank Transfer"]}
              value={methodLabel}
              onChange={(v) => setMethod(v.startsWith("POS") ? "POS" : v === "Bank Transfer" ? "BANK_TRANSFER" : "CASH")}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
              <Field label="Amount Received">
                <input className="input" type="number" value={amountReceived} onChange={(e) => setAmountReceived(Number(e.target.value) || 0)} />
              </Field>
              <Field label="Change">
                <input className="input" value={formatMoney(change)} readOnly />
              </Field>
            </div>

            {method === "BANK_TRANSFER" && (
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
              <button
                onClick={() => { setOrderNum(""); setAmountReceived(0); setReference(""); }}
                style={{ ...outlineBtn, display: "flex", alignItems: "center", gap: 6 }}
              >
                <X size={14} strokeWidth={2} />
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{ padding: "10px 20px", fontSize: "0.85rem", opacity: isRecordingPayment ? 0.6 : 1 }}
                disabled={isRecordingPayment || amountReceived <= 0}
                onClick={submit}
              >
                {isRecordingPayment ? "Recording…" : "Confirm Payment & Close Order"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

/* ══════════════════════════ POS Integration ══════════════════════════ */
function POSIntegrationView({ branchId }: { branchId: string }) {
  const {
    posStatus, posStatusLoading, posStatusError, fetchPOSStatus,
    posOrders, posOrdersLoading, posOrdersError, fetchPOSOrders,
    toggleVerified, testConnection, isTestingConnection,
  } = usePaymentsAdminStore();

  useEffect(() => {
    fetchPOSStatus(branchId);
    fetchPOSOrders(branchId);
  }, [branchId, fetchPOSStatus, fetchPOSOrders]);

  return (
    <>
      <div>
        {posStatusLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <SkeletonText width="30%" height={14} />
            <SkeletonText width="45%" height={13} />
          </div>
        )}

        {!posStatusLoading && (posStatusError || !posStatus) && (
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            {/* TODO(BACKEND): GET /admin/pos-integration/status not implemented — see Payments request doc #2 */}
            POS status unavailable
          </p>
        )}

        {!posStatusLoading && posStatus && (
          <>
            <p style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 6px", fontSize: "0.9rem", color: "var(--color-text)" }}>
              <strong>Status:</strong>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: posStatus.connected ? "#16A34A" : "#E10B1C", display: "inline-block" }} />
              {posStatus.connected ? "Connected" : "Disconnected"}
            </p>
            <p style={{ margin: "0 0 10px", fontSize: "0.9rem", color: "var(--color-text)" }}>
              <strong>Last sync:</strong>{" "}
              {posStatus.lastSyncAt
                ? `${new Date(posStatus.lastSyncAt).toLocaleString()} - ${posStatus.syncedOrdersCount} orders synced`
                : "–"}
            </p>
            <p style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: "0.85rem", color: "var(--color-primary)" }}>
              <AlertTriangle size={14} strokeWidth={1.8} />
              If API is offline, use manual POS entry form below.
            </p>
          </>
        )}
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
              {posOrdersLoading && Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j}><SkeletonText width="60%" height={12} /></td>
                  ))}
                </tr>
              ))}

              {!posOrdersLoading && (posOrdersError || !posOrders?.length) && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 20, color: "var(--color-text-muted)" }}>
                    {/* TODO(BACKEND): GET /admin/pos-integration/orders not implemented — see Payments request doc #3 */}
                    No POS orders synced yet
                  </td>
                </tr>
              )}

              {!posOrdersLoading && !posOrdersError && posOrders?.map((o) => (
                <tr key={o.id}>
                  <td>{o.time}</td>
                  <td>{o.terminal}</td>
                  <td>{o.items}</td>
                  <td style={{ fontWeight: 600, color: "var(--color-text)" }}>{formatMoney(o.total)}</td>
                  <td>
                    <button
                      onClick={() => toggleVerified(o.id, !o.verified)}
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
                      {o.stockDeducted ? "Yes" : "No"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={testConnection} disabled={isTestingConnection} style={{ ...outlineBtn, opacity: isTestingConnection ? 0.6 : 1 }}>
          {isTestingConnection ? "Testing…" : "Test Connection"}
        </button>
        {/* TODO(BACKEND): "View POS Order History" — no dedicated history/pagination endpoint requested yet; button left unwired until scope is confirmed */}
        <button style={outlineBtn}>View POS Order History</button>
      </div>
    </>
  );
}

/* ══════════════════════════ Manual Sale Entry ══════════════════════════ */
function ManualSaleEntryView({ branchId }: { branchId: string }) {
  const { createManualSale, isCreatingSale, lastSaleId, emailReceipt, isEmailingReceipt } = usePaymentsAdminStore();

  const [customer, setCustomer] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [items, setItems] = useState<ManualSaleLineItem[]>([]);
  const [amountReceived, setAmountReceived] = useState(0);

  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const tax = Math.round(subtotal * 0.075);
  const total = subtotal + tax;
  const change = Math.max(0, amountReceived - total);
  const methodLabel = method === "POS" ? "POS (auto-sync)" : method === "BANK_TRANSFER" ? "Bank Transfer" : "Cash";

  const removeItem = (name: string) => setItems((prev) => prev.filter((i) => i.name !== name));
  const addItem = () => setItems((prev) => [...prev, { name: "New item", qty: 1, type: "Food", unitPrice: 0 }]);

  const submit = async () => {
    if (!items.length) return;
    // NOTE: ManualSale has no branchId column in the schema — branchId
    // is passed through here so the backend can start persisting it once
    // that migration lands, but today this sale record won't actually
    // be attributable to a specific branch server-side.
    await createManualSale({ customerName: customer, method, items, amountReceived }, branchId);
  };

  return (
    <>
      <div className="card">
        <Field label="Customer">
          <input className="input" value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Walk-in customer name" />
        </Field>
        <p style={{ margin: "0 0 12px", fontSize: "0.9rem", fontWeight: 700, color: "var(--color-heading)" }}>Payment Method:</p>
        <RadioRow
          options={["Cash", "POS (auto-sync)", "Bank Transfer"]}
          value={methodLabel}
          onChange={(v) => setMethod(v.startsWith("POS") ? "POS" : v === "Bank Transfer" ? "BANK_TRANSFER" : "CASH")}
        />
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
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 20, color: "var(--color-text-muted)" }}>
                    No items added yet
                  </td>
                </tr>
              )}
              {items.map((item, idx) => (
                <tr key={`${item.name}-${idx}`}>
                  <td style={{ fontWeight: 600, color: "var(--color-text)" }}>
                    <input
                      className="input"
                      value={item.name}
                      onChange={(e) => setItems((prev) => prev.map((i, ix) => (ix === idx ? { ...i, name: e.target.value } : i)))}
                      style={{ minWidth: 120 }}
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      type="number"
                      value={item.qty}
                      onChange={(e) => setItems((prev) => prev.map((i, ix) => (ix === idx ? { ...i, qty: Number(e.target.value) || 0 } : i)))}
                      style={{ width: 70 }}
                    />
                  </td>
                  <td>
                    <select
                      className="input"
                      value={item.type}
                      onChange={(e) => setItems((prev) => prev.map((i, ix) => (ix === idx ? { ...i, type: e.target.value as "Food" | "Drink" } : i)))}
                    >
                      <option>Food</option>
                      <option>Drink</option>
                    </select>
                  </td>
                  <td>
                    <input
                      className="input"
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => setItems((prev) => prev.map((i, ix) => (ix === idx ? { ...i, unitPrice: Number(e.target.value) || 0 } : i)))}
                      style={{ width: 90 }}
                    />
                  </td>
                  <td style={{ fontWeight: 600 }}>{formatMoney(item.qty * item.unitPrice)}</td>
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
            <span>Sub total:</span><span>{formatMoney(subtotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "var(--color-text)" }}>
            <span>Tax (7.5%):</span><span>{formatMoney(tax)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem", fontWeight: 700, color: "var(--color-heading)" }}>
            <span>Total:</span><span>{formatMoney(total)}</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <Field label="Amount Received">
            <input className="input" type="number" value={amountReceived} onChange={(e) => setAmountReceived(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Change">
            <input className="input" value={formatMoney(change)} readOnly />
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
          <button onClick={() => window.print()} disabled={!lastSaleId} style={{ ...outlineBtn, opacity: lastSaleId ? 1 : 0.5 }}>
            Print Receipt
          </button>
          <button onClick={emailReceipt} disabled={!lastSaleId || isEmailingReceipt} style={{ ...outlineBtn, opacity: lastSaleId ? 1 : 0.5 }}>
            {isEmailingReceipt ? "Sending…" : "Email Receipt"}
          </button>
          <button
            className="btn btn-primary"
            style={{ padding: "10px 20px", fontSize: "0.85rem", opacity: isCreatingSale || !items.length ? 0.6 : 1 }}
            disabled={isCreatingSale || !items.length}
            onClick={submit}
          >
            {isCreatingSale ? "Recording…" : "Record Sale"}
          </button>
        </div>
      </div>
    </>
  );
}