// app/(admin)/orders/page.tsx
"use client";

import { useState, useEffect } from "react";
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
import { useOrderStore } from "@/store/useOrderStore";
import { OrderStatus } from "@/types/orders";

const STATUS_OPTIONS: ("All Status" | OrderStatus)[] = [
  "All Status", "RECEIVED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED", "COMPLETED", "CANCELLED",
];

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

const SEARCH_BY_OPTIONS = ["Name", "Type", "Order ID"];
const PAGE_SIZE = 6;

function formatOrderType(type: string) {
  return type === "DINE_IN" ? "Dine-in" : type === "TAKEAWAY" ? "Pick Up" : "Delivery";
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [searchBy, setSearchBy] = useState("Name");
  const [searchByOpen, setSearchByOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"All Status" | OrderStatus>("All Status");
  const [statusOpen, setStatusOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);

  // ── Live data ──
  // NOTE: AdminOrderFilterDto has no `search` param, so name/type/ID search
  // happens client-side against whatever the status/date filters return.
  // See backend request doc — Orders #1.
  const { orders, ordersLoading: isLoading, ordersError: isError, fetchOrders } = useOrderStore();

  useEffect(() => {
    fetchOrders(statusFilter !== "All Status" ? { status: statusFilter } : {});
  }, [statusFilter, fetchOrders]);

  const filtered = (orders ?? []).filter((o) => {
    const q = search.toLowerCase();
    if (!q) return true;
    if (searchBy === "Name") return (o.customer?.fullName ?? o.guestName ?? "").toLowerCase().includes(q);
    if (searchBy === "Type") return o.orderType.toLowerCase().includes(q);
    return o.orderNumber.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
            {isLoading ? "Loading…" : `${filtered.length} orders`}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", border: "1px solid var(--color-border)", borderRadius: 8, background: "var(--color-bg-card)", fontSize: "0.825rem", color: "var(--color-text)" }}>
          <CalendarDays size={14} strokeWidth={1.8} color="var(--color-primary)" />
          {/* TODO(BACKEND): date range filter (startDate/endDate) exists on
              AdminOrderFilterDto but no date-picker UI wired yet — currently
              shows all orders regardless of date. */}
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
              Search By: {searchBy}
              <ChevronDown size={15} strokeWidth={1.8} color="#7a5500" />
            </button>
            {searchByOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, minWidth: 150, background: "#fff", border: "1px solid var(--color-border)", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.10)", overflow: "hidden", zIndex: 60 }}>
                {SEARCH_BY_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setSearchBy(opt); setSearchByOpen(false); }}
                    style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px", background: opt === searchBy ? "var(--color-bg-soft)" : "#fff", border: "none", cursor: "pointer", fontSize: "0.85rem", fontFamily: "var(--font-sans)", color: "var(--color-text)" }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ position: "relative", minWidth: 190 }}>
            <button
              onClick={() => setStatusOpen((v) => !v)}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--color-border)", background: "#fff", cursor: "pointer", fontSize: "0.85rem", color: "var(--color-text)", fontFamily: "var(--font-sans)" }}
            >
              {statusFilter === "All Status" ? "All Status" : STATUS_LABEL[statusFilter]}
              <ChevronDown size={15} strokeWidth={1.8} color="var(--color-text-muted)" />
            </button>
            {statusOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, minWidth: 190, background: "#fff", border: "1px solid var(--color-border)", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.10)", overflow: "hidden", zIndex: 60 }}>
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setStatusFilter(opt); setStatusOpen(false); setPage(1); }}
                    style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", padding: "10px 14px", background: opt === statusFilter ? "var(--color-bg-soft)" : "#fff", border: "none", cursor: "pointer", fontSize: "0.85rem", fontFamily: "var(--font-sans)", color: "var(--color-text)" }}
                  >
                    {opt === statusFilter && <Check size={13} strokeWidth={2} />}
                    {opt === "All Status" ? "All Status" : STATUS_LABEL[opt]}
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
              {isLoading && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "24px 0", color: "var(--color-text-muted)" }}>Loading…</td>
                </tr>
              )}
              {!isLoading && isError && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "24px 0", color: "var(--color-text-muted)" }}>Could not load orders</td>
                </tr>
              )}
              {!isLoading && !isError && paged.map((order) => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 600, color: "var(--color-text)" }}>{order.orderNumber}</td>
                  <td>{order.customer?.fullName ?? order.guestName ?? "—"}</td>
                  <td>{order.items.length} {order.items.length === 1 ? "Item" : "Items"}</td>
                  <td style={{ fontWeight: 500, color: "var(--color-text)" }}>₦{Number(order.totalAmount).toLocaleString()}</td>
                  <td>{formatOrderType(order.orderType)}</td>
                  <td><span className={STATUS_CLASS[order.status]}>{STATUS_LABEL[order.status]}</span></td>
                  <td>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--color-text-secondary)", fontSize: "0.83rem" }}>
                      <Clock size={13} strokeWidth={1.8} />
                      {formatTime(order.createdAt)}
                    </span>
                  </td>
                  <td>
                    <button
                      aria-label={`View order ${order.orderNumber}`}
                      onClick={() => setDetailOrderId(order.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", padding: 4 }}
                    >
                      <Eye size={15} strokeWidth={1.8} />
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && !isError && paged.length === 0 && (
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
              style={{ width: 28, height: 28, borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, background: p === page ? "var(--color-secondary)" : "transparent", color: p === page ? "#7a5500" : "var(--color-text)" }}
            >
              {p}
            </button>
          ))}
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-primary)", fontWeight: 600 }}>
            Next
          </button>
        </div>
      </div>

      {detailOrderId && (
        <OrderDetailModal orderId={detailOrderId} onClose={() => setDetailOrderId(null)} />
      )}
    </div>
  );
}

