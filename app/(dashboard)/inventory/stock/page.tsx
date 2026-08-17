// app/(admin)/inventory/stock/page.tsx — full file

"use client";

import { useState } from "react";
import {
  Box,
  AlertTriangle,
  Plus,
  Minus,
  ArrowLeftRight,
  PackageMinus,
  SlidersHorizontal,
  Search,
  ChevronDown,
  X,
  TrendingUp,
  TrendingDown,
  PackagePlus,
} from "lucide-react";
import { useEffect } from "react";
import { useStockStore } from "@/store/useStockStore";
import { StockItem, StockStatus } from "@/types/stock.types";
import { useBranch } from "../../layout";

type ModalItem = {
  itemId: string;
  name: string;
  unit: string;
  status?: StockStatus;
  current: number;
  branchId: string;
};

const STATUS_CLASS: Record<StockStatus, string> = {
  "In Stock": "badge badge-green",
  "Low Stock": "badge badge-yellow",
  Critical: "badge badge-red",
};

const StatusBadge = ({ status }: { status: StockStatus }) => (
  <span className={STATUS_CLASS[status]} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
    {status === "In Stock" && <TrendingUp size={12} strokeWidth={2} />}
    {status === "Low Stock" && <TrendingDown size={12} strokeWidth={2} />}
    {status === "Critical" && <AlertTriangle size={12} strokeWidth={2} />}
    {status}
  </span>
);

/* ── Pagination hook + bar (shared by both tables) ──
   No effect / no setState-in-effect: page is clamped at render time,
   and only ever changed from real user actions (goToPage / changePageSize). */
function usePagination<T>(data: T[], initialPageSize: 5 | 10 = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<5 | 10>(initialPageSize);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const start = (currentPage - 1) * pageSize;
  const pageItems = data.slice(start, start + pageSize);

  const goToPage = (p: number) => setPage(Math.min(Math.max(1, p), totalPages));
  const changePageSize = (n: 5 | 10) => {
    setPageSize(n);
    setPage(1);
  };

  return { page: currentPage, goToPage, pageSize, changePageSize, totalPages, pageItems, start };
}

function PaginationBar({
  page, goToPage, pageSize, changePageSize, totalPages, totalItems, start,
}: {
  page: number;
  goToPage: (p: number) => void;
  pageSize: 5 | 10;
  changePageSize: (n: 5 | 10) => void;
  totalPages: number;
  totalItems: number;
  start: number;
}) {
  const end = Math.min(start + pageSize, totalItems);

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 16px", borderTop: "1px solid var(--color-border)", flexWrap: "wrap", gap: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
        Show
        <select
          className="input"
          value={pageSize}
          onChange={(e) => changePageSize(Number(e.target.value) as 5 | 10)}
          style={{ width: 64, padding: "4px 8px" }}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
        </select>
        {totalItems > 0 ? `${start + 1}–${end} of ${totalItems}` : "0 of 0"}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button disabled={page <= 1} onClick={() => goToPage(page - 1)} style={pagerBtn(page <= 1)}>
          Prev
        </button>
        <span style={{ fontSize: "0.8rem", color: "var(--color-text)" }}>
          Page {page} of {totalPages}
        </span>
        <button disabled={page >= totalPages} onClick={() => goToPage(page + 1)} style={pagerBtn(page >= totalPages)}>
          Next
        </button>
      </div>
    </div>
  );
}

const pagerBtn = (disabled: boolean): React.CSSProperties => ({
  padding: "6px 12px", borderRadius: 6, border: "1px solid var(--color-border)",
  background: disabled ? "var(--color-bg-soft)" : "#fff", color: disabled ? "var(--color-text-muted)" : "var(--color-text)",
  fontSize: "0.8rem", cursor: disabled ? "not-allowed" : "pointer", fontFamily: "var(--font-sans)",
});

