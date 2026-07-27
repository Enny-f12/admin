"use client";

import { useEffect, useState } from "react";
import {
  ShoppingCart,
  SquarePen,
  AlertTriangle,
  Plus,
  Minus,
  X,
  Search,
  ChevronDown,
  Trash2,
  Check,
  UserPlus,
  CircleCheck,
  Package,
} from "lucide-react";
import { useWalkInStore } from "@/store/useWalkinStore";
import { useOrderStore } from "@/store/useOrderStore";
import { OrderStatus, OrderType, AdminOrder } from "@/types/orders";
import { WalkInCustomer, MenuItem } from "@/types/walk-in.types";
import { SkeletonText, SkeletonTableRows } from "@/components/ui/Skeleton";

type Tab = "create" | "edit" | "blacklist";
type CartItem = MenuItem & { qty: number };

const STATUS_OPTIONS: OrderStatus[] = ["RECEIVED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED", "COMPLETED", "CANCELLED"];

const STATUS_LABEL: Record<OrderStatus, string> = {
  RECEIVED: "Received",
  PREPARING: "Preparing",
  READY_FOR_PICKUP: "Ready for Pickup",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_CLASS: Record<OrderStatus, string> = {
  RECEIVED: "badge badge-yellow",
  PREPARING: "badge badge-red",
  READY_FOR_PICKUP: "badge badge-yellow",
  OUT_FOR_DELIVERY: "badge badge-yellow",
  DELIVERED: "badge badge-green",
  COMPLETED: "badge badge-green",
  CANCELLED: "badge badge-red",
};

const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  DINE_IN: "Dine-in",
  TAKEAWAY: "Pick Up",
  DELIVERY: "Delivery",
};

const PAGE_SIZE = 6;

function formatMoney(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "–";
  const n = Number(value);
  return Number.isFinite(n) ? `₦${n.toLocaleString()}` : "–";
}

