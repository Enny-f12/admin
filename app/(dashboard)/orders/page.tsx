"use client";

import { useState } from "react";
import {
  CalendarDays,
  SlidersHorizontal,
  Search,
  ChevronDown,
  Check,
  Eye,
  X,
  User,
  Phone,
  MapPin,
  ShoppingBag,
  Clock,
} from "lucide-react";

type OrderStatus = "Preparing" | "Ready" | "Delivered" | "Canceled";
type OrderType = "Delivery" | "Dine-in" | "Pick Up";

type OrderItem = { name: string; qty: number; price: number };

type Order = {
  id: string;
  customer: string;
  email: string;
  phone: string;
  address: string;
  itemsCount: number;
  items: OrderItem[];
  total: number;
  type: OrderType;
  status: OrderStatus;
  time: string;
};

const ORDERS: Order[] = [
  {
    id: "#FD-2847", customer: "Sarah M.", email: "sarahm@gmail.com", phone: "+234 810 3335 279",
    address: "12 Lekki Phase 1, Lagos", itemsCount: 2,
    items: [{ name: "Spicy Jollof", qty: 1, price: 5000 }, { name: "Peppered Turkey", qty: 1, price: 15000 }],
    total: 20000, type: "Delivery", status: "Preparing", time: "02:30 PM",
  },
  {
    id: "#FD-2846", customer: "Mike O.", email: "mikeo@gmail.com", phone: "+234 810 1234 567",
    address: "5 Admiralty Way, Lekki", itemsCount: 1,
    items: [{ name: "Jollof Rice", qty: 1, price: 15000 }],
    total: 15000, type: "Dine-in", status: "Ready", time: "03:00 PM",
  },
  {
    id: "#FD-2845", customer: "Ada K.", email: "adak@gmail.com", phone: "+234 810 2345 678",
    address: "8 Freedom Way, Lekki", itemsCount: 3,
    items: [{ name: "Assorted items", qty: 3, price: 15000 }],
    total: 15000, type: "Delivery", status: "Delivered", time: "10:00 AM",
  },
  {
    id: "#FD-2844", customer: "John C.", email: "johnc@gmail.com", phone: "+234 810 3456 789",
    address: "20 Admiralty Way, Lekki", itemsCount: 4,
    items: [{ name: "Assorted items", qty: 4, price: 20000 }],
    total: 20000, type: "Pick Up", status: "Delivered", time: "08:00 AM",
  },
  {
    id: "#FD-2843", customer: "Lisa P.", email: "lisap@gmail.com", phone: "+234 810 4567 890",
    address: "3 Ligali Ayorinde St, VI", itemsCount: 5,
    items: [{ name: "Assorted items", qty: 5, price: 20000 }],
    total: 20000, type: "Delivery", status: "Canceled", time: "08:00 AM",
  },
  {
    id: "#FD-2842", customer: "Abel F.", email: "abelf@gmail.com", phone: "+234 810 5678 901",
    address: "15 Kofo Abayomi St, VI", itemsCount: 1,
    items: [{ name: "Assorted items", qty: 1, price: 20000 }],
    total: 20000, type: "Delivery", status: "Delivered", time: "08:00 AM",
  },
];

const SEARCH_BY_OPTIONS = ["Name", "Type", "Order ID"];
const STATUS_OPTIONS: ("All Status" | OrderStatus)[] = ["All Status", "Preparing", "Ready", "Delivered", "Canceled"];
const PAGE_SIZE = 6;

