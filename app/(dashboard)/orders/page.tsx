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
  Store,
  CreditCard,
  StickyNote,
  AlertTriangle,
} from "lucide-react";
import { useOrderStore } from "@/store/useOrderStore";
import { OrderStatus, AdminOrder } from "@/types/orders";
import { SkeletonText, SkeletonTableRows } from "@/components/ui/Skeleton";
import { useBranch, ALL_BRANCHES_ID } from "../layout";

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

const ORDER_TYPE_LABEL: Record<AdminOrder["orderType"], string> = {
  DINE_IN: "Dine-in",
  TAKEAWAY: "Pick Up",
  DELIVERY: "Delivery",
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  CARD: "Card",
  CASH_ON_DELIVERY: "Cash on Delivery",
  BANK_TRANSFER: "Bank Transfer",
};

const PAYMENT_STATUS_CLASS: Record<string, string> = {
  PAID: "badge badge-green",
  PENDING: "badge badge-yellow",
  REFUNDED: "badge badge-red",
  FAILED: "badge badge-red",
};

const SEARCH_BY_OPTIONS = ["Name", "Type", "Order ID"];
const PAGE_SIZE = 10;

function formatOrderType(type: string) {
  return type === "DINE_IN" ? "Dine-in" : type === "TAKEAWAY" ? "Pick Up" : "Delivery";
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatMoney(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "-";
  const n = Number(value);
  return Number.isFinite(n) ? `₦${n.toLocaleString()}` : "-";
}

// Delivery address is assembled from the discrete address fields -- not
// deliveryInstructions, which is a separate free-text note field. Only
// meaningful for DELIVERY orders; dine-in/pickup have no address.
function formatDeliveryAddress(order: AdminOrder): string {
  if (order.orderType !== "DELIVERY") return "-";
  const parts = [order.deliveryAddressLine1, order.deliveryAddressLine2, order.deliveryCity, order.deliveryState].filter(
    (p): p is string => Boolean(p && p.trim()),
  );
  return parts.length > 0 ? parts.join(", ") : "-";
}

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [searchBy, setSearchBy] = useState("Name");
  const [searchByOpen, setSearchByOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"All Status" | OrderStatus>("All Status");
  const [statusOpen, setStatusOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);

  // Soft branch scoping, same pattern as Stock Inventory: "All Branches"
  // still works and shows every branch's orders together (with a Branch
  // column so it's clear which is which), a specific branch filters.
  // Previously this page had no branch awareness at all, despite
  // AdminOrderFilters and orderService already supporting branchId.
  const branch = useBranch();
  const [branchOpen, setBranchOpen] = useState(false);
  const branchOptions = [{ id: ALL_BRANCHES_ID, name: "All Branches" }, ...branch.branches];
  const resolvedBranchId = branch.id === ALL_BRANCHES_ID ? undefined : branch.id;
  const showBranchColumn = branch.id === ALL_BRANCHES_ID;

  const { orders, ordersLoading: isLoading, ordersError: isError, fetchOrders } = useOrderStore();

  useEffect(() => {
    fetchOrders({
      ...(statusFilter !== "All Status" ? { status: statusFilter } : {}),
      branchId: resolvedBranchId,
    });
  }, [statusFilter, resolvedBranchId, fetchOrders]);

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
            {branch.name}
          </p>
          <h1 style={{ margin: "6px 0 0", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-heading)" }}>
            MANAGE &amp; TRACK ALL ORDERS
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            {isLoading ? <SkeletonText width={90} height={13} /> : `${filtered.length} orders`}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Branch filter -- dropdown for supers, static chip for locked managers */}
          {branch.canPickBranch ? (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setBranchOpen((v) => !v)}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 8,
                  border: "1px solid var(--color-border)", background: "#fff", cursor: "pointer",
                  fontSize: "0.825rem", fontWeight: 600, color: "var(--color-text)", fontFamily: "var(--font-sans)",
                }}
              >
                <Store size={14} strokeWidth={1.8} color="var(--color-primary)" />
                {branch.name}
                <ChevronDown size={14} strokeWidth={1.8} color="var(--color-text-muted)" />
              </button>
              {branchOpen && (
                <div
                  style={{
                    position: "absolute", top: "calc(100% + 6px)", right: 0, minWidth: 170,
                    background: "#fff", border: "1px solid var(--color-border)", borderRadius: 10,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.10)", overflow: "hidden", zIndex: 60,
                  }}
                >
                  {branchOptions.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => { branch.setBranch(b); setBranchOpen(false); setPage(1); }}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
                        padding: "10px 14px", background: b.id === branch.id ? "var(--color-bg-soft)" : "#fff",
                        border: "none", cursor: "pointer", fontSize: "0.85rem", fontFamily: "var(--font-sans)",
                        color: "var(--color-text)", textAlign: "left",
                      }}
                    >
                      {b.id === branch.id && <span style={{ marginRight: 6 }}>{"✓"}</span>}
                      {b.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 8,
                border: "1px solid var(--color-border)", background: "var(--color-bg-soft)",
                fontSize: "0.825rem", fontWeight: 600, color: "var(--color-text)",
              }}
              title="Your account is scoped to this branch"
            >
              <Store size={14} strokeWidth={1.8} color="var(--color-primary)" />
              {branch.name}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", border: "1px solid var(--color-border)", borderRadius: 8, background: "var(--color-bg-card)", fontSize: "0.825rem", color: "var(--color-text)" }}>
            <CalendarDays size={14} strokeWidth={1.8} color="var(--color-primary)" />
            {/* TODO(BACKEND): date range filter (startDate/endDate) exists on
                AdminOrderFilterDto but no date-picker UI wired yet -- currently
                shows all orders regardless of date. */}
            Today
          </div>
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
                {[
                  "Order ID", "Customer",
                  ...(showBranchColumn ? ["Branch"] : []),
                  "Items", "Total Amount", "Type", "Status", "Time", "Action",
                ].map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && <SkeletonTableRows rows={PAGE_SIZE} columns={showBranchColumn ? 9 : 8} />}

              {!isLoading && isError && (
                <tr>
                  <td colSpan={showBranchColumn ? 9 : 8} style={{ textAlign: "center", padding: "24px 0", color: "var(--color-text-muted)" }}>Could not load orders</td>
                </tr>
              )}

              {!isLoading && !isError && paged.map((order) => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 600, color: "var(--color-text)" }}>{order.orderNumber}</td>
                  <td>{order.customer?.fullName ?? order.guestName ?? "-"}</td>
                  {showBranchColumn && <td>{order.branch?.name ?? "-"}</td>}
                  <td>{order.items.length} {order.items.length === 1 ? "Item" : "Items"}</td>
                  <td style={{ fontWeight: 500, color: "var(--color-text)" }}>{formatMoney(order.totalAmount)}</td>
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
                  <td colSpan={showBranchColumn ? 9 : 8} style={{ textAlign: "center", padding: "24px 0", color: "var(--color-text-muted)" }}>
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
  const { getOrderById, isUpdatingStatus, updateOrderStatus } = useOrderStore();

  // Sourced from the already-loaded order list -- no network call. See
  // backend request doc, Orders #4.
  const order = getOrderById(orderId);

  const advanceStatus = async () => {
    if (!order) return;
    const next: Partial<Record<OrderStatus, OrderStatus>> = {
      RECEIVED: "PREPARING",
      PREPARING: "READY_FOR_PICKUP",
    };
    const nextStatus = next[order.status];
    if (nextStatus) {
      const success = await updateOrderStatus(order.id, { status: nextStatus });
      if (success) onClose();
    }
  };

  const discount = order ? Number(order.discountAmount ?? 0) : 0;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 100, padding: "20px", overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: 470, maxWidth: "92vw", maxHeight: "88vh", background: "#fff", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", flexShrink: 0, borderBottom: "1px solid var(--color-border)" }}>
          <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--color-heading)" }}>
            Order&nbsp;{order?.orderNumber ?? "-"}
          </h3>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "20px 24px 24px", overflowY: "auto" }}>
          {order && (
            <>
              {/* Status + type + time */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                <span className={STATUS_CLASS[order.status]}>{STATUS_LABEL[order.status]}</span>
                <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text)" }}>{formatTime(order.createdAt)}</span>
              </div>

              {/* Order type / branch / payment -- previously not shown anywhere
                  in the modal despite being present on every real order. */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, background: "var(--color-bg-soft)", fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text)" }}>
                  <ShoppingBag size={13} strokeWidth={1.8} />
                  {ORDER_TYPE_LABEL[order.orderType]}
                </span>
                {order.branch?.name && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, background: "var(--color-bg-soft)", fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text)" }}>
                    <Store size={13} strokeWidth={1.8} />
                    {order.branch.name}
                  </span>
                )}
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, background: "var(--color-bg-soft)", fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text)" }}>
                  <CreditCard size={13} strokeWidth={1.8} />
                  {PAYMENT_METHOD_LABEL[order.paymentMethod] ?? order.paymentMethod}
                </span>
                <span className={PAYMENT_STATUS_CLASS[order.paymentStatus] ?? "badge"}>
                  {order.paymentStatus}
                </span>
              </div>

              <div style={{ padding: "16px", borderRadius: 10, background: "var(--color-bg-soft)", display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text)" }}>
                  <User size={15} strokeWidth={1.8} color="var(--color-secondary)" />
                  {/* Sourced from the list response's `customer` object for
                      registered users, falling back to guest fields for
                      guest checkouts. Both are present on GET /admin/orders. */}
                  {order.customer?.fullName ?? order.guestName ?? "-"}
                </span>
                <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginLeft: 23 }}>
                  {order.customer?.email ?? order.guestEmail ?? "-"}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "var(--color-text)" }}>
                  <Phone size={15} strokeWidth={1.8} color="var(--color-primary)" />
                  {order.customer?.phone ?? order.guestPhone ?? "-"}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "var(--color-text)" }}>
                  <MapPin size={15} strokeWidth={1.8} color="var(--color-primary)" />
                  {formatDeliveryAddress(order)}
                </span>
              </div>

              {/* Customer / kitchen notes -- present in real data
                  ("Extra spicy please" etc.), previously never rendered.
                  Conditionally shown only when actually present. */}
              {(order.customerNotes || order.kitchenNotes) && (
                <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(160,122,0,0.06)", border: "1px solid rgba(160,122,0,0.2)", marginBottom: 20, display: "flex", flexDirection: "column", gap: 6 }}>
                  {order.customerNotes && (
                    <p style={{ display: "flex", alignItems: "flex-start", gap: 8, margin: 0, fontSize: "0.85rem", color: "var(--color-text)" }}>
                      <StickyNote size={14} strokeWidth={1.8} color="#a07a00" style={{ marginTop: 2, flexShrink: 0 }} />
                      <span><strong>Customer note:</strong> {order.customerNotes}</span>
                    </p>
                  )}
                  {order.kitchenNotes && (
                    <p style={{ display: "flex", alignItems: "flex-start", gap: 8, margin: 0, fontSize: "0.85rem", color: "var(--color-text)" }}>
                      <StickyNote size={14} strokeWidth={1.8} color="#a07a00" style={{ marginTop: 2, flexShrink: 0 }} />
                      <span><strong>Kitchen note:</strong> {order.kitchenNotes}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Cancel reason -- only relevant/shown for cancelled orders
                  that actually have one recorded. */}
              {order.status === "CANCELLED" && order.cancelReason && (
                <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(225,11,28,0.05)", border: "1px solid rgba(225,11,28,0.2)", marginBottom: 20 }}>
                  <p style={{ display: "flex", alignItems: "flex-start", gap: 8, margin: 0, fontSize: "0.85rem", color: "var(--color-text)" }}>
                    <AlertTriangle size={14} strokeWidth={1.8} color="var(--color-primary)" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span><strong>Cancellation reason:</strong> {order.cancelReason}</span>
                  </p>
                </div>
              )}

              <div style={{ padding: "16px", borderRadius: 10, background: "var(--color-bg-soft)", marginBottom: 24 }}>
                <p style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 12px", fontSize: "0.9rem", fontWeight: 700, color: "var(--color-heading)" }}>
                  <ShoppingBag size={15} strokeWidth={1.8} color="var(--color-secondary)" />
                  Order Items
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                  {order.items.map((item) => (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--color-text)" }}>
                      <span>{item.nameSnapshot} x {item.quantity}</span>
                      <span>{formatMoney(item.totalPrice)}</span>
                    </div>
                  ))}
                </div>

                {/* Cost breakdown -- previously the modal jumped straight
                    from item lines to a single Total, skipping subtotal,
                    tax, delivery fee, and discount even though the API
                    returns all four as distinct fields. */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingTop: 10, borderTop: "1px solid var(--color-border)", fontSize: "0.85rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-text-muted)" }}>
                    <span>Subtotal</span>
                    <span>{formatMoney(order.subtotalAmount)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-text-muted)" }}>
                    <span>Tax</span>
                    <span>{formatMoney(order.taxAmount)}</span>
                  </div>
                  {order.orderType === "DELIVERY" && (
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-text-muted)" }}>
                      <span>Delivery Fee</span>
                      <span>{formatMoney(order.deliveryFeeAmount)}</span>
                    </div>
                  )}
                  {discount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#16A34A" }}>
                      <span>Discount</span>
                      <span>-{formatMoney(order.discountAmount)}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 6, marginTop: 2, borderTop: "1px solid var(--color-border)", fontWeight: 700, color: "var(--color-heading)" }}>
                    <span>Total</span>
                    <span>{formatMoney(order.totalAmount)}</span>
                  </div>
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

          {!order && (
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              Could not find this order.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}