export default function WalkInPage() {
  const [tab, setTab] = useState<Tab>("create");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, position: "relative" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "var(--color-primary)" }}>Foodies 1 LEKKI</p>
          <h1 style={{ margin: "6px 0 0", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-heading)" }}>MANUAL ORDER</h1>
          <p style={{ margin: "4px 0 0", fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            Create orders for call-in / walk-in customers
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <TabButton active={tab === "create"} onClick={() => setTab("create")} icon={<ShoppingCart size={16} strokeWidth={1.8} />} label="Create Order" />
        <TabButton active={tab === "edit"} onClick={() => setTab("edit")} icon={<SquarePen size={16} strokeWidth={1.8} />} label="Edit Existing" />
        <TabButton active={tab === "blacklist"} onClick={() => setTab("blacklist")} icon={<AlertTriangle size={16} strokeWidth={1.8} />} label="Blacklist" />
      </div>

      {tab === "create" && <CreateOrderView />}
      {tab === "edit" && <EditExistingView />}
      {tab === "blacklist" && <BlacklistView />}
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

function Dropdown({
  value, options, open, setOpen, onChange, placeholder, labelFor,
}: {
  value: string; options: string[]; open: boolean; setOpen: (v: boolean) => void; onChange: (v: string) => void;
  placeholder?: string; labelFor?: (v: string) => string;
}) {
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
          padding: "10px 14px", borderRadius: 8, border: "1px solid var(--color-border)", background: "#fff",
          cursor: "pointer", fontSize: "0.85rem", color: value ? "var(--color-text)" : "var(--color-text-muted)", fontFamily: "var(--font-sans)",
        }}
      >
        {value ? (labelFor ? labelFor(value) : value) : placeholder}
        <ChevronDown size={15} strokeWidth={1.8} color="var(--color-text-muted)" />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#fff", border: "1px solid var(--color-border)", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.10)", overflow: "hidden", zIndex: 60 }}>
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", padding: "10px 14px",
                background: opt === value ? "var(--color-bg-soft)" : "#fff", border: "none", cursor: "pointer",
                fontSize: "0.85rem", fontFamily: "var(--font-sans)", color: "var(--color-text)",
              }}
            >
              {opt === value && <Check size={13} strokeWidth={2} />}
              {labelFor ? labelFor(opt) : opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════ CREATE ORDER ══════════════════════════ */
function CreateOrderView() {
  const {
    customers, customersLoading, searchCustomers, createCustomer, isCreatingCustomer,
    menuItems, menuItemsLoading, searchMenuItems,
    createOrder, isCreatingOrder,
  } = useWalkInStore();

  const [customer, setCustomer] = useState<WalkInCustomer | null>(null);
  const [custSearch, setCustSearch] = useState("");
  const [newCustOpen, setNewCustOpen] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [stockWarnItem, setStockWarnItem] = useState<MenuItem | null>(null);

  const [orderType, setOrderType] = useState<OrderType>("DINE_IN");
  const [orderTypeOpen, setOrderTypeOpen] = useState(false);
  const [paymentChoice, setPaymentChoice] = useState<"" | "PENDING" | "PAID_CASH" | "PAID_TRANSFER">("");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [notes, setNotes] = useState("");

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!customer) searchCustomers(custSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [custSearch, customer]);

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = Math.round(subtotal * 0.075);
  const total = subtotal + tax;
  const canCreate = !!customer && cart.length > 0 && !!paymentChoice;

  const addToCart = (item: MenuItem) => {
    if (item.stock === 0) { setStockWarnItem(item); return; }
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      return existing
        ? prev.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c))
        : [...prev, { ...item, qty: 1 }];
    });
    setAddItemOpen(false);
  };

  const changeQty = (id: string, delta: number) =>
    setCart((prev) => prev.map((c) => (c.id === id ? { ...c, qty: Math.max(1, c.qty + delta) } : c)));

  const removeItem = (id: string) => setCart((prev) => prev.filter((c) => c.id !== id));

  const reset = () => {
    setCustomer(null); setCart([]); setOrderType("DINE_IN"); setPaymentChoice(""); setNotes("");
  };

  const paymentPayload = (): { paymentStatus: "PENDING" | "PAID"; paymentMethod: "CASH" | "BANK_TRANSFER" | null } => {
    if (paymentChoice === "PAID_CASH") return { paymentStatus: "PAID", paymentMethod: "CASH" };
    if (paymentChoice === "PAID_TRANSFER") return { paymentStatus: "PAID", paymentMethod: "BANK_TRANSFER" };
    return { paymentStatus: "PENDING", paymentMethod: null };
  };

  const submit = async (isDraft: boolean) => {
    if (!canCreate || !customer) return;
    const { paymentStatus, paymentMethod } = paymentPayload();
    const result = await createOrder({
      customerId: customer.id,
      newCustomer: null,
      items: cart.map((c) => ({ menuItemId: c.id, quantity: c.qty })),
      orderType,
      paymentStatus,
      paymentMethod,
      notes: notes || null,
      isDraft,
    });
    if (result) {
      setSuccessMessage(isDraft ? `Draft saved — ${result.orderNumber}` : `Order ${result.orderNumber} sent to kitchen`);
      reset();
    }
  };

  return (
    <>
      <div style={{ position: "absolute", top: 0, right: 0, display: "flex", gap: 10 }}>
        <button
          disabled={!canCreate || isCreatingOrder}
          onClick={() => submit(true)}
          style={{
            padding: "9px 18px", borderRadius: 8, border: "1px solid var(--color-border)", background: "#fff",
            cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)", fontFamily: "var(--font-sans)",
            opacity: !canCreate || isCreatingOrder ? 0.6 : 1,
          }}
        >
          Save Draft
        </button>
        <button
          disabled={!canCreate || isCreatingOrder}
          onClick={() => submit(false)}
          className="btn btn-primary"
          style={{ padding: "9px 18px", fontSize: "0.85rem", opacity: !canCreate || isCreatingOrder ? 0.6 : 1 }}
        >
          {isCreatingOrder ? "Sending…" : "Send to Kitchen"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: 2, minWidth: 320, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Customer */}
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--color-heading)" }}>Customer</h3>
              <button
                onClick={() => setNewCustOpen(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8,
                  border: "none", background: "var(--color-secondary)", color: "#7a5500", fontWeight: 600,
                  fontSize: "0.82rem", cursor: "pointer", fontFamily: "var(--font-sans)",
                }}
              >
                <UserPlus size={14} strokeWidth={1.8} />
                New
              </button>
            </div>

            {customer ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, color: "var(--color-text)" }}>{customer.fullName}</p>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>{customer.phone}</p>
                </div>
                <button onClick={() => setCustomer(null)} aria-label="Clear customer" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex" }}>
                  <X size={18} />
                </button>
              </div>
            ) : (
              <>
                <div style={{ position: "relative", marginBottom: 10 }}>
                  <Search size={16} strokeWidth={1.8} color="var(--color-text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    className="input"
                    placeholder="Search by name or phone"
                    value={custSearch}
                    onChange={(e) => setCustSearch(e.target.value)}
                    style={{ width: "100%", paddingLeft: 38 }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {customersLoading && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "8px 0" }}>
                      <SkeletonText width="60%" height={13} />
                      <SkeletonText width="45%" height={13} />
                    </div>
                  )}
                  {!customersLoading && (customers ?? []).length === 0 && (
                    <p style={{ margin: "8px 0", fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                      {/* TODO(BACKEND): GET /admin/customers not implemented — see request doc #1 */}
                      No customers found
                    </p>
                  )}
                  {!customersLoading && customers?.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setCustomer(c); setCustSearch(""); }}
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "10px 8px",
                        border: "none", borderBottom: "1px solid var(--color-border)", background: "none",
                        cursor: "pointer", textAlign: "left", fontFamily: "var(--font-sans)",
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--color-text)" }}>{c.fullName}</span>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{c.phone}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Items */}
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--color-heading)" }}>Items [{cart.length}]</h3>
              <button
                onClick={() => { setAddItemOpen(true); searchMenuItems(""); }}
                className="btn btn-primary"
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", fontSize: "0.82rem" }}
              >
                <Plus size={14} strokeWidth={2} />
                Add Item
              </button>
            </div>

            {cart.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "32px 0", color: "var(--color-text-muted)" }}>
                <Package size={26} strokeWidth={1.5} />
                <p style={{ margin: 0, fontSize: "0.85rem" }}>No items yet. Click &ldquo;Add Item&rdquo; to start.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {cart.map((item) => (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, background: "var(--color-bg-soft)" }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem", color: "var(--color-text)" }}>{item.name}</p>
                      <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                        {formatMoney(item.price)} • Stock: {item.stock}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button onClick={() => changeQty(item.id, -1)} style={qtyBtn}><Minus size={13} /></button>
                        <span style={{ minWidth: 18, textAlign: "center", fontWeight: 600, fontSize: "0.85rem" }}>{item.qty}</span>
                        <button onClick={() => changeQty(item.id, 1)} style={qtyBtn}><Plus size={13} /></button>
                      </div>
                      <span style={{ minWidth: 60, textAlign: "right", fontWeight: 600, fontSize: "0.9rem", color: "var(--color-text)" }}>
                        {formatMoney(item.price * item.qty)}
                      </span>
                      <button onClick={() => removeItem(item.id)} aria-label="Remove item" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-primary)", display: "flex" }}>
                        <Trash2 size={15} strokeWidth={1.8} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Details */}
          <div className="card">
            <h3 style={{ margin: "0 0 14px", fontSize: "0.95rem", fontWeight: 700, color: "var(--color-heading)" }}>Order Details</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Order Type">
                <Dropdown
                  value={orderType}
                  options={["DINE_IN", "TAKEAWAY", "DELIVERY"]}
                  open={orderTypeOpen}
                  setOpen={setOrderTypeOpen}
                  onChange={(v) => setOrderType(v as OrderType)}
                  labelFor={(v) => ORDER_TYPE_LABEL[v as OrderType]}
                />
              </Field>
              <Field label="Payment Status">
                <Dropdown
                  value={paymentChoice}
                  options={["PENDING", "PAID_CASH", "PAID_TRANSFER"]}
                  open={paymentOpen}
                  setOpen={setPaymentOpen}
                  onChange={(v) => setPaymentChoice(v as typeof paymentChoice)}
                  placeholder="Select...."
                  labelFor={(v) => (v === "PENDING" ? "Pending" : v === "PAID_CASH" ? "Paid (Cash)" : "Paid (Transfer)")}
                />
              </Field>
            </div>
            <Field label="Notes (Optional)">
              <textarea className="input" rows={3} placeholder="Special instructions....." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
          </div>
        </div>

        {/* Summary */}
        <div className="card" style={{ flex: 1, minWidth: 260, position: "sticky", top: 20 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: "0.95rem", fontWeight: 700, color: "var(--color-heading)" }}>Summary</h3>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", color: "var(--color-text)", marginBottom: 8 }}>
            <span>Subtotal</span>
            <span>{formatMoney(subtotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", color: "var(--color-text)", marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid var(--color-border)" }}>
            <span>Tax (7.5%)</span>
            <span>{formatMoney(tax)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "1rem", color: "var(--color-heading)", marginBottom: 20 }}>
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </div>
          <button
            disabled={!canCreate || isCreatingOrder}
            onClick={() => submit(false)}
            style={{
              width: "100%", padding: "12px 0", borderRadius: 8, border: "none",
              background: canCreate ? "var(--color-secondary)" : "rgba(252,208,99,0.4)",
              color: canCreate ? "#5c4200" : "#a08a55",
              fontWeight: 700, fontSize: "0.9rem", cursor: canCreate ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "var(--font-sans)",
            }}
          >
            <Check size={16} strokeWidth={2.5} />
            {isCreatingOrder ? "Creating…" : "Create Order"}
          </button>
        </div>
      </div>

      {addItemOpen && (
        <AddItemModal
          items={menuItems ?? []}
          loading={menuItemsLoading}
          onSearch={searchMenuItems}
          onAdd={addToCart}
          onOutOfStock={setStockWarnItem}
          onClose={() => setAddItemOpen(false)}
        />
      )}
      {stockWarnItem && <StockWarningModal item={stockWarnItem} onClose={() => setStockWarnItem(null)} />}
      {newCustOpen && (
        <NewCustomerModal
          isSubmitting={isCreatingCustomer}
          onClose={() => setNewCustOpen(false)}
          onCreate={async (payload) => {
            const created = await createCustomer(payload);
            if (created) { setCustomer(created); setNewCustOpen(false); }
          }}
        />
      )}
      {successMessage && <SuccessModal message={successMessage} onClose={() => setSuccessMessage(null)} />}
    </>
  );
}
const qtyBtn: React.CSSProperties = {
  width: 24, height: 24, borderRadius: 6, border: "1px solid var(--color-border)", background: "#fff",
  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
};

