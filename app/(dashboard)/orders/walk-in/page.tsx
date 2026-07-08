"use client";

import { useState } from "react";
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

type OrderStatus = "Pending" | "Preparing" | "Ready" | "Delivered" | "Canceled";
type OrderType = "Dine-in" | "Pickup" | "Delivery";
type PaymentStatus = "Pending" | "Paid (Cash)" | "Paid (Transfer)";
type Tab = "create" | "edit" | "blacklist";

type ExistingOrder = {
  id: string;
  customer: string;
  itemsCount: number;
  total: number;
  type: "Delivery" | "Dine-in" | "Pick Up";
  status: OrderStatus;
};

type Customer = { name: string; phone: string };
type MenuItem = { id: number; name: string; price: number; stock: number };
type CartItem = MenuItem & { qty: number };
type BlacklistEntry = { name: string; phone: string; reason: string };

const EXISTING_ORDERS: ExistingOrder[] = [
  { id: "#FD-2847", customer: "Sarah M.", itemsCount: 2, total: 20000, type: "Delivery", status: "Preparing" },
  { id: "#FD-2846", customer: "Mike O.",  itemsCount: 1, total: 15000, type: "Dine-in",  status: "Ready"     },
  { id: "#FD-2845", customer: "Ada K.",   itemsCount: 3, total: 15000, type: "Delivery", status: "Delivered" },
  { id: "#FD-2844", customer: "John C.",  itemsCount: 4, total: 20000, type: "Pick Up",  status: "Delivered" },
  { id: "#FD-2843", customer: "Lisa P.",  itemsCount: 5, total: 20000, type: "Delivery", status: "Canceled"  },
  { id: "#FD-2842", customer: "Abel F.",  itemsCount: 1, total: 20000, type: "Delivery", status: "Delivered" },
];

const CUSTOMERS: Customer[] = [
  { name: "Sarah M.", phone: "+234 810 0000 444" },
  { name: "Mike O.",  phone: "+234 810 1111 555" },
  { name: "Ada K.",   phone: "+234 810 2222 666" },
];

const MENU_ITEMS: MenuItem[] = [
  { id: 1, name: "Jam Doughnut", price: 1200, stock: 24 },
  { id: 2, name: "Fried rice",   price: 3200, stock: 24 },
  { id: 3, name: "Starch",       price: 600,  stock: 4  },
  { id: 4, name: "Pizza Roll",   price: 3700, stock: 0  },
  { id: 5, name: "Pounded Yam",  price: 800,  stock: 9  },
  { id: 6, name: "Mini Chicken", price: 3500, stock: 30 },
  { id: 7, name: "Jollof Rice",  price: 1200, stock: 0  },
];

const INITIAL_BLACKLIST: BlacklistEntry[] = [
  { name: "Tunde A.", phone: "+234 805 110 4422", reason: "Repeated chargebacks" },
  { name: "Felix A.", phone: "+234 801 222 3344", reason: "Abusive behaviour"    },
  { name: "Chidi O.", phone: "+234 805 110 4422", reason: "Repeated chargebacks" },
  { name: "Sarah M.", phone: "+234 805 110 4422", reason: "Repeated chargebacks" },
];

const STATUS_CLASS: Record<OrderStatus, string> = {
  Pending:   "badge badge-yellow",
  Preparing: "badge badge-red",
  Ready:     "badge badge-yellow",
  Delivered: "badge badge-green",
  Canceled:  "badge badge-red",
};

const PAGE_SIZE = 6;