export default function StockInventoryPage() {
  const {
    items,
    itemsLoading,
    itemsError,
    branches,
    lowStock,
    lowStockLoading,
    suppliers,
    fetchBranches,
    fetchItems,
    fetchLowStockAlerts,
    fetchSuppliers,
    adjustStock,
    addStock,
    isAddingStock,
    transferStock,
    removeStock,
    addSupplier,
  } = useStockStore();

  // Single source of truth for the active branch — same context the
  // sidebar picker in app/(admin)/layout.tsx writes to. This page no
  // longer keeps its own branchId state or re-derives role logic:
  // canPickBranch is resolved once, upstream, from assignedBranchId +
  // role, and this page just renders differently based on it. "All
  // Branches" no longer exists as a selectable option, so branch.id is
  // always a real branch once the picker has made its initial selection.
  const branch = useBranch();

  const [branchOpen, setBranchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showThresholds, setShowThresholds] = useState(false);
  const [showAddStock, setShowAddStock] = useState(false);

  const [adjustItem, setAdjustItem] = useState<ModalItem | null>(null);
  const [transferItem, setTransferItem] = useState<ModalItem | null>(null);
  const [removeItem, setRemoveItem] = useState<ModalItem | null>(null);
  const [supplierOpen, setSupplierOpen] = useState(false);

  useEffect(() => {
    fetchBranches();
    fetchSuppliers();
  }, [fetchBranches, fetchSuppliers]);

  useEffect(() => {
    fetchItems(branch.id, search || undefined);
    fetchLowStockAlerts(branch.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch.id, search]);

  const totalItems = items?.length ?? 0;
  const lowStockCount = items?.filter((i) => i.status === "Low Stock").length ?? 0;
  const criticalCount = items?.filter((i) => i.status === "Critical").length ?? 0;

  // dedupe defends against duplicate itemIds coming back from /admin/stock/alerts
  const dedupedLowStock = (lowStock ?? []).filter(
    (a, i, arr) => arr.findIndex((x) => x.itemId === a.itemId) === i,
  );

  const { page, goToPage, pageSize, changePageSize, totalPages, pageItems, start } = usePagination(items ?? [], 10);

  const toModalItem = (item: StockItem, fallbackBranchId?: string): ModalItem => {
    const qty =
      item.quantities.find((q) => q.branchId === fallbackBranchId) ?? item.quantities[0];
    return {
      itemId: item.id,
      name: item.name,
      unit: item.unit,
      status: item.status,
      current: qty?.quantity ?? item.total,
      branchId: qty?.branchId ?? "",
    };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, position: "relative" }}>

      {!showThresholds && !showAddStock ? (
        <>
          <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 600, color: "var(--color-heading)" }}>
            {`Stock levels — ${branch.name}`}
          </h2>

          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <div className="card" style={{ textAlign: "center" }}>
              <Box size={20} strokeWidth={1.8} color="#B5442E" style={{ margin: "0 auto 6px" }} />
              <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "var(--color-heading)" }}>
                {itemsLoading ? "…" : totalItems}
              </p>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Total Items</p>
            </div>
            <div className="card" style={{ textAlign: "center" }}>
              <AlertTriangle size={20} strokeWidth={1.8} color="#a07a00" style={{ margin: "0 auto 6px" }} />
              <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#a07a00" }}>
                {itemsLoading ? "…" : lowStockCount}
              </p>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Low Stock</p>
            </div>
            <div className="card" style={{ textAlign: "center" }}>
              <AlertTriangle size={20} strokeWidth={1.8} color="#E10B1C" style={{ margin: "0 auto 6px" }} />
              <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#E10B1C" }}>
                {itemsLoading ? "…" : criticalCount}
              </p>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Critical</p>
            </div>
          </div>

          {/* Top action row — Add Stock and Threshold Configuration are
              both page-level navigation (full-view swaps, same pattern
              as ThresholdView below), so they belong here together.
              Adjust / Transfer / Remove stay off this row: those are
              item-scoped actions and belong on each table row, not as
              standalone buttons guessing at "the first item". */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <button
              className="btn btn-primary"
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", fontSize: "0.85rem" }}
              onClick={() => setShowAddStock(true)}
            >
              <PackagePlus size={16} strokeWidth={1.8} />
              Add Stock
            </button>
            <button
              className="btn btn-primary"
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", fontSize: "0.85rem" }}
              onClick={() => setShowThresholds(true)}
            >
              <SlidersHorizontal size={16} strokeWidth={1.8} />
              Threshold Configuration
            </button>
          </div>

          {/* Branch filter + search */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {branch.canPickBranch ? (
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setBranchOpen((v) => !v)}
                  style={{
                    display: "flex", alignItems: "center", gap: 20, justifyContent: "space-between",
                    minWidth: 150, padding: "10px 14px", borderRadius: 8, border: "1px solid var(--color-border)",
                    background: "#fff", cursor: "pointer", fontSize: "0.9rem", color: "var(--color-text)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {branch.name}
                  <ChevronDown size={16} strokeWidth={1.8} color="var(--color-text-muted)" />
                </button>
                {branchOpen && (
                  <div
                    style={{
                      position: "absolute", top: "calc(100% + 6px)", left: 0, minWidth: 150,
                      background: "#fff", border: "1px solid var(--color-border)", borderRadius: 10,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.10)", overflow: "hidden", zIndex: 60,
                    }}
                  >
                    {branch.branches.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => { branch.setBranch(b); setBranchOpen(false); }}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
                          padding: "10px 14px", background: b.id === branch.id ? "var(--color-bg-soft)" : "#fff",
                          border: "none", cursor: "pointer", fontSize: "0.85rem", fontFamily: "var(--font-sans)",
                          color: "var(--color-text)", textAlign: "left",
                        }}
                      >
                        {b.id === branch.id && <span style={{ marginRight: 6 }}>✓</span>}
                        {b.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Locked manager (or a mid-load state) — a static, non-interactive
              // chip. No dropdown, nothing to switch, same pattern as the
              // sidebar's own non-picker branch display.
              <div
                title="Your account is scoped to this branch"
                style={{
                  display: "flex", alignItems: "center", minWidth: 150,
                  padding: "10px 14px", borderRadius: 8, border: "1px solid var(--color-border)",
                  background: "var(--color-bg-soft)", fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text)",
                }}
              >
                {branch.name}
              </div>
            )}

            <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
              <Search size={16} strokeWidth={1.8} color="var(--color-text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
              <input
                className="input"
                placeholder="Search inventory..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: "100%", paddingLeft: 38 }}
              />
            </div>
          </div>

          {/* Critical alert */}
          <div className="card" style={{ background: "rgba(225,11,28,0.05)", border: "1px solid rgba(225,11,28,0.25)" }}>
            <p style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 10px", fontWeight: 700, color: "#E10B1C", fontSize: "0.9rem" }}>
              <AlertTriangle size={16} strokeWidth={1.8} />
              Critical Stock Alert
            </p>
            {lowStockLoading && (
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Loading…</p>
            )}
            {!lowStockLoading && !dedupedLowStock.length && (
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>No alerts right now</p>
            )}
            {!lowStockLoading &&
              dedupedLowStock.map((a) => (
                <div key={a.itemId} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", padding: "3px 0" }}>
                  <span style={{ color: "var(--color-text)" }}>{a.itemName}</span>
                  <span style={{ color: "#E10B1C", fontWeight: 600 }}>{a.currentQuantity} {a.unit} left</span>
                </div>
              ))}
          </div>

          {/* Main table */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {itemsLoading && (
              <p style={{ padding: 20, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Loading…</p>
            )}
            {!itemsLoading && (itemsError || !items?.length) && (
              <p style={{ padding: 20, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                No inventory data available
              </p>
            )}
            {!itemsLoading && items && items.length > 0 && (
              <>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <p style={{ margin: 0, fontWeight: 600, color: "var(--color-text)" }}>{item.name}</p>
                            <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-text-muted)" }}>{item.unit}</p>
                          </td>
                          <td>
                            {item.quantities.find((q) => q.branchId === branch.id)?.quantity ?? item.total}
                          </td>
                          <td style={{ fontWeight: 600 }}>{item.total}</td>
                          <td><StatusBadge status={item.status} /></td>
                          <td>
                            <div style={{ display: "flex", gap: 6 }}>
                              <IconButton
                                icon={<Plus size={14} strokeWidth={2} />}
                                onClick={() => setAdjustItem(toModalItem(item, branch.id))}
                              />
                              <IconButton
                                icon={<ArrowLeftRight size={14} strokeWidth={1.8} />}
                                onClick={() => setTransferItem(toModalItem(item, branch.id))}
                              />
                              <IconButton
                                icon={<PackageMinus size={14} strokeWidth={1.8} />}
                                onClick={() => setRemoveItem(toModalItem(item, branch.id))}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <PaginationBar
                  page={page} goToPage={goToPage} pageSize={pageSize} changePageSize={changePageSize}
                  totalPages={totalPages} totalItems={items.length} start={start}
                />
              </>
            )}
          </div>
        </>
      ) : showAddStock ? (
        <AddStockView
          items={items ?? []}
          suppliers={suppliers ?? []}
          branch={branch}
          isSubmitting={isAddingStock}
          onBack={() => setShowAddStock(false)}
          onOpenSupplier={() => setSupplierOpen(true)}
          supplierModalOpen={supplierOpen}
          onSubmit={async (form) => {
            const ok = await addStock({
              itemId: form.itemId,
              branchId: form.branchId,
              quantity: form.qty,
              costPerUnit: form.cost,
              supplierId: form.supplierId || null,
              invoiceNumber: form.invoice || null,
              reason: form.reason,
            });
            if (ok) setShowAddStock(false);
          }}
        />
      ) : (
        <ThresholdView onBack={() => setShowThresholds(false)} />
      )}

      {adjustItem && (
        <AdjustStockModal
          item={adjustItem}
          suppliers={suppliers ?? []}
          onClose={() => setAdjustItem(null)}
          onOpenSupplier={() => setSupplierOpen(true)}
          hidden={supplierOpen}
          onSubmit={async (form) => {
            const ok = await adjustStock({
              itemId: adjustItem.itemId,
              branchId: adjustItem.branchId,
              quantity: form.qty,
              supplierId: form.supplierId || null,
              invoiceNumber: form.invoice || null,
              costPerUnit: form.cost,
              reason: form.reason,
            });
            if (ok) setAdjustItem(null);
          }}
        />
      )}
      {transferItem && (
        <TransferStockModal
          item={transferItem}
          branches={branches ?? []}
          onClose={() => setTransferItem(null)}
          onSubmit={async (form) => {
            const ok = await transferStock({
              itemId: transferItem.itemId,
              fromBranchId: form.fromBranchId,
              toBranchId: form.toBranchId,
              quantity: form.qty,
              approvingManagerId: form.managerId || null,
              reason: form.reason,
            });
            if (ok) setTransferItem(null);
          }}
        />
      )}
      {removeItem && (
        <RemoveStockModal
          item={removeItem}
          onClose={() => setRemoveItem(null)}
          onSubmit={async (form) => {
            const ok = await removeStock({
              itemId: removeItem.itemId,
              branchId: removeItem.branchId,
              quantity: form.qty,
              costPerUnit: form.cost,
              reason: form.reason,
              otherDetails: form.reason.startsWith("Other") ? form.details : null,
            });
            if (ok) setRemoveItem(null);
          }}
        />
      )}
      {supplierOpen && (
        <AddSupplierModal
          onClose={() => setSupplierOpen(false)}
          onSubmit={async (form) => {
            const ok = await addSupplier(form);
            if (ok) setSupplierOpen(false);
          }}
        />
      )}
    </div>
  );
}

/* ── Small shared building blocks ── */

function IconButton({ icon, onClick }: { icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30,
        borderRadius: 8, border: "1px solid var(--color-border)", background: "#fff", cursor: "pointer",
        color: "var(--color-text-muted)",
      }}
    >
      {icon}
    </button>
  );
}