/* ══════════════════════════ EDIT EXISTING ══════════════════════════ */
// Reuses the live Orders endpoint/store — no separate "manual orders" list.
function EditExistingView() {
  const { orders, ordersLoading, ordersError, fetchOrders, updateOrderStatus, isUpdatingStatus } = useOrderStore();
  const [page, setPage] = useState(1);
  const [editOrder, setEditOrder] = useState<AdminOrder | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const totalPages = Math.max(1, Math.ceil((orders?.length ?? 0) / PAGE_SIZE));
  const paged = (orders ?? []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {["Order ID", "Customer", "Items", "Total Amount", "Type", "Status", "Action"].map((c) => <th key={c}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {ordersLoading && <SkeletonTableRows rows={PAGE_SIZE} columns={7} />}

            {!ordersLoading && ordersError && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "24px 0", color: "var(--color-text-muted)" }}>
                  Could not load orders
                </td>
              </tr>
            )}

            {!ordersLoading && !ordersError && paged.map((order) => (
              <tr key={order.id}>
                <td style={{ fontWeight: 600, color: "var(--color-text)" }}>{order.orderNumber}</td>
                <td>{order.customer?.fullName ?? order.guestName ?? "–"}</td>
                <td>{order.items.length} {order.items.length === 1 ? "Item" : "Items"}</td>
                <td style={{ fontWeight: 500, color: "var(--color-text)" }}>{formatMoney(order.totalAmount)}</td>
                <td>{ORDER_TYPE_LABEL[order.orderType]}</td>
                <td><span className={STATUS_CLASS[order.status]}>{STATUS_LABEL[order.status]}</span></td>
                <td>
                  <button
                    onClick={() => setEditOrder(order)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8,
                      border: "1px solid var(--color-border)", background: "#fff", cursor: "pointer",
                      fontSize: "0.82rem", fontWeight: 600, color: "var(--color-text)", fontFamily: "var(--font-sans)",
                    }}
                  >
                    <SquarePen size={13} strokeWidth={1.8} />
                    Edit
                  </button>
                </td>
              </tr>
            ))}

            {!ordersLoading && !ordersError && paged.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "24px 0", color: "var(--color-text-muted)" }}>
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 14, padding: "14px 20px", fontSize: "0.85rem" }}>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-primary)", fontWeight: 600 }}>Previous</button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button key={p} onClick={() => setPage(p)} style={{ width: 28, height: 28, borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, background: p === page ? "var(--color-secondary)" : "transparent", color: p === page ? "#7a5500" : "var(--color-text)" }}>{p}</button>
        ))}
        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-primary)", fontWeight: 600 }}>Next</button>
      </div>

      {editOrder && (
        <EditOrderModal
          order={editOrder}
          isSaving={isUpdatingStatus}
          onClose={() => setEditOrder(null)}
          onSave={async (id, status) => {
            const ok = await updateOrderStatus(id, { status });
            if (ok) setEditOrder(null);
          }}
        />
      )}
    </div>
  );
}