function OrderDetailModal({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const {
    orderDetail: order,
    orderDetailLoading: isLoading,
    isUpdatingStatus,
    fetchOrderDetails,
    clearOrderDetail,
    updateOrderStatus,
  } = useOrderStore();

  useEffect(() => {
    fetchOrderDetails(orderId);
    return () => clearOrderDetail();
  }, [orderId, fetchOrderDetails, clearOrderDetail]);

  const advanceStatus = async () => {
    if (!order) return;
    const next: Partial<Record<OrderStatus, OrderStatus>> = {
      RECEIVED: "PREPARING",
      PREPARING: "READY_FOR_PICKUP",
    };
    const nextStatus = next[order.status];
    if (nextStatus) {
      // Optimistic — modal closes immediately, table row updates instantly.
      // If the request fails, the store rolls both back and the toast
      // surfaces the error; the modal will already be closed at that point,
      // which matches the original mutation's onSuccess-only close behavior.
      const success = await updateOrderStatus(order.id, { status: nextStatus });
      if (success) onClose();
    }
  };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 100, padding: "5vh 20px", overflowY: "auto" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: 470, maxWidth: "92vw", maxHeight: "88vh", background: "#fff", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", flexShrink: 0, borderBottom: "1px solid var(--color-border)" }}>
          <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--color-heading)" }}>
            Order&nbsp; {order?.orderNumber ?? "…"}
          </h3>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "20px 24px 24px", overflowY: "auto" }}>
          {isLoading && <p style={{ color: "var(--color-text-muted)" }}>Loading…</p>}

          {order && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <span className={STATUS_CLASS[order.status]}>{STATUS_LABEL[order.status]}</span>
                <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text)" }}>{formatTime(order.createdAt)}</span>
              </div>

              <div style={{ padding: "16px", borderRadius: 10, background: "var(--color-bg-soft)", display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text)" }}>
                  <User size={15} strokeWidth={1.8} color="var(--color-secondary)" />
                  {/* TODO(BACKEND): getOrderDetails doesn't include `customer` —
                      see backend request doc, Orders #2 */}
                  {order.guestName ?? "Registered customer (name unavailable — see gap)"}
                </span>
                <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginLeft: 23 }}>
                  {order.guestEmail ?? "—"}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "var(--color-text)" }}>
                  <Phone size={15} strokeWidth={1.8} color="var(--color-primary)" />
                  {order.guestPhone ?? "—"}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "var(--color-text)" }}>
                  <MapPin size={15} strokeWidth={1.8} color="var(--color-primary)" />
                  {/* TODO(BACKEND): no address field on Order — see backend
                      request doc, Orders #3 */}
                  {order.deliveryInstructions ?? "No address on file"}
                </span>
              </div>

              <div style={{ padding: "16px", borderRadius: 10, background: "var(--color-bg-soft)", marginBottom: 24 }}>
                <p style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 12px", fontSize: "0.9rem", fontWeight: 700, color: "var(--color-heading)" }}>
                  <ShoppingBag size={15} strokeWidth={1.8} color="var(--color-secondary)" />
                  Order Items
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                  {order.items.map((item) => (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--color-text)" }}>
                      <span>{item.nameSnapshot} x {item.quantity}</span>
                      <span>₦{Number(item.totalPrice).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid var(--color-border)", fontWeight: 700, color: "var(--color-heading)" }}>
                  <span>Total</span>
                  <span>₦{Number(order.totalAmount).toLocaleString()}</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                {(order.status === "RECEIVED" || order.status === "PREPARING") && (
                  <button
                    className="btn btn-primary"
                    disabled={isUpdatingStatus}
                    style={{ flex: 1, padding: "10px 0", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", opacity: isUpdatingStatus ? 0.6 : 1 }}
                    onClick={advanceStatus}
                  >
                    {order.status === "RECEIVED" ? "Start Preparing" : "Mark Ready"}
                  </button>
                )}
                <button
                  onClick={onClose}
                  style={{
                    flex: order.status === "RECEIVED" || order.status === "PREPARING" ? 1 : undefined,
                    width: order.status === "RECEIVED" || order.status === "PREPARING" ? undefined : "100%",
                    padding: "10px 0", borderRadius: 8, border: "1px solid var(--color-border)", background: "#fff",
                    cursor: "pointer", fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text)", fontFamily: "var(--font-sans)",
                  }}
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}