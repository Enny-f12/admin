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
  ChevronRight,
  X,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from "lucide-react";
import { useEffect } from "react";
import { useStockStore } from "@/store/useStockStore";
import { useAuthStore } from "@/store/useAuthStore";
import { StockItem, StockStatus, StockItemType, SupplierType } from "@/types/stock.types";
import { useBranch } from "../../layout";

type ModalItem = {
  itemId: string;
  menuItemId: string;
  name: string;
  unit: string;
  itemType: StockItemType;
  status?: StockStatus;
  current: number;        // food: quantity. drinks: fridgeQty (the sellable number)
  warehouseQty?: number;  // drinks only
  branchId: string;
};

const STATUS_CLASS: Record<StockStatus, string> = {
  "In Stock": "badge badge-green",
  "Low Stock": "badge badge-yellow",
  Critical: "badge badge-red",
};

const CRITICAL_ALERTS_PREVIEW_COUNT = 5;

const StatusBadge = ({ status }: { status: StockStatus }) => (
  <span className={STATUS_CLASS[status]} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
    {status === "In Stock" && <TrendingUp size={12} strokeWidth={2} />}
    {status === "Low Stock" && <TrendingDown size={12} strokeWidth={2} />}
    {status === "Critical" && <AlertTriangle size={12} strokeWidth={2} />}
    {status}
  </span>
);

const ItemTypeBadge = ({ itemType }: { itemType: StockItemType }) => (
  <span
    style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 6, fontSize: "0.7rem",
      fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em",
      background: itemType === "drink" ? "rgba(24,95,165,0.08)" : "rgba(15,110,86,0.08)",
      color: itemType === "drink" ? "#185FA5" : "#0F6E56",
    }}
  >
    {itemType}
  </span>
);