function EditOrderModal({
  order, isSaving, onClose, onSave,
}: { order: AdminOrder; isSaving: boolean; onClose: () => void; onSave: (id: string, status: OrderStatus) => void }) {
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [statusOpen, setStatusOpen] = useState(false);

  return (
    <ModalShell title={`Edit Order ${order.orderNumber}`} onClose={onClose}>
      <div style={{ padding: "14px 16px", borderRadius: 10, background: "var(--color-bg-soft)", marginBottom: 18 }}>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-text)" }}><strong>Customer:</strong> {order.customer?.fullName ?? order.guestName ?? "–"}</p>
        <p style={{ margin: "4px 0 0", fontSize: "0.9rem", color: "var(--color-text)" }}><strong>Status:</strong> {STATUS_LABEL[order.status]}</p>
      </div>

      <Field label="Update Status">
        <Dropdown
          value={status}
          options={STATUS_OPTIONS}
          open={statusOpen}
          setOpen={setStatusOpen}
          onChange={(v) => setStatus(v as OrderStatus)}
          labelFor={(v) => STATUS_LABEL[v as OrderStatus]}
        />
      </Field>

      <p style={{ margin: "0 0 20px", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)" }}>
        Add/Remove Items
        <br />
        <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>Items can be adjusted before order is marked Ready.</span>
      </p>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button onClick={onClose} style={outlineBtn}>Cancel</button>
        <button
          className="btn btn-primary"
          style={{ padding: "9px 18px", fontSize: "0.85rem", opacity: isSaving ? 0.6 : 1 }}
          disabled={isSaving}
          onClick={() => onSave(order.id, status)}
        >
          {isSaving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </ModalShell>
  );
}

/* ══════════════════════════ BLACKLIST ══════════════════════════ */
function BlacklistView() {
  const { blacklist, blacklistLoading, blacklistError, fetchBlacklist, removeFromBlacklist, addToBlacklist } = useWalkInStore();
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    fetchBlacklist();
  }, [fetchBlacklist]);

  return (
    <>
      <div className="card" style={{ border: "1px solid rgba(225,11,28,0.25)", background: "rgba(225,11,28,0.03)" }}>
        <p style={{ margin: "0 0 14px", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.04em", color: "var(--color-text-muted)" }}>
          BLACKLISTED CUSTOMERS
        </p>

        {blacklistLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "6px 0" }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <SkeletonText width="35%" height={14} />
                <SkeletonText width="55%" height={12} />
              </div>
            ))}
          </div>
        )}

        {!blacklistLoading && (blacklistError || !blacklist?.length) && (
          <p style={{ margin: "10px 0", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            {/* TODO(BACKEND): GET /admin/customers/blacklist not implemented — see request doc #5 */}
            No blacklisted customers.
          </p>
        )}

        {!blacklistLoading && !blacklistError && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {blacklist?.map((b, i) => (
              <div
                key={b.id}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0",
                  borderTop: i > 0 ? "1px solid rgba(225,11,28,0.15)" : "none",
                }}
              >
                <div>
                  <p style={{ margin: 0, fontWeight: 600, color: "var(--color-text)" }}>{b.name}</p>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>{b.phone} • {b.reason}</p>
                </div>
                <button
                  onClick={() => removeFromBlacklist(b.id)}
                  style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid var(--color-border)", background: "#fff", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, color: "var(--color-text)", fontFamily: "var(--font-sans)" }}
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => setAddOpen(true)}
        style={{
          display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 8,
          border: "1px solid rgba(225,11,28,0.3)", background: "#fff", color: "var(--color-primary)",
          fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", fontFamily: "var(--font-sans)", width: "fit-content",
        }}
      >
        <AlertTriangle size={15} strokeWidth={1.8} />
        Add to Blacklist
      </button>

      {addOpen && (
        <AddToBlacklistModal
          onClose={() => setAddOpen(false)}
          onSubmit={async (payload) => {
            const ok = await addToBlacklist(payload);
            if (ok) setAddOpen(false);
          }}
        />
      )}
    </>
  );
}

function AddToBlacklistModal({
  onClose, onSubmit,
}: { onClose: () => void; onSubmit: (payload: { customerId: string; reason: string }) => void }) {
  const { customers, customersLoading, searchCustomers } = useWalkInStore();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<WalkInCustomer | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!selected) searchCustomers(search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selected]);

  const canSubmit = !!selected && reason.trim().length > 0;

  return (
    <ModalShell title="ADD TO BLACKLIST" onClose={onClose}>
      <Field label="Customer">
        {selected ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 8, background: "var(--color-bg-soft)" }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem", color: "var(--color-text)" }}>{selected.fullName}</p>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{selected.phone}</p>
            </div>
            <button onClick={() => setSelected(null)} aria-label="Clear" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <input className="input" placeholder="search customer" value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: 8 }} />
            {customersLoading && <SkeletonText width="50%" height={13} />}
            {!customersLoading && (customers ?? []).map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 4px", border: "none", background: "none", cursor: "pointer", fontFamily: "var(--font-sans)" }}
              >
                <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--color-text)" }}>{c.fullName}</span>{" "}
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{c.phone}</span>
              </button>
            ))}
          </>
        )}
      </Field>

      <Field label="Reason*">
        <textarea
          className="input"
          rows={3}
          placeholder="e.g, Repeated Chargebacks, abusive behaviour....."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </Field>

      <p style={{ margin: "0 0 20px", fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
        This customer will be blocked from placing future orders.
      </p>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button onClick={onClose} style={outlineBtn}>Cancel</button>
        <button
          disabled={!canSubmit}
          className="btn btn-primary"
          style={{ padding: "9px 18px", fontSize: "0.85rem", opacity: canSubmit ? 1 : 0.5, cursor: canSubmit ? "pointer" : "not-allowed" }}
          onClick={() => selected && onSubmit({ customerId: selected.id, reason })}
        >
          Blacklist
        </button>
      </div>
    </ModalShell>
  );
}