function ModalShell({
  title, onClose, children, width = 460, hidden = false,
}: { title: string; onClose: () => void; children: React.ReactNode; width?: number; hidden?: boolean }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
        display: hidden ? "none" : "flex", alignItems: "flex-start", justifyContent: "center",
        zIndex: 100, padding: "5vh 20px", overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width, maxWidth: "90vw", maxHeight: "88vh", background: "#fff", borderRadius: 14,
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "20px 24px 16px", flexShrink: 0, borderBottom: "1px solid var(--color-border)",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--color-heading)" }}>{title}</h3>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex" }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: "20px 24px 24px", overflowY: "auto" }}>
          {children}
        </div>
      </div>
    </div>
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

function Stepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button onClick={() => onChange(Math.max(0, value - 1))} style={stepperBtn}><Minus size={14} /></button>
      <input
        className="input"
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        style={{ textAlign: "center", flex: 1 }}
      />
      <button onClick={() => onChange(value + 1)} style={stepperBtn}><Plus size={14} /></button>
    </div>
  );
}
const stepperBtn: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 8, border: "1px solid var(--color-border)",
  background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
};

/* ── Adjust Stock modal ── */
function AdjustStockModal({
  item, suppliers, onClose, onOpenSupplier, hidden, onSubmit,
}: {
  item: ModalItem;
  suppliers: { id: string; name: string }[];
  onClose: () => void;
  onOpenSupplier: () => void;
  hidden?: boolean;
  onSubmit: (form: { supplierId: string; invoice: string; qty: number; cost: number; reason: string }) => void;
}) {
  const [supplierId, setSupplierId] = useState("");
  const [invoice, setInvoice] = useState("");
  const [qty, setQty] = useState(20);
  const [cost, setCost] = useState(1200);
  const [reason, setReason] = useState("New delivery received from supplier");
  const newStock = item.current + qty;
  const totalCost = qty * cost;

  return (
    <ModalShell title="Adjust Stock" onClose={onClose} hidden={hidden}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: "var(--color-bg-soft)", marginBottom: 20 }}>
        <span style={{ fontWeight: 600, color: "var(--color-text)" }}>{item.name}</span>
        {item.status && <StatusBadge status={item.status} />}
      </div>

      <Field label="Supplier">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select className="input" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} style={{ flex: 1, minWidth: 160 }}>
            <option value="">Select supplier</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button
            onClick={onOpenSupplier}
            style={{
              padding: "0 14px", height: 42, borderRadius: 8, border: "1px solid var(--color-primary)",
              background: "#fff", color: "var(--color-primary)", fontWeight: 600, fontSize: "0.85rem",
              cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
            }}
          >
            Add New Supplier
          </button>
        </div>
      </Field>

      <Field label="Invoice Number">
        <input className="input" placeholder="INV-12345....." value={invoice} onChange={(e) => setInvoice(e.target.value)} />
      </Field>

      <p style={{ margin: "0 0 6px", fontSize: "0.85rem", color: "var(--color-text)" }}>
        Current: <strong>{item.current} {item.unit}</strong>
      </p>
      <div style={{ marginBottom: 16 }}>
        <Stepper value={qty} onChange={setQty} />
      </div>

      <p style={{ margin: "0 0 16px", fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text)" }}>
        New Stock: {newStock} {item.unit}
      </p>

      <Field label="Cost price per unit">
        <input className="input" type="number" value={cost} onChange={(e) => setCost(Number(e.target.value) || 0)} />
      </Field>

      <p style={{ margin: "-6px 0 16px", fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text)" }}>
        Total cost: ₦{totalCost.toLocaleString()}
      </p>

      <Field label="Reason (required)">
        <textarea className="input" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button onClick={onClose} style={cancelBtn}>Cancel</button>
        <button
          className="btn btn-primary"
          style={{ padding: "9px 18px", fontSize: "0.85rem" }}
          disabled={!reason.trim()}
          onClick={() => onSubmit({ supplierId, invoice, qty, cost, reason })}
        >
          Apply Change
        </button>
      </div>
    </ModalShell>
  );
}