/* ── Pagination hook + bar (shared by both tables) ── */
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
        <button disabled={page <= 1} onClick={() => goToPage(page - 1)} className="pager-btn" style={pagerBtn(page <= 1)}>
          Prev
        </button>
        <span style={{ fontSize: "0.8rem", color: "var(--color-text)" }}>
          Page {page} of {totalPages}
        </span>
        <button disabled={page >= totalPages} onClick={() => goToPage(page + 1)} className="pager-btn" style={pagerBtn(page >= totalPages)}>
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
  transition: "background 0.15s ease, border-color 0.15s ease, transform 0.15s ease",
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
    transferStock,
    removeStock,
    addSupplier,
    resyncMenu,
    isResyncingMenu,
  } = useStockStore();

  const branch = useBranch();

  const user = useAuthStore((s) => s.user);
  const isApprover = user?.role === "SUPER_ADMIN" || user?.role === "MANAGER";

  const [branchOpen, setBranchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showThresholds, setShowThresholds] = useState(false);

  const [adjustItem, setAdjustItem] = useState<ModalItem | null>(null);
  const [transferItem, setTransferItem] = useState<ModalItem | null>(null);
  const [removeItem, setRemoveItem] = useState<ModalItem | null>(null);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [criticalAlertsOpen, setCriticalAlertsOpen] = useState(false);

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

  const dedupedLowStock = (lowStock ?? []).filter(
    (a, i, arr) => arr.findIndex((x) => x.itemId === a.itemId) === i,
  );
  const previewLowStock = dedupedLowStock.slice(0, CRITICAL_ALERTS_PREVIEW_COUNT);
  const remainingLowStockCount = dedupedLowStock.length - previewLowStock.length;

  const { page, goToPage, pageSize, changePageSize, totalPages, pageItems, start } = usePagination(items ?? [], 10);

  // Reads the right "current" number for a row/branch depending on
  // itemType — food's `quantity`, or a drink's `fridgeQty` (the number
  // that actually matters for selling/low-stock purposes). Warehouse is
  // carried separately for the drink-specific modals.
  const toModalItem = (item: StockItem, fallbackBranchId?: string): ModalItem => {
    const bq =
      item.quantities.find((q) => q.branchId === fallbackBranchId) ?? item.quantities[0];
    const current = item.itemType === "drink" ? (bq?.fridgeQty ?? 0) : (bq?.quantity ?? item.total);
    return {
      itemId: item.id,
      menuItemId: item.menuItemId,
      name: item.name,
      unit: item.unit,
      itemType: item.itemType,
      status: item.status,
      current,
      warehouseQty: item.itemType === "drink" ? bq?.warehouseQty ?? 0 : undefined,
      branchId: bq?.branchId ?? "",
    };
  };

  const displayQuantity = (item: StockItem) => {
    const bq = item.quantities.find((q) => q.branchId === branch.id) ?? item.quantities[0];
    if (item.itemType === "drink") {
      return `Warehouse ${bq?.warehouseQty ?? 0} / Fridge ${bq?.fridgeQty ?? 0}`;
    }
    return bq?.quantity ?? item.total;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, position: "relative" }}>

      {!showThresholds ? (
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

          {/*
            "Add Stock" is intentionally gone. There is no such thing as
            a stock item that isn't a menu item — ingredients/raw
            materials are out of scope entirely. Every row here traces
            back to a MenuItem via menuItemId, created automatically
            when that item is added in Menu Management. If a menu item
            is missing from this list (e.g. it predates that fix, or
            the cascade failed), use Resync Menu below instead of
            typing a new item in by hand.
          */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <button
              className="btn btn-primary"
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", fontSize: "0.85rem" }}
              onClick={() => resyncMenu()}
              disabled={isResyncingMenu}
            >
              <RefreshCw size={16} strokeWidth={1.8} className={isResyncingMenu ? "spin" : undefined} />
              {isResyncingMenu ? "Syncing…" : "Resync Menu"}
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
                  <ChevronDown
                    size={16}
                    strokeWidth={1.8}
                    color="var(--color-text-muted)"
                    style={{ transition: "transform 0.2s ease", transform: branchOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </button>
                {branchOpen && (
                  <div
                    className="fade-in-down"
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
                          color: "var(--color-text)", textAlign: "left", transition: "background 0.15s ease",
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
              previewLowStock.map((a) => (
                <div key={a.itemId} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", padding: "3px 0" }}>
                  <span style={{ color: "var(--color-text)" }}>
                    {a.itemName} <ItemTypeBadge itemType={a.itemType} />
                  </span>
                  <span style={{ color: "#E10B1C", fontWeight: 600 }}>{a.currentQuantity} {a.unit} left</span>
                </div>
              ))}
            {!lowStockLoading && remainingLowStockCount > 0 && (
              <button
                onClick={() => setCriticalAlertsOpen(true)}
                className="view-more-btn"
                style={{
                  display: "flex", alignItems: "center", gap: 4, marginTop: 10, padding: "6px 0",
                  background: "none", border: "none", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600,
                  color: "#E10B1C", fontFamily: "var(--font-sans)",
                }}
              >
                View {remainingLowStockCount} more
                <ChevronRight size={14} strokeWidth={2} className="view-more-chevron" />
              </button>
            )}
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
                        <th>Type</th>
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
                          <td><ItemTypeBadge itemType={item.itemType} /></td>
                          <td>{displayQuantity(item)}</td>
                          <td style={{ fontWeight: 600 }}>{item.total}</td>
                          <td><StatusBadge status={item.status} /></td>
                          <td>
                            <div style={{ display: "flex", gap: 6 }}>
                              <IconButton
                                icon={<Plus size={14} strokeWidth={2} />}
                                title="Adjust stock"
                                onClick={() => setAdjustItem(toModalItem(item, branch.id))}
                              />
                              <IconButton
                                icon={<ArrowLeftRight size={14} strokeWidth={1.8} />}
                                title="Transfer between branches"
                                onClick={() => setTransferItem(toModalItem(item, branch.id))}
                              />
                              <IconButton
                                icon={<PackageMinus size={14} strokeWidth={1.8} />}
                                title="Remove / wastage"
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
      ) : (
        <ThresholdView onBack={() => setShowThresholds(false)} />
      )}

      {criticalAlertsOpen && (
        <CriticalAlertsModal alerts={dedupedLowStock} onClose={() => setCriticalAlertsOpen(false)} />
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
              menuItemId: adjustItem.menuItemId,
              branchId: adjustItem.branchId,
              quantity: form.qty,
              destination: form.destination,
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
          isApprover={isApprover}
          currentUser={user ? { id: user.id, fullName: user.fullName } : undefined}
          onClose={() => setTransferItem(null)}
          onSubmit={async (form) => {
            const ok = await transferStock({
              itemId: transferItem.itemId,
              menuItemId: transferItem.menuItemId,
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
              menuItemId: removeItem.menuItemId,
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

      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }

        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in-down { animation: fadeInDown 0.16s cubic-bezier(0.16, 1, 0.3, 1); }

        @keyframes backdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .modal-backdrop { animation: backdropIn 0.18s ease-out; }
        .modal-shell { animation: modalIn 0.22s cubic-bezier(0.16, 1, 0.3, 1); }

        @keyframes rowFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .row-fade-in { animation: rowFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) backwards; }

        .view-more-btn { transition: gap 0.15s ease, opacity 0.15s ease; }
        .view-more-btn:hover { opacity: 0.75; gap: 7px; }
        .view-more-chevron { transition: transform 0.15s ease; }
        .view-more-btn:hover .view-more-chevron { transform: translateX(2px); }

        .pager-btn:not(:disabled):hover { background: var(--color-bg-soft); transform: translateY(-1px); }
        .pager-btn:not(:disabled):active { transform: translateY(0); }
      `}</style>
    </div>
  );
}

/* ── Small shared building blocks ── */

function IconButton({ icon, onClick, title }: { icon: React.ReactNode; onClick: () => void; title?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30,
        borderRadius: 8, border: "1px solid var(--color-border)", background: "#fff", cursor: "pointer",
        color: "var(--color-text-muted)", transition: "background 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--color-bg-soft)";
        e.currentTarget.style.color = "var(--color-text)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#fff";
        e.currentTarget.style.color = "var(--color-text-muted)";
        e.currentTarget.style.transform = "translateY(0)";
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
      className="modal-backdrop"
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
        display: hidden ? "none" : "flex", alignItems: "flex-start", justifyContent: "center",
        zIndex: 100, padding: "5vh 20px", overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-shell"
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
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)",
              display: "flex", padding: 4, borderRadius: 6, transition: "background 0.15s ease, color 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-bg-soft)"; e.currentTarget.style.color = "var(--color-text)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--color-text-muted)"; }}
          >
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
  transition: "background 0.15s ease, transform 0.1s ease",
};

/* ── Critical Alerts modal — full list, opened from "View more" ──
   Reuses the same row layout as the inline preview, just without the
   5-item cap. Rows stagger in slightly on open rather than popping
   in all at once. */
function CriticalAlertsModal({
  alerts, onClose,
}: {
  alerts: { itemId: string; itemName: string; itemType: StockItemType; currentQuantity: number; unit: string }[];
  onClose: () => void;
}) {
  return (
    <ModalShell title="Critical Stock Alerts" onClose={onClose} width={480}>
      {!alerts.length && (
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>No alerts right now</p>
      )}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {alerts.map((a, i) => (
          <div
            key={a.itemId}
            className="row-fade-in"
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.9rem",
              padding: "10px 0", borderBottom: i < alerts.length - 1 ? "1px solid var(--color-border)" : "none",
              animationDelay: `${Math.min(i, 10) * 25}ms`,
            }}
          >
            <span style={{ color: "var(--color-text)", display: "flex", alignItems: "center", gap: 8 }}>
              {a.itemName} <ItemTypeBadge itemType={a.itemType} />
            </span>
            <span style={{ color: "#E10B1C", fontWeight: 600 }}>{a.currentQuantity} {a.unit} left</span>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}

/* ── Adjust Stock modal — the ONE add-stock action, both types ──
   Food: supplier is optional (blank = in-house/kitchen production, not
   an error). Drinks: an extra "Add to" toggle picks warehouse vs
   fridge — everything else about the form is identical.
   qty/cost default to 0, not 20/1200 — those were placeholder example
   values that were leaking into real submissions. */
function AdjustStockModal({
  item, suppliers, onClose, onOpenSupplier, hidden, onSubmit,
}: {
  item: ModalItem;
  suppliers: { id: string; name: string }[];
  onClose: () => void;
  onOpenSupplier: () => void;
  hidden?: boolean;
  onSubmit: (form: {
    supplierId: string;
    invoice: string;
    qty: number;
    cost: number;
    reason: string;
    destination?: "warehouse" | "fridge";
  }) => void;
}) {
  const isDrink = item.itemType === "drink";
  const [supplierId, setSupplierId] = useState("");
  const [invoice, setInvoice] = useState("");
  const [destination, setDestination] = useState<"warehouse" | "fridge">("warehouse");
  const [qty, setQty] = useState(0);
  const [cost, setCost] = useState(0);
  const [reason, setReason] = useState("");

  const currentForDestination = isDrink
    ? (destination === "warehouse" ? item.warehouseQty ?? 0 : item.current)
    : item.current;
  const newStock = currentForDestination + qty;
  const totalCost = qty * cost;

  return (
    <ModalShell title="Adjust Stock" onClose={onClose} hidden={hidden}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: "var(--color-bg-soft)", marginBottom: 20 }}>
        <span style={{ fontWeight: 600, color: "var(--color-text)" }}>{item.name}</span>
        {item.status && <StatusBadge status={item.status} />}
      </div>

      {isDrink && (
        <Field label="Add to">
          <div style={{ display: "flex", gap: 8 }}>
            {(["warehouse", "fridge"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDestination(d)}
                style={{
                  flex: 1, padding: "8px 0", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600,
                  border: `1.5px solid ${destination === d ? "var(--color-primary)" : "var(--color-border)"}`,
                  background: destination === d ? "rgba(225,11,28,0.05)" : "#fff",
                  color: destination === d ? "var(--color-primary)" : "var(--color-text)",
                  cursor: "pointer", fontFamily: "var(--font-sans)", textTransform: "capitalize",
                  transition: "background 0.15s ease, border-color 0.15s ease, color 0.15s ease",
                }}
              >
                {d}
              </button>
            ))}
          </div>
          <p style={{ margin: "6px 0 0", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            {destination === "warehouse"
              ? "Bulk stock from a supplier delivery. Move it to fridge later when needed."
              : "Direct top-up of ready-to-serve stock (skips the warehouse step)."}
          </p>
        </Field>
      )}

      <Field label={`Supplier${isDrink ? "" : " (optional — leave blank for in-house kitchen production)"}`}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select className="input" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} style={{ flex: 1, minWidth: 160 }}>
            <option value="">{isDrink ? "Select supplier" : "None — restaurant (in-house)"}</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button
            onClick={onOpenSupplier}
            style={{
              padding: "0 14px", height: 42, borderRadius: 8, border: "1px solid var(--color-primary)",
              background: "#fff", color: "var(--color-primary)", fontWeight: 600, fontSize: "0.85rem",
              cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, transition: "background 0.15s ease",
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
        Current{isDrink ? ` (${destination})` : ""}: <strong>{currentForDestination} {item.unit}</strong>
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
        <textarea className="input" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={isDrink ? "e.g. New delivery received from supplier" : "e.g. Extra batch prepared in kitchen"} />
      </Field>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button onClick={onClose} style={cancelBtn}>Cancel</button>
        <button
          className="btn btn-primary"
          style={{ padding: "9px 18px", fontSize: "0.85rem" }}
          disabled={!reason.trim() || qty === 0}
          onClick={() => onSubmit({ supplierId, invoice, qty, cost, reason, destination: isDrink ? destination : undefined })}
        >
          Apply Change
        </button>
      </div>
    </ModalShell>
  );
}

/* ── Transfer Stock modal — branch to branch, works for both types ──
   Food transfers `quantity`; drinks transfer `fridgeQty` (the sellable
   number) — warehouse stock never moves between branches here. */
function TransferStockModal({
  item, branches, isApprover, currentUser, onClose, onSubmit,
}: {
  item: ModalItem;
  branches: { id: string; name: string }[];
  isApprover?: boolean;
  currentUser?: { id: string; fullName: string };
  onClose: () => void;
  onSubmit: (form: { fromBranchId: string; toBranchId: string; qty: number; managerId: string; reason: string }) => void;
}) {
  const [fromBranchId, setFromBranchId] = useState(item.branchId || branches[0]?.id || "");
  const [toBranchId, setToBranchId] = useState(branches[1]?.id ?? branches[0]?.id ?? "");
  const [qty, setQty] = useState(0);
  const managerId = isApprover ? (currentUser?.id ?? "") : "";
  const [reason, setReason] = useState("");
  const needsApproval = qty > 10;
  const canApprove = isApprover && !!managerId;

  const branchName = (id: string) => branches.find((b) => b.id === id)?.name ?? "–";

  return (
    <ModalShell title="Transfer Stock" onClose={onClose}>
      <div style={{ padding: "10px 14px", borderRadius: 10, background: "var(--color-bg-soft)", marginBottom: 20, fontWeight: 600, color: "var(--color-text)" }}>
        {item.name} <ItemTypeBadge itemType={item.itemType} />
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
        {item.itemType === "drink" && " (fridge)"}
      </p>
      <p style={{ margin: "0 0 6px", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)" }}>Quantity to transfer</p>
      <div style={{ marginBottom: 12 }}>
        <Stepper value={qty} onChange={setQty} />
      </div>

      {needsApproval && (
        <p style={{ display: "flex", alignItems: "center", gap: 6, margin: "0 0 16px", fontSize: "0.8rem", color: "#a07a00" }}>
          <AlertTriangle size={14} strokeWidth={1.8} />
          Approval Required: Quantity exceeds 10 units - requires manager approval
        </p>
      )}

      {needsApproval && (
        isApprover ? (
          <p style={{ margin: "0 0 16px", fontSize: "0.85rem", color: "var(--color-text)" }}>
            Approving Manager: <strong>{currentUser?.fullName ?? "You"}</strong>
          </p>
        ) : (
          <p style={{ margin: "0 0 16px", fontSize: "0.8rem", color: "#E10B1C" }}>
            Only a Manager or Super Admin can approve a transfer over 10 units. Please ask a manager to complete this transfer, or reduce the quantity to 10 or below.
          </p>
        )
      )}

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
          disabled={(needsApproval && !canApprove) || qty === 0 || !reason.trim()}
          onClick={() => onSubmit({ fromBranchId, toBranchId, qty, managerId, reason })}
        >
          Confirm Transfer
        </button>
      </div>
    </ModalShell>
  );
}

/* ── Remove Stock Wastage modal — works for both types.
   Food removes from `quantity`; drinks remove from `fridgeQty` only. ── */
const WASTAGE_REASONS = ["Spoiled / Expired", "Damaged during preparation", "Customer return", "Overproduction", "Other (please specify)"];

function RemoveStockModal({
  item, onClose, onSubmit,
}: {
  item: ModalItem;
  onClose: () => void;
  onSubmit: (form: { qty: number; cost: number; reason: string; details: string }) => void;
}) {
  const [qty, setQty] = useState(0);
  const [cost, setCost] = useState(0);
  const [reason, setReason] = useState(WASTAGE_REASONS[0]);
  const [details, setDetails] = useState("");
  const newStock = Math.max(0, item.current - qty);
  const totalCost = qty * cost;

  return (
    <ModalShell title={`Remove Stock Wastage — ${item.itemType === "drink" ? "Fridge" : "Food"} Items`} onClose={onClose}>
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
          disabled={qty === 0 || (reason.startsWith("Other") && !details.trim())}
          onClick={() => onSubmit({ qty, cost, reason, details })}
        >
          Remove
        </button>
      </div>
    </ModalShell>
  );
}

/* ── Add New Supplier modal — unchanged ── */
const SUPPLIER_TYPES: SupplierType[] = ["Beverage Supplier", "Food Supplier", "Packaging Supplier"];

function AddSupplierModal({
  onClose, onSubmit,
}: {
  onClose: () => void;
  onSubmit: (form: { name: string; type: SupplierType; contactPerson: string; phone: string; address: string }) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<SupplierType | "">("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const canSave = name.trim() && type && contactPerson.trim() && phone.trim();

  return (
    <ModalShell title="Add New Supplier" onClose={onClose} width={420}>
      <Field label="Name">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Type">
        <select className="input" value={type} onChange={(e) => setType(e.target.value as SupplierType)}>
          <option value="">Select type</option>
          {SUPPLIER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
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
        disabled={!canSave}
        onClick={() => onSubmit({ name, type: type as SupplierType, contactPerson, phone, address })}
      >
        Add
      </button>
    </ModalShell>
  );
}

/*
 * ── DISABLED: "Add Stock" view (freeform new-item registration) ──
 * Removed from the main render entirely. Ingredients are out of scope
 * for this system, and there is no such thing as a stock item without
 * a menuItemId — every row must originate from Menu Management. Kept
 * here, commented, only as a historical reference for what the old
 * flow looked like; do not restore without re-checking the backend.
 *
 * function AddStockView({ ... }) { ... }
 */

/* ── Threshold Configuration view ── */

type ThresholdRow = {
  itemId: string;
  itemName: string;
  itemType: StockItemType;
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

  const filtered = rows
    .filter((r) => r.itemName.toLowerCase().includes(search.toLowerCase()))
    .filter((r, i, arr) => arr.findIndex((x) => x.itemId === r.itemId) === i);

  const { page, goToPage, pageSize, changePageSize, totalPages, pageItems, start } = usePagination(filtered, 10);

  return (
    <>
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

      <Field label="Default threshold for all items">
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
                    {["Item", "Type", "Threshold", "Notify?", "Auto-reorder"].map((c) => <th key={c}>{c}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((row) => (
                    <tr key={row.itemId}>
                      <td>
                        <p style={{ margin: 0, fontWeight: 600, color: "var(--color-text)" }}>{row.itemName}</p>
                        <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-text-muted)" }}>{row.unit}</p>
                      </td>
                      <td><ItemTypeBadge itemType={row.itemType} /></td>
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
        For drinks, the threshold applies to fridge stock only — warehouse stock is never checked against thresholds.
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
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "border-color 0.15s ease",
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
  transition: "background 0.15s ease, transform 0.1s ease",
};