/* ══════════════════════════ Shared modals ══════════════════════════ */
function ModalShell({ title, onClose, children, width = 460 }: { title: string; onClose: () => void; children: React.ReactNode; width?: number }) {
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px", overflowY: "auto" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width, maxWidth: "92vw", maxHeight: "88vh", background: "#fff", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", flexShrink: 0, borderBottom: "1px solid var(--color-border)" }}>
          <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--color-heading)" }}>{title}</h3>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex" }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: "20px 24px 24px", overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

function AddItemModal({
  items, loading, onSearch, onAdd, onOutOfStock, onClose,
}: {
  items: MenuItem[]; loading: boolean; onSearch: (search: string) => void;
  onAdd: (item: MenuItem) => void; onOutOfStock: (item: MenuItem) => void; onClose: () => void;
}) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => onSearch(search), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const stockLabel = (stock: number) => {
    if (stock === 0) return { text: "Out", color: "#E10B1C", bg: "rgba(225,11,28,0.08)" };
    if (stock <= 5) return { text: `${stock} left`, color: "#a07a00", bg: "rgba(252,208,99,0.15)" };
    return { text: `${stock} left`, color: "#16A34A", bg: "rgba(22,163,74,0.08)" };
  };

  return (
    <ModalShell title="Add Item" onClose={onClose} width={520}>
      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={16} strokeWidth={1.8} color="var(--color-text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
        <input className="input" placeholder="Search menu..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: "100%", paddingLeft: 38 }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "8px 0" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <SkeletonText width={42} height={42} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <SkeletonText width="50%" height={13} />
                  <SkeletonText width="30%" height={11} />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && items.length === 0 && (
          <p style={{ margin: "12px 4px", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            {/* TODO(BACKEND): GET /admin/menu-items not implemented — see request doc #3 */}
            No menu items found
          </p>
        )}

        {!loading && items.map((item) => {
          const s = stockLabel(item.stock);
          return (
            <button
              key={item.id}
              onClick={() => (item.stock === 0 ? onOutOfStock(item) : onAdd(item))}
              style={{
                display: "flex", alignItems: "center", gap: 14, padding: "12px 4px", border: "none",
                borderTop: "1px solid var(--color-border)", background: "none", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-sans)",
              }}
            >
              <div style={{ width: 42, height: 42, borderRadius: 8, background: "var(--color-bg-soft)", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem", color: "var(--color-text)" }}>{item.name}</p>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-text-muted)" }}>{formatMoney(item.price)}</p>
              </div>
              <span style={{ padding: "4px 10px", borderRadius: 999, fontSize: "0.75rem", fontWeight: 600, color: s.color, background: s.bg }}>
                {s.text}
              </span>
            </button>
          );
        })}
      </div>
    </ModalShell>
  );
}