/* ── Transfer Stock modal ── */
function TransferStockModal({
  item, branches, onClose, onSubmit,
}: {
  item: ModalItem;
  branches: { id: string; name: string }[];
  onClose: () => void;
  onSubmit: (form: { fromBranchId: string; toBranchId: string; qty: number; managerId: string; reason: string }) => void;
}) {
  const [fromBranchId, setFromBranchId] = useState(item.branchId || branches[0]?.id || "");
  const [toBranchId, setToBranchId] = useState(branches[1]?.id ?? branches[0]?.id ?? "");
  const [qty, setQty] = useState(20);
  const [managerId, setManagerId] = useState("");
  const [reason, setReason] = useState("High demand, surplus at source branch");
  const needsApproval = qty > 10;

  const branchName = (id: string) => branches.find((b) => b.id === id)?.name ?? "–";

  return (
    <ModalShell title="Transfer Stock" onClose={onClose}>
      <div style={{ padding: "10px 14px", borderRadius: 10, background: "var(--color-bg-soft)", marginBottom: 20, fontWeight: 600, color: "var(--color-text)" }}>
        {item.name}
      </div>

      <p style={{ margin: "0 0 8px", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)" }}>Transfer:</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <Field label="From">
          <select className="input" value={fromBranchId} onChange={(e) => setFromBranchId(e.target.value)}>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </Field>
        <Field label="To">
          <select className="input" value={toBranchId} onChange={(e) => setToBranchId(e.target.value)}>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </Field>
      </div>

      <p style={{ margin: "0 0 6px", fontSize: "0.85rem", color: "var(--color-text)" }}>
        Available Stock: <strong>{item.current} {item.unit}</strong>
      </p>
      <p style={{ margin: "0 0 6px", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)" }}>Quantity to transfer</p>
      <div style={{ marginBottom: 12 }}>
        <Stepper value={qty} onChange={setQty} />
      </div>

      {needsApproval && (
        <p style={{ display: "flex", alignItems: "center", gap: 6, margin: "0 0 16px", fontSize: "0.8rem", color: "#a07a00" }}>
          <AlertTriangle size={14} strokeWidth={1.8} />
          Approval Required: Quantity exceeds 10 units - requires second manager
        </p>
      )}

      <Field label="Approving Manager:">
        <select className="input" value={managerId} onChange={(e) => setManagerId(e.target.value)}>
          <option value="">Select Manager</option>
        </select>
      </Field>

      <Field label="Reason:">
        <textarea className="input" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>

      <div style={{ padding: 14, borderRadius: 10, background: "rgba(225,11,28,0.05)", border: "1px solid rgba(225,11,28,0.25)", marginBottom: 20 }}>
        <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: "0.85rem", color: "var(--color-text)" }}>Transfer will:</p>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem", color: "var(--color-text)" }}>
          <li>Deduct {qty} from {branchName(fromBranchId)}</li>
          <li>Add {qty} to {branchName(toBranchId)}</li>
          <li>Log both transactions</li>
        </ul>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button onClick={onClose} style={cancelBtn}>Cancel</button>
        <button
          className="btn btn-primary"
          style={{ padding: "9px 18px", fontSize: "0.85rem" }}
          disabled={needsApproval && !managerId}
          onClick={() => onSubmit({ fromBranchId, toBranchId, qty, managerId, reason })}
        >
          Confirm Transfer
        </button>
      </div>
    </ModalShell>
  );
}

