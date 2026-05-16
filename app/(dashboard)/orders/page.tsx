"use client";

import { useState } from "react";
import { CalendarDays, ShoppingCart } from "lucide-react";

import OrdersFilter       from "@/components/orders/OrdersFilter";
import OrdersTable        from "@/components/orders/OrdersTable";
import OrderDetailModal   from "@/components/orders/OrdersDetailModal";
import CustomerSection    from "@/components/orders/CustomerSection";
import CartSection        from "@/components/orders//CartSection";
import OrderDetailsSection from "@/components/orders/OrderDetailsSection";
import OrderSummary       from "@/components/orders/OrderSummary";
import AddItemModal       from "@/components/orders/AddItemModal";
import NewCustomerModal   from "@/components/orders/NewCustomerModal";
import { StockWarningModal, SuccessModal } from "@/components/orders/StatusModals";

import {
  Order, MenuItem, Customer, CartItem, OrderType, Status,
  SEED_ORDERS, SEED_CUSTOMERS, MENU_ITEMS,
} from "@/types/orders.types";

export default function OrdersPage() {
  /* ── view ── */
  const [view, setView] = useState<"list" | "create">("list");

  /* ── list state ── */
  const [orders, setOrders]       = useState<Order[]>(SEED_ORDERS);
  const [search, setSearch]       = useState("");
  const [searchBy, setSearchBy]   = useState("Name");
  const [statusFilter, setStatus] = useState<"All Status" | Status>("All Status");
  const [page, setPage]           = useState(1);
  const [detailOrder, setDetail]  = useState<Order | null>(null);

  /* ── create state ── */
  const [customers, setCustomers] = useState<Customer[]>(SEED_CUSTOMERS);
  const [custSearch, setCustSearch] = useState("");
  const [selCustomer, setSelCust] = useState<Customer | null>(null);
  const [cart, setCart]           = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>("Dine-in");
  const [payment, setPayment]     = useState("");
  const [notes, setNotes]         = useState("");

  /* ── modals ── */
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [newCustOpen, setNewCustOpen] = useState(false);
  const [stockWarn, setStockWarn]     = useState<MenuItem | null>(null);
  const [successName, setSuccessName] = useState<string | null>(null);

  /* ── filtered orders ── */
  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch =
      searchBy === "Name"     ? o.customer.toLowerCase().includes(q) :
      searchBy === "Type"     ? o.type.toLowerCase().includes(q) :
      searchBy === "Order ID" ? o.id.toLowerCase().includes(q) : true;
    const matchStatus = statusFilter === "All Status" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  /* ── cart helpers ── */
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const addToCart = (item: MenuItem) => {
    if (item.stock === 0) { setStockWarn(item); return; }
    setCart((c) => {
      const ex = c.find((x) => x.id === item.id);
      return ex
        ? c.map((x) => x.id === item.id ? { ...x, qty: x.qty + 1 } : x)
        : [...c, { ...item, qty: 1 }];
    });
    setAddItemOpen(false);
  };

  const changeQty = (id: number, delta: number) =>
    setCart((c) => c.map((x) => x.id === id ? { ...x, qty: Math.max(1, x.qty + delta) } : x));

  const removeItem = (id: number) =>
    setCart((c) => c.filter((x) => x.id !== id));

  const handleCreateOrder = () => {
    if (!selCustomer || cart.length === 0) return;
    const newOrder: Order = {
      id:       `#FD-${2848 + orders.length}`,
      customer: selCustomer.name,
      email:    "",
      phone:    selCustomer.phone,
      address:  "",
      items:    cart.map((i) => ({ name: i.name, qty: i.qty, price: i.price * i.qty })),
      type:     orderType,
      status:   "Preparing",
      time:     new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }),
    };
    setOrders((o) => [newOrder, ...o]);
    setSuccessName(selCustomer.name);
    setCart([]); setSelCust(null); setCustSearch(""); setNotes(""); setPayment("");
  };

  const markReady = (id: string) => {
    setOrders((o) => o.map((x) => x.id === id ? { ...x, status: "Ready" } : x));
    setDetail(null);
  };

  /* ══════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════ */
  return (
    <>
      {view === "list" ? (
        /* ─── LIST VIEW ─── */
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--color-text-muted)", margin: 0 }}>
              Manage and track all orders
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", border: "1px solid var(--color-border)", borderRadius: 8, background: "var(--color-bg-card)", fontSize: "0.825rem", color: "var(--color-text)" }}>
                <CalendarDays size={14} strokeWidth={1.8} color="var(--color-primary)" />
                Today
              </div>
              <button className="btn btn-primary" onClick={() => setView("create")} style={{ gap: 6 }}>
                <ShoppingCart size={15} strokeWidth={2} />
                Create Order
              </button>
            </div>
          </div>

          <OrdersFilter
            search={search}       onSearch={(v) => { setSearch(v); setPage(1); }}
            searchBy={searchBy}   onSearchBy={(v) => { setSearchBy(v); setPage(1); }}
            statusFilter={statusFilter} onStatus={(v) => { setStatus(v); setPage(1); }}
          />

          <OrdersTable
            orders={filtered}
            page={page}
            onPageChange={setPage}
            onView={setDetail}
          />
        </div>
      ) : (
        /* ─── CREATE VIEW ─── */
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
          {/* Left column */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
            <p style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--color-text-muted)", margin: 0 }}>
              Create orders for call-in / walk-in customers
            </p>

            <CustomerSection
              customers={customers}
              selected={selCustomer}
              search={custSearch}
              onSearch={setCustSearch}
              onSelect={(c) => { setSelCust(c); setCustSearch(""); }}
              onClear={() => setSelCust(null)}
              onNewCustomer={() => setNewCustOpen(true)}
            />

            <CartSection
              cart={cart}
              onAddItem={() => setAddItemOpen(true)}
              onChangeQty={changeQty}
              onRemove={removeItem}
            />

            <OrderDetailsSection
              orderType={orderType} onOrderType={setOrderType}
              payment={payment}     onPayment={setPayment}
              notes={notes}         onNotes={setNotes}
            />
          </div>

          {/* Right: summary */}
          <OrderSummary
            subtotal={subtotal}
            canCreate={!!selCustomer && cart.length > 0}
            onCreate={handleCreateOrder}
            onBack={() => setView("list")}
          />
        </div>
      )}

      {/* ── Modals ── */}
      {detailOrder && (
        <OrderDetailModal
          order={detailOrder}
          onClose={() => setDetail(null)}
          onMarkReady={markReady}
        />
      )}

      {addItemOpen && (
        <AddItemModal
          items={MENU_ITEMS}
          onAdd={addToCart}
          onClose={() => setAddItemOpen(false)}
        />
      )}

      {newCustOpen && (
        <NewCustomerModal
          onClose={() => setNewCustOpen(false)}
          onCreate={(c) => {
            setCustomers((p) => [...p, c]);
            setSelCust(c);
            setNewCustOpen(false);
          }}
        />
      )}

      {stockWarn && (
        <StockWarningModal item={stockWarn} onClose={() => setStockWarn(null)} />
      )}

      {successName && (
        <SuccessModal
          customerName={successName}
          onClose={() => { setSuccessName(null); setView("list"); }}
        />
      )}
    </>
  );
}