const STATUS_CLASS: Record<OrderStatus, string> = {
  Preparing: "badge badge-red",
  Ready:     "badge badge-yellow",
  Delivered: "badge badge-green",
  Canceled:  "badge badge-red",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(ORDERS);
  const [search, setSearch] = useState("");
  const [searchBy, setSearchBy] = useState("Name");
  const [searchByOpen, setSearchByOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"All Status" | OrderStatus>("All Status");
  const [statusOpen, setStatusOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch =
      searchBy === "Name" ? o.customer.toLowerCase().includes(q) :
      searchBy === "Type" ? o.type.toLowerCase().includes(q) :
      o.id.toLowerCase().includes(q);
    const matchStatus = statusFilter === "All Status" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const markReady = (id: string) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: "Ready" } : o)));
    setDetailOrder(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, position: "relative" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "var(--color-primary)" }}>
            Foodies 1 LEKKI
          </p>
          <h1 style={{ margin: "6px 0 0", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-heading)" }}>
            MANAGE &amp; TRACK ALL ORDERS
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            50 orders today
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", border: "1px solid var(--color-border)", borderRadius: 8, background: "var(--color-bg-card)", fontSize: "0.825rem", color: "var(--color-text)" }}>
          <CalendarDays size={14} strokeWidth={1.8} color="var(--color-primary)" />
          Today
        </div>
      </div>

      {/* Filter */}
      <div className="card">
        <p style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 14px", fontSize: "0.9rem", fontWeight: 700, color: "var(--color-heading)" }}>
          <SlidersHorizontal size={16} strokeWidth={1.8} />
          Filter
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
            <Search size={16} strokeWidth={1.8} color="var(--color-text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
            <input
              className="input"
              placeholder="Search orders..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ width: "100%", paddingLeft: 38 }}
            />
          </div>

          {/* Search By */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setSearchByOpen((v) => !v)}
              style={{
                display: "flex", alignItems: "center", gap: 20, justifyContent: "space-between",
                padding: "10px 16px", borderRadius: 8, border: "none", background: "var(--color-secondary)",
                cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "#7a5500", fontFamily: "var(--font-sans)",
                minWidth: 150,
              }}
            >
              Search By
              <ChevronDown size={15} strokeWidth={1.8} color="#7a5500" />
            </button>
            {searchByOpen && (
              <div
                style={{
                  position: "absolute", top: "calc(100% + 6px)", left: 0, minWidth: 150,
                  background: "#fff", border: "1px solid var(--color-border)", borderRadius: 10,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.10)", overflow: "hidden", zIndex: 60,
                }}
              >
                {SEARCH_BY_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setSearchBy(opt); setSearchByOpen(false); }}
                    style={{
                      display: "block", width: "100%", textAlign: "left", padding: "10px 14px",
                      background: opt === searchBy ? "var(--color-bg-soft)" : "#fff", border: "none",
                      cursor: "pointer", fontSize: "0.85rem", fontFamily: "var(--font-sans)", color: "var(--color-text)",
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <div style={{ position: "relative", minWidth: 170 }}>
            <button
              onClick={() => setStatusOpen((v) => !v)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, width: "100%",
                padding: "10px 14px", borderRadius: 8, border: "1px solid var(--color-border)", background: "#fff",
                cursor: "pointer", fontSize: "0.85rem", color: "var(--color-text)", fontFamily: "var(--font-sans)",
              }}
            >
              {statusFilter}
              <ChevronDown size={15} strokeWidth={1.8} color="var(--color-text-muted)" />
            </button>
            {statusOpen && (
              <div
                style={{
                  position: "absolute", top: "calc(100% + 6px)", left: 0, minWidth: 170,
                  background: "#fff", border: "1px solid var(--color-border)", borderRadius: 10,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.10)", overflow: "hidden", zIndex: 60,
                }}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setStatusFilter(opt); setStatusOpen(false); setPage(1); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", padding: "10px 14px",
                      background: opt === statusFilter ? "var(--color-bg-soft)" : "#fff", border: "none",
                      cursor: "pointer", fontSize: "0.85rem", fontFamily: "var(--font-sans)", color: "var(--color-text)",
                    }}
                  >
                    {opt === statusFilter && <Check size={13} strokeWidth={2} />}
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {["Order ID", "Customer", "Items", "Total Amount", "Type", "Status", "Time", "Action"].map((c) => (
                  <th key={c}>{c}</th>
                ))}
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
                    <span style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--color-text-secondary)", fontSize: "0.83rem" }}>
                      <Clock size={13} strokeWidth={1.8} />
                      {order.time}
                    </span>
                  </td>
                  <td>
                    <button
                      aria-label={`View order ${order.id}`}
                      onClick={() => setDetailOrder(order)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", padding: 4 }}
                    >
                      <Eye size={15} strokeWidth={1.8} />
                    </button>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "24px 0", color: "var(--color-text-muted)" }}>
                    No orders match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 14, padding: "14px 20px", fontSize: "0.85rem" }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-primary)", fontWeight: 600 }}>
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                width: 28, height: 28, borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600,
                background: p === page ? "var(--color-secondary)" : "transparent",
                color: p === page ? "#7a5500" : "var(--color-text)",
              }}
            >
              {p}
            </button>
          ))}
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-primary)", fontWeight: 600 }}>
            Next
          </button>
        </div>
      </div>

      {detailOrder && (
        <OrderDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} onMarkReady={markReady} />
      )}
    </div>
  );
}

function OrderDetailModal({ order, onClose, onMarkReady }: { order: Order; onClose: () => void; onMarkReady: (id: string) => void }) {
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
          width: 470, maxWidth: "92vw", maxHeight: "88vh", background: "#fff", borderRadius: 14,
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", flexShrink: 0, borderBottom: "1px solid var(--color-border)" }}>
          <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--color-heading)" }}>
            Order&nbsp; {order.id}
          </h3>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "20px 24px 24px", overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <span className={STATUS_CLASS[order.status]}>{order.status}</span>
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text)" }}>{order.time}</span>
          </div>

          <div style={{ padding: "16px", borderRadius: 10, background: "var(--color-bg-soft)", display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text)" }}>
              <User size={15} strokeWidth={1.8} color="var(--color-secondary)" />
              {order.customer}
            </span>
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginLeft: 23 }}>
              {order.email}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "var(--color-text)" }}>
              <Phone size={15} strokeWidth={1.8} color="var(--color-primary)" />
              {order.phone}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "var(--color-text)" }}>
              <MapPin size={15} strokeWidth={1.8} color="var(--color-primary)" />
              {order.address}
            </span>
          </div>

          <div style={{ padding: "16px", borderRadius: 10, background: "var(--color-bg-soft)", marginBottom: 24 }}>
            <p style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 12px", fontSize: "0.9rem", fontWeight: 700, color: "var(--color-heading)" }}>
              <ShoppingBag size={15} strokeWidth={1.8} color="var(--color-secondary)" />
              Order Items
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
              {order.items.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--color-text)" }}>
                  <span>{item.name} x {item.qty}</span>
                  <span>₦{item.price.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid var(--color-border)", fontWeight: 700, color: "var(--color-heading)" }}>
              <span>Total</span>
              <span>₦{order.total.toLocaleString()}</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            {order.status === "Preparing" && (
              <button
                className="btn btn-primary"
                style={{ flex: 1, padding: "10px 0", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center" }}
                onClick={() => onMarkReady(order.id)}
              >
                Mark Ready
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                flex: order.status === "Preparing" ? 1 : undefined, width: order.status === "Preparing" ? undefined : "100%",
                padding: "10px 0", borderRadius: 8, border: "1px solid var(--color-border)", background: "#fff",
                cursor: "pointer", fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text)", fontFamily: "var(--font-sans)",
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}