/* ── Remove Stock Wastage modal ── */
const WASTAGE_REASONS = ["Spoiled / Expired", "Damaged during preparation", "Customer return", "Overproduction", "Other (please specify)"];

function RemoveStockModal({
  item, onClose, onSubmit,
}: {
  item: ModalItem;
  onClose: () => void;
  onSubmit: (form: { qty: number; cost: number; reason: string; details: string }) => void;
}) {
  const [qty, setQty] = useState(3);
  const [cost, setCost] = useState(1200);
  const [reason, setReason] = useState(WASTAGE_REASONS[0]);
  const [details, setDetails] = useState("");
  const newStock = Math.max(0, item.current - qty);
  const totalCost = qty * cost;

  return (
    <ModalShell title="Remove Stock Wastage - Food Items" onClose={onClose}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: "var(--color-bg-soft)", marginBottom: 20 }}>
        <span style={{ fontWeight: 600, color: "var(--color-text)" }}>{item.name}</span>
        {item.status && <StatusBadge status={item.status} />}
      </div>

      <p style={{ margin: "0 0 6px", fontSize: "0.85rem", color: "var(--color-text)" }}>
        Current stock: <strong>{item.current}</strong>
      </p>

      <Field label="Quantity to remove">
        <input className="input" type="number" value={qty} onChange={(e) => setQty(Number(e.target.value) || 0)} />
      </Field>

      <p style={{ margin: "-6px 0 16px", fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text)" }}>New Stock: {newStock}</p>

      <Field label="Cost price per unit">
        <input className="input" type="number" value={cost} onChange={(e) => setCost(Number(e.target.value) || 0)} />
      </Field>

      <p style={{ margin: "-6px 0 16px", fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text)" }}>
        Total cost: ₦{totalCost.toLocaleString()}
      </p>

      <Field label="Wastage Reason">
        <select className="input" value={reason} onChange={(e) => setReason(e.target.value)}>
          {WASTAGE_REASONS.map((r) => <option key={r}>{r}</option>)}
        </select>
      </Field>

      {reason.startsWith("Other") && (
        <Field label="Other details (please specify)">
          <input className="input" value={details} onChange={(e) => setDetails(e.target.value)} />
        </Field>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button onClick={onClose} style={cancelBtn}>Cancel</button>
        <button
          className="btn btn-primary"
          style={{ padding: "9px 18px", fontSize: "0.85rem" }}
          disabled={reason.startsWith("Other") && !details.trim()}
          onClick={() => onSubmit({ qty, cost, reason, details })}
        >
          Remove
        </button>
      </div>
    </ModalShell>
  );
}

/* ── Add New Supplier modal ──
   Fields match POST /admin/suppliers per Swagger: name, type,
   contactPerson, phone, address. `type` renders as `{}` in Swagger's
   example (usually means an unset-sample enum) — left as free text
   until the real enum values are confirmed via the Schema tab, rather
   than guessing wrong options for a <select>. */
function AddSupplierModal({
  onClose, onSubmit,
}: {
  onClose: () => void;
  onSubmit: (form: { name: string; type: string; contactPerson: string; phone: string; address: string }) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  return (
    <ModalShell title="Add New Supplier" onClose={onClose} width={420}>
      <Field label="Name">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Type">
        <input className="input" value={type} onChange={(e) => setType(e.target.value)} placeholder="e.g. Food, Beverage" />
      </Field>
      <Field label="Contact Person">
        <input className="input" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
      </Field>
      <Field label="Phone">
        <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </Field>
      <Field label="Address">
        <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
      </Field>
      <button
        className="btn btn-primary"
        style={{ width: "100%", padding: "10px 0", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center" }}
        disabled={!name.trim() || !contactPerson.trim() || !phone.trim()}
        onClick={() => onSubmit({ name, type, contactPerson, phone, address })}
      >
        Add
      </button>
    </ModalShell>
  );
}

/* ── Add Stock view — full page, same pattern as ThresholdView ──
   Reached only from the "Add Stock" button on the main inventory page
   and returns there the same way (Back link), rather than being a
   modal. Item picker searches the already-loaded `items` list (the
   same data backing the main table) so there's no separate menu-search
   endpoint dependency here. */
function AddStockView({
  items, suppliers, branch, isSubmitting, onBack, onOpenSupplier, supplierModalOpen, onSubmit,
}: {
  items: StockItem[];
  suppliers: { id: string; name: string }[];
  branch: { id: string; name: string; canPickBranch: boolean; branches: { id: string; name: string }[] };
  isSubmitting: boolean;
  onBack: () => void;
  onOpenSupplier: () => void;
  supplierModalOpen: boolean;
  onSubmit: (form: {
    itemId: string;
    branchId: string;
    qty: number;
    cost: number;
    supplierId: string;
    invoice: string;
    reason: string;
  }) => void;
}) {
  const [itemQuery, setItemQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [branchId, setBranchId] = useState(branch.id);
  const [supplierId, setSupplierId] = useState("");
  const [invoice, setInvoice] = useState("");
  const [qty, setQty] = useState(20);
  const [cost, setCost] = useState(0);
  const [reason, setReason] = useState("New delivery received from supplier");

  const filteredItems = itemQuery.trim()
    ? items.filter((i) => i.name.toLowerCase().includes(itemQuery.trim().toLowerCase()))
    : [];

  const currentAtBranch =
    selectedItem?.quantities.find((q) => q.branchId === branchId)?.quantity ?? 0;
  const newStock = currentAtBranch + qty;
  const totalCost = qty * cost;

  const canSubmit = !!selectedItem && !!branchId && qty > 0 && reason.trim().length > 0 && !isSubmitting;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "relative" }}>
      {/* Real navigation, not a decoy button — same pattern as
          ThresholdView's back link below. */}
      <button
        onClick={onBack}
        style={{
          display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
          cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-primary)",
          fontFamily: "var(--font-sans)", padding: 0, alignSelf: "flex-start",
        }}
      >
        ← Back to Stock Inventory
      </button>

      <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 600, color: "var(--color-heading)" }}>
        Add Stock
      </h2>

      <div className="card">
        <Field label="Item">
          {selectedItem ? (
            <div
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px", borderRadius: 8, background: "var(--color-bg-soft)",
              }}
            >
              <div>
                <p style={{ margin: 0, fontWeight: 600, color: "var(--color-text)" }}>{selectedItem.name}</p>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-text-muted)" }}>{selectedItem.unit}</p>
              </div>
              <button
                onClick={() => { setSelectedItem(null); setItemQuery(""); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-primary)", fontSize: "0.8rem", fontWeight: 600, fontFamily: "var(--font-sans)" }}
              >
                Change
              </button>
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              <Search size={16} strokeWidth={1.8} color="var(--color-text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
              <input
                className="input"
                placeholder="Search item to restock..."
                value={itemQuery}
                onChange={(e) => setItemQuery(e.target.value)}
                style={{ width: "100%", paddingLeft: 38 }}
                autoFocus
              />
              {filteredItems.length > 0 && (
                <div
                  style={{
                    marginTop: 6, border: "1px solid var(--color-border)", borderRadius: 8,
                    maxHeight: 220, overflowY: "auto", background: "#fff",
                  }}
                >
                  {filteredItems.slice(0, 8).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setSelectedItem(item); setCost(item.costPerUnit || 0); }}
                      style={{
                        display: "block", width: "100%", textAlign: "left", padding: "10px 14px",
                        background: "none", border: "none", borderBottom: "1px solid var(--color-border)",
                        fontSize: "0.85rem", color: "var(--color-text)", cursor: "pointer", fontFamily: "var(--font-sans)",
                      }}
                    >
                      {item.name} <span style={{ color: "var(--color-text-muted)" }}>· {item.unit}</span>
                    </button>
                  ))}
                </div>
              )}
              {itemQuery.trim() && filteredItems.length === 0 && (
                <p style={{ margin: "6px 0 0", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                  No matching items in this branch&apos;s inventory.
                </p>
              )}
            </div>
          )}
        </Field>

        {branch.canPickBranch && (
          <Field label="Branch">
            <select className="input" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              {branch.branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Supplier">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select className="input" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} style={{ flex: 1, minWidth: 160 }}>
              <option value="">Select supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <button
              onClick={onOpenSupplier}
              style={{
                padding: "0 14px", height: 42, borderRadius: 8, border: "1px solid var(--color-primary)",
                background: "#fff", color: "var(--color-primary)", fontWeight: 600, fontSize: "0.85rem",
                cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
              }}
            >
              Add New Supplier
            </button>
          </div>
        </Field>

        <Field label="Invoice Number">
          <input className="input" placeholder="INV-12345....." value={invoice} onChange={(e) => setInvoice(e.target.value)} />
        </Field>

        {selectedItem && (
          <p style={{ margin: "0 0 6px", fontSize: "0.85rem", color: "var(--color-text)" }}>
            Current at {branch.branches.find((b) => b.id === branchId)?.name ?? branch.name}: <strong>{currentAtBranch} {selectedItem.unit}</strong>
          </p>
        )}
        <div style={{ marginBottom: 16 }}>
          <Stepper value={qty} onChange={setQty} />
        </div>

        {selectedItem && (
          <p style={{ margin: "0 0 16px", fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text)" }}>
            New Stock: {newStock} {selectedItem.unit}
          </p>
        )}

        <Field label="Cost price per unit">
          <input className="input" type="number" value={cost} onChange={(e) => setCost(Number(e.target.value) || 0)} />
        </Field>

        <p style={{ margin: "-6px 0 16px", fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text)" }}>
          Total cost: ₦{totalCost.toLocaleString()}
        </p>

        <Field label="Reason (required)">
          <textarea className="input" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onBack} style={cancelBtn}>Cancel</button>
          <button
            className="btn btn-primary"
            style={{ padding: "9px 18px", fontSize: "0.85rem", opacity: canSubmit ? 1 : 0.6 }}
            disabled={!canSubmit}
            onClick={() =>
              selectedItem &&
              onSubmit({ itemId: selectedItem.id, branchId, qty, cost, supplierId, invoice, reason })
            }
          >
            {isSubmitting ? "Adding…" : "Add Stock"}
          </button>
        </div>
      </div>

      {supplierModalOpen && (
        // Rendered by the parent page (shares the same AddSupplierModal
        // instance used elsewhere) — this component just triggers it via
        // onOpenSupplier and doesn't own the modal itself.
        <></>
      )}
    </div>
  );
}

/* ── Threshold Configuration view ── */

type ThresholdRow = {
  itemId: string;
  itemName: string;
  unit: string;
  threshold: number;
  notify: boolean;
  autoReorder: boolean;
};

function ThresholdView({ onBack }: { onBack: () => void }) {
  const { thresholds, thresholdsLoading, thresholdsError, savingThresholds, fetchThresholds, saveThresholds } =
    useStockStore();
  const [search, setSearch] = useState("");
  const [defaultThreshold, setDefaultThreshold] = useState(10);
  const [rows, setRows] = useState<ThresholdRow[]>([]);

  useEffect(() => {
    fetchThresholds();
  }, [fetchThresholds]);

  useEffect(() => {
    if (thresholds) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDefaultThreshold(thresholds.defaultThreshold);
      setRows(thresholds.items);
    }
  }, [thresholds]);

  const updateRow = (itemId: string, patch: Partial<ThresholdRow>) =>
    setRows((prev) => prev.map((r) => (r.itemId === itemId ? { ...r, ...patch } : r)));

  // defensive de-dupe: guards the UI even if the API sends a duplicate itemId
  const filtered = rows
    .filter((r) => r.itemName.toLowerCase().includes(search.toLowerCase()))
    .filter((r, i, arr) => arr.findIndex((x) => x.itemId === r.itemId) === i);

  const { page, goToPage, pageSize, changePageSize, totalPages, pageItems, start } = usePagination(filtered, 10);

  return (
    <>
      {/* Real navigation, not a decoy button row — this view is reached
          from one place (Threshold Configuration) and should return
          there the same way, not fake Adjust/Transfer/Remove buttons
          that just call onBack regardless of which was clicked. */}
      <button
        onClick={onBack}
        style={{
          display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
          cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-primary)",
          fontFamily: "var(--font-sans)", padding: 0, alignSelf: "flex-start",
        }}
      >
        ← Back to Stock Inventory
      </button>

      <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 600, color: "var(--color-heading)" }}>
        Low Stock Thresholds
      </h2>

      <Field label="Default threshold for all food items">
        <input
          className="input"
          value={`${defaultThreshold} units`}
          onChange={(e) => setDefaultThreshold(Number(e.target.value.replace(/\D/g, "")) || 0)}
          style={{ maxWidth: 260 }}
        />
      </Field>

      <div style={{ position: "relative" }}>
        <Search size={16} strokeWidth={1.8} color="var(--color-text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
        <input
          className="input"
          placeholder="Search Item specific thresholds..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", paddingLeft: 38 }}
        />
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "18px 20px 4px" }}>
          <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.04em", color: "var(--color-text-muted)" }}>
            ITEM SPECIFIC THRESHOLDS
          </p>
        </div>

        {thresholdsLoading && (
          <p style={{ padding: 20, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Loading…</p>
        )}
        {!thresholdsLoading && (thresholdsError || !rows.length) && (
          <p style={{ padding: 20, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            No threshold data available
          </p>
        )}
        {!thresholdsLoading && rows.length > 0 && (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    {["Item", "Threshold", "Notify?", "Auto-reorder"].map((c) => <th key={c}>{c}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((row) => (
                    <tr key={row.itemId}>
                      <td>
                        <p style={{ margin: 0, fontWeight: 600, color: "var(--color-text)" }}>{row.itemName}</p>
                        <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-text-muted)" }}>{row.unit}</p>
                      </td>
                      <td>
                        <input
                          className="input"
                          type="number"
                          value={row.threshold}
                          onChange={(e) => updateRow(row.itemId, { threshold: Number(e.target.value) || 0 })}
                          style={{ width: 90 }}
                        />
                      </td>
                      <td>
                        <Radio checked={row.notify} onClick={() => updateRow(row.itemId, { notify: !row.notify })} label="Yes" />
                      </td>
                      <td>
                        <Radio checked={row.autoReorder} onClick={() => updateRow(row.itemId, { autoReorder: !row.autoReorder })} label="Yes" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationBar
              page={page} goToPage={goToPage} pageSize={pageSize} changePageSize={changePageSize}
              totalPages={totalPages} totalItems={filtered.length} start={start}
            />
          </>
        )}
      </div>

      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
        Auto-Reorder: When stock reaches threshold, system can auto-generate purchase order for manager approval.
      </p>

      <div>
        <button
          className="btn btn-primary"
          style={{ padding: "10px 20px", fontSize: "0.85rem" }}
          disabled={savingThresholds}
          onClick={() =>
            saveThresholds({
              defaultThreshold,
              items: rows.map((r) => ({
                itemId: r.itemId,
                threshold: r.threshold,
                notify: r.notify,
                autoReorder: r.autoReorder,
              })),
            })
          }
        >
          {savingThresholds ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </>
  );
}

function Radio({ checked, onClick, label }: { checked: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: "0.85rem", color: "var(--color-text)" }}
    >
      <span
        style={{
          width: 16, height: 16, borderRadius: "50%", border: `1.5px solid ${checked ? "var(--color-primary)" : "var(--color-border)"}`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}
      >
        {checked && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-primary)" }} />}
      </span>
      {label}
    </button>
  );
}

const cancelBtn: React.CSSProperties = {
  padding: "9px 18px", borderRadius: 8, border: "1px solid var(--color-border)", background: "#fff",
  cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)", fontFamily: "var(--font-sans)",
};