function StockWarningModal({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  return (
    <ModalShell title="" onClose={onClose} width={460}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: -44, marginBottom: 18 }}>
        <AlertTriangle size={20} strokeWidth={1.8} color="#a07a00" />
        <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--color-heading)" }}>Stock Warning</h3>
      </div>
      <p style={{ margin: "0 0 22px", fontSize: "0.9rem", color: "var(--color-text)" }}>
        <strong>{item.name}</strong> is currently <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>out of stock</span>. You cannot add this item to the order.
      </p>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={onClose} style={outlineBtn}>Cancel</button>
      </div>
    </ModalShell>
  );
}

function NewCustomerModal({
  isSubmitting, onClose, onCreate,
}: { isSubmitting: boolean; onClose: () => void; onCreate: (payload: { name: string; phone: string; email: string }) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const canSubmit = name.trim() && phone.trim() && email.trim();

  return (
    <ModalShell title="Create New Customer" onClose={onClose}>
      <Field label="Full Name *">
        <input className="input" placeholder="enter name..." value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Phone *">
        <input className="input" placeholder="enter phone number..." value={phone} onChange={(e) => setPhone(e.target.value)} />
      </Field>
      <Field label="Email *">
        <input className="input" placeholder="enter email..." value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          disabled={!canSubmit || isSubmitting}
          className="btn btn-primary"
          style={{ padding: "9px 18px", fontSize: "0.85rem", opacity: canSubmit && !isSubmitting ? 1 : 0.5, cursor: canSubmit && !isSubmitting ? "pointer" : "not-allowed" }}
          onClick={() => onCreate({ name, phone, email })}
        >
          {isSubmitting ? "Creating…" : "Create"}
        </button>
        <button onClick={onClose} style={outlineBtn}>Cancel</button>
      </div>
    </ModalShell>
  );
}

function SuccessModal({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <ModalShell title="" onClose={onClose} width={420}>
      <div style={{ padding: "20px 0 0", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 6, marginTop: -44 }}>
        <CircleCheck size={56} strokeWidth={1.5} color="#16A34A" style={{ marginBottom: 6 }} />
        <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "var(--color-heading)" }}>Order Created Successfully</h3>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-text-muted)" }}>{message}</p>
      </div>
    </ModalShell>
  );
}

const outlineBtn: React.CSSProperties = {
  padding: "9px 18px", borderRadius: 8, border: "1px solid var(--color-border)", background: "#fff",
  cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)", fontFamily: "var(--font-sans)",
};