export default function ManualOrderPage() {
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

/* ── Tab button ── */
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
  value, options, open, setOpen, onChange, placeholder,
}: { value: string; options: string[]; open: boolean; setOpen: (v: boolean) => void; onChange: (v: string) => void; placeholder?: string }) {
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
        {value || placeholder}
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
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════ CREATE ORDER ══════════════════════════ */
function CreateOrderView() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [custSearch, setCustSearch] = useState("");
  const [newCustOpen, setNewCustOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>(CUSTOMERS);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [stockWarnItem, setStockWarnItem] = useState<MenuItem | null>(null);

  const [orderType, setOrderType] = useState<OrderType | "">("Dine-in");
  const [orderTypeOpen, setOrderTypeOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | "">("");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [notes, setNotes] = useState("");

  const [successName, setSuccessName] = useState<string | null>(null);

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = Math.round(subtotal * 0.075);
  const total = subtotal + tax;
  const canCreate = !!customer && cart.length > 0 && !!paymentStatus;

  const filteredCustomers = customers.filter(
    (c) => c.name.toLowerCase().includes(custSearch.toLowerCase()) || c.phone.includes(custSearch)
  );

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

  const changeQty = (id: number, delta: number) =>
    setCart((prev) => prev.map((c) => (c.id === id ? { ...c, qty: Math.max(1, c.qty + delta) } : c)));

  const removeItem = (id: number) => setCart((prev) => prev.filter((c) => c.id !== id));

  const reset = () => {
    setCustomer(null); setCart([]); setOrderType("Dine-in"); setPaymentStatus(""); setNotes("");
  };

  const createOrder = () => {
    if (!canCreate || !customer) return;
    setSuccessName(customer.name);
    reset();
  };

  return (
    <>
      {/* header action buttons, rendered here since they need cart state */}
      <div style={{ position: "absolute", top: 0, right: 0, display: "flex", gap: 10 }}>
        <button
          style={{
            padding: "9px 18px", borderRadius: 8, border: "1px solid var(--color-border)", background: "#fff",
            cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)", fontFamily: "var(--font-sans)",
          }}
        >
          Save Draft
        </button>
        <button className="btn btn-primary" style={{ padding: "9px 18px", fontSize: "0.85rem" }}>
          Send to Kitchen
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
                  <p style={{ margin: 0, fontWeight: 600, color: "var(--color-text)" }}>{customer.name}</p>
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
                  {filteredCustomers.map((c) => (
                    <button
                      key={c.phone}
                      onClick={() => { setCustomer(c); setCustSearch(""); }}
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "10px 8px",
                        border: "none", borderBottom: "1px solid var(--color-border)", background: "none",
                        cursor: "pointer", textAlign: "left", fontFamily: "var(--font-sans)",
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--color-text)" }}>{c.name}</span>
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
                onClick={() => setAddItemOpen(true)}
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
                        ₦{item.price.toLocaleString()} • Stock: {item.stock}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button onClick={() => changeQty(item.id, -1)} style={qtyBtn}><Minus size={13} /></button>
                        <span style={{ minWidth: 18, textAlign: "center", fontWeight: 600, fontSize: "0.85rem" }}>{item.qty}</span>
                        <button onClick={() => changeQty(item.id, 1)} style={qtyBtn}><Plus size={13} /></button>
                      </div>
                      <span style={{ minWidth: 60, textAlign: "right", fontWeight: 600, fontSize: "0.9rem", color: "var(--color-text)" }}>
                        ₦{(item.price * item.qty).toLocaleString()}
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
                  options={["Dine-in", "Pickup", "Delivery"]}
                  open={orderTypeOpen}
                  setOpen={setOrderTypeOpen}
                  onChange={(v) => setOrderType(v as OrderType)}
                />
              </Field>
              <Field label="Payment Status">
                <Dropdown
                  value={paymentStatus}
                  options={["Pending", "Paid (Cash)", "Paid (Transfer)"]}
                  open={paymentOpen}
                  setOpen={setPaymentOpen}
                  onChange={(v) => setPaymentStatus(v as PaymentStatus)}
                  placeholder="Select...."
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
            <span>₦{subtotal.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", color: "var(--color-text)", marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid var(--color-border)" }}>
            <span>Tax (7.5%)</span>
            <span>₦{tax.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "1rem", color: "var(--color-heading)", marginBottom: 20 }}>
            <span>Total</span>
            <span>₦{total.toLocaleString()}</span>
          </div>
          <button
            disabled={!canCreate}
            onClick={createOrder}
            style={{
              width: "100%", padding: "12px 0", borderRadius: 8, border: "none",
              background: canCreate ? "var(--color-secondary)" : "rgba(252,208,99,0.4)",
              color: canCreate ? "#5c4200" : "#a08a55",
              fontWeight: 700, fontSize: "0.9rem", cursor: canCreate ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "var(--font-sans)",
            }}
          >
            <Check size={16} strokeWidth={2.5} />
            Create Order
          </button>
        </div>
      </div>

      {addItemOpen && (
        <AddItemModal items={MENU_ITEMS} onAdd={addToCart} onOutOfStock={setStockWarnItem} onClose={() => setAddItemOpen(false)} />
      )}
      {stockWarnItem && <StockWarningModal item={stockWarnItem} onClose={() => setStockWarnItem(null)} />}
      {newCustOpen && (
        <NewCustomerModal
          onClose={() => setNewCustOpen(false)}
          onCreate={(c) => { setCustomers((prev) => [...prev, c]); setCustomer(c); setNewCustOpen(false); }}
        />
      )}
      {successName && <SuccessModal name={successName} onClose={() => setSuccessName(null)} />}
    </>
  );
}
const qtyBtn: React.CSSProperties = {
  width: 24, height: 24, borderRadius: 6, border: "1px solid var(--color-border)", background: "#fff",
  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
};

/* ══════════════════════════ EDIT EXISTING ══════════════════════════ */
function EditExistingView() {
  const [orders, setOrders] = useState<ExistingOrder[]>(EXISTING_ORDERS);
  const [page, setPage] = useState(1);
  const [editOrder, setEditOrder] = useState<ExistingOrder | null>(null);

  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const paged = orders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const saveStatus = (id: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    setEditOrder(null);
  };

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
            {paged.map((order) => (
              <tr key={order.id}>
                <td style={{ fontWeight: 600, color: "var(--color-text)" }}>{order.id}</td>
                <td>{order.customer}</td>
                <td>{order.itemsCount} {order.itemsCount === 1 ? "Item" : "Items"}</td>
                <td style={{ fontWeight: 500, color: "var(--color-text)" }}>₦{order.total.toLocaleString()}</td>
                <td>{order.type}</td>
                <td><span className={STATUS_CLASS[order.status]}>{order.status}</span></td>
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

      {editOrder && <EditOrderModal order={editOrder} onClose={() => setEditOrder(null)} onSave={saveStatus} />}
    </div>
  );
}

function EditOrderModal({ order, onClose, onSave }: { order: ExistingOrder; onClose: () => void; onSave: (id: string, status: OrderStatus) => void }) {
  const [status, setStatus] = useState<OrderStatus>(order.status === "Pending" ? "Pending" : order.status);
  const [statusOpen, setStatusOpen] = useState(false);

  return (
    <ModalShell title={`Edit Order ${order.id}`} onClose={onClose}>
      <div style={{ padding: "14px 16px", borderRadius: 10, background: "var(--color-bg-soft)", marginBottom: 18 }}>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-text)" }}><strong>Customer:</strong> {order.customer}</p>
        <p style={{ margin: "4px 0 0", fontSize: "0.9rem", color: "var(--color-text)" }}><strong>Status:</strong> {order.status}</p>
      </div>

      <Field label="Update Status">
        <Dropdown
          value={status}
          options={["Pending", "Preparing", "Ready", "Delivered", "Canceled"]}
          open={statusOpen}
          setOpen={setStatusOpen}
          onChange={(v) => setStatus(v as OrderStatus)}
        />
      </Field>

      <p style={{ margin: "0 0 20px", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)" }}>
        Add/Remove Items
        <br />
        <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>Items can be adjusted before order is marked Ready.</span>
      </p>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button onClick={onClose} style={outlineBtn}>Cancel</button>
        <button className="btn btn-primary" style={{ padding: "9px 18px", fontSize: "0.85rem" }} onClick={() => onSave(order.id, status)}>
          Save Changes
        </button>
      </div>
    </ModalShell>
  );
}

/* ══════════════════════════ BLACKLIST ══════════════════════════ */
function BlacklistView() {
  const [list, setList] = useState<BlacklistEntry[]>(INITIAL_BLACKLIST);
  const [addOpen, setAddOpen] = useState(false);

  const unblock = (phone: string, name: string) =>
    setList((prev) => prev.filter((b) => !(b.phone === phone && b.name === name)));

  return (
    <>
      <div className="card" style={{ border: "1px solid rgba(225,11,28,0.25)", background: "rgba(225,11,28,0.03)" }}>
        <p style={{ margin: "0 0 14px", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.04em", color: "var(--color-text-muted)" }}>
          BLACKLISTED CUSTOMERS
        </p>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {list.map((b, i) => (
            <div
              key={i}
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
                onClick={() => unblock(b.phone, b.name)}
                style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid var(--color-border)", background: "#fff", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, color: "var(--color-text)", fontFamily: "var(--font-sans)" }}
              >
                Unblock
              </button>
            </div>
          ))}
          {list.length === 0 && (
            <p style={{ margin: "10px 0", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>No blacklisted customers.</p>
          )}
        </div>
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
          onAdd={(entry) => { setList((prev) => [...prev, entry]); setAddOpen(false); }}
        />
      )}
    </>
  );
}

function AddToBlacklistModal({ onClose, onAdd }: { onClose: () => void; onAdd: (e: BlacklistEntry) => void }) {
  const [customer, setCustomer] = useState("");
  const [custOpen, setCustOpen] = useState(false);
  const [reason, setReason] = useState("");

  const canSubmit = !!customer && reason.trim().length > 0;

  return (
    <ModalShell title="ADD TO BLACKLIST" onClose={onClose}>
      <Field label="Customer">
        <Dropdown
          value={customer}
          options={CUSTOMERS.map((c) => c.name)}
          open={custOpen}
          setOpen={setCustOpen}
          onChange={setCustomer}
          placeholder="select customer"
        />
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
          onClick={() => {
            const c = CUSTOMERS.find((x) => x.name === customer);
            onAdd({ name: customer, phone: c?.phone ?? "", reason });
          }}
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
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 100, padding: "5vh 20px", overflowY: "auto" }}
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
  items, onAdd, onOutOfStock, onClose,
}: { items: MenuItem[]; onAdd: (item: MenuItem) => void; onOutOfStock: (item: MenuItem) => void; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const filtered = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));

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
        {filtered.map((item) => {
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
                <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-text-muted)" }}>₦{item.price.toLocaleString()}</p>
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

function NewCustomerModal({ onClose, onCreate }: { onClose: () => void; onCreate: (c: Customer) => void }) {
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
          disabled={!canSubmit}
          className="btn btn-primary"
          style={{ padding: "9px 18px", fontSize: "0.85rem", opacity: canSubmit ? 1 : 0.5, cursor: canSubmit ? "pointer" : "not-allowed" }}
          onClick={() => onCreate({ name, phone })}
        >
          Create
        </button>
        <button onClick={onClose} style={outlineBtn}>Cancel</button>
      </div>
    </ModalShell>
  );
}

function SuccessModal({ name, onClose }: { name: string; onClose: () => void }) {
  return (
    <ModalShell title="" onClose={onClose} width={420}>
      <div style={{ padding: "20px 0 0", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 6, marginTop: -44 }}>
        <CircleCheck size={56} strokeWidth={1.5} color="#16A34A" style={{ marginBottom: 6 }} />
        <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "var(--color-heading)" }}>Order Created Successfully</h3>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-text-muted)" }}>{name}.</p>
      </div>
    </ModalShell>
  );
}

const outlineBtn: React.CSSProperties = {
  padding: "9px 18px", borderRadius: 8, border: "1px solid var(--color-border)", background: "#fff",
  cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)", fontFamily: "var(--font-sans)",
};