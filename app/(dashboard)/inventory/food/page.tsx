// app/(admin)/inventory/page.tsx — full file
//
// This page used to pull from its own useInventoryDashboardStore, which
// called /admin/food-inventory/* and /admin/drinks/* — a completely
// separate data source from the Stock Inventory page's /admin/stock/*.
// Two independent write paths for the same numbers is how they drifted
// apart (a stock adjustment made on one page never showed up on the
// other). Fixed by sourcing this page from useStockStore directly —
// the exact same store, same cache, same actions as
// app/(admin)/inventory/stock/page.tsx. There is only one Inventory
// now; this page is just a food/drinks-split VIEW over it.

"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Upload,
  Download,
  HashIcon,
  Plus,
  Minus,
  ArrowLeftRight,
  PackageMinus,
  Check,
  ChefHat,
  GlassWater,
  X,
} from "lucide-react";
import { useStockStore } from "@/store/useStockStore";
import { StockItem, StockStatus, StockItemType } from "@/types/stock.types";
import { useBranch } from "../../layout";

const STATUS_OPTIONS: (StockStatus | "All Status")[] = ["All Status", "In Stock", "Low Stock", "Critical"];
const PAGE_SIZE = 10;

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

// Purely client-side against currently-loaded data, same as before —
// no backend export endpoint needed for this.
function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell ?? "");
          return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
        })
        .join(",")
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function printTable(title: string, headers: string[], rows: (string | number)[][]) {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;
  const tableRows = rows
    .map((r) => `<tr>${r.map((c) => `<td style="padding:8px;border-bottom:1px solid #ddd;">${c}</td>`).join("")}</tr>`)
    .join("");
  win.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: sans-serif; padding: 24px; }
          h1 { font-size: 1.2rem; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
          th { text-align: left; padding: 8px; border-bottom: 2px solid #333; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <table>
          <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
}

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

export default function InventoryDashboardPage() {
  const [tab, setTab] = useState<StockItemType>("food");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [status, setStatus] = useState<StockStatus | "All Status">("All Status");
  const [page, setPage] = useState(1);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const [adjustItem, setAdjustItem] = useState<ModalItem | null>(null);
  const [transferItem, setTransferItem] = useState<ModalItem | null>(null);
  const [removeItem, setRemoveItem] = useState<ModalItem | null>(null);

  const branch = useBranch();
  const [branchOpen, setBranchOpen] = useState(false);

  const {
    items,
    itemsLoading,
    itemsError,
    branches,
    banner,
    fetchItems,
    fetchBranches,
    fetchBanner,
    adjustStock,
    transferStock,
    removeStock,
  } = useStockStore();

  useEffect(() => {
    fetchBranches();
    fetchBanner(branch.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch.id]);

  useEffect(() => {
    fetchItems(branch.id, search || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch.id, search]);

  const switchTab = (t: StockItemType) => {
    setTab(t);
    setPage(1);
    setSearch("");
    setStatus("All Status");
    setCategory("All Categories");
  };

  // Single item list, split by itemType — this is the whole fix. Both
  // tabs read the same `items` array the Stock Inventory page reads,
  // so an adjustment made on either page is immediately reflected on
  // both (same store, same cache — nothing to "sync" because it was
  // never two things to begin with).
  const tabItems = (items ?? []).filter((i) => i.itemType === tab);

  // Categories are derived from whatever's actually in the data — no
  // separate categories endpoint to keep in sync with menu items.
  const categories = Array.from(new Set(tabItems.map((i) => i.category))).sort();

  const branchQty = (item: StockItem) =>
    item.quantities.find((q) => q.branchId === branch.id) ?? item.quantities[0];

  const currentValue = (item: StockItem) => {
    const bq = branchQty(item);
    return item.itemType === "drink" ? (bq?.fridgeQty ?? 0) : (bq?.quantity ?? item.total);
  };

  const filtered = tabItems.filter((i) => {
    if (category !== "All Categories" && i.category !== category) return false;
    if (status !== "All Status" && i.status !== status) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const lowStock = filtered.filter((i) => i.status === "Low Stock");
  const critical = filtered.filter((i) => i.status === "Critical");
  const inStock = filtered.filter((i) => i.status === "In Stock");
  const totalValue = filtered.reduce((sum, i) => sum + currentValue(i) * i.costPerUnit, 0);

  const stats = {
    totalItems: filtered.length,
    lowStock: lowStock.length,
    outOfStock: critical.length,
    totalValue,
  };

  const toModalItem = (item: StockItem): ModalItem => {
    const bq = branchQty(item);
    return {
      itemId: item.id,
      menuItemId: item.menuItemId,
      name: item.name,
      unit: item.unit,
      itemType: item.itemType,
      status: item.status,
      current: currentValue(item),
      warehouseQty: item.itemType === "drink" ? bq?.warehouseQty ?? 0 : undefined,
      branchId: bq?.branchId ?? branch.id,
    };
  };

  const handleExportCsv = () => {
    const headers = tab === "food"
      ? ["Item", "Category", "Unit", "Stock", "Threshold", "Status"]
      : ["Item", "Category", "Unit", "Fridge", "Warehouse", "Threshold", "Status"];
    const rows = filtered.map((i) => {
      const bq = branchQty(i);
      return tab === "food"
        ? [i.name, i.category, i.unit, currentValue(i), i.threshold, i.status]
        : [i.name, i.category, i.unit, bq?.fridgeQty ?? 0, bq?.warehouseQty ?? 0, i.threshold, i.status];
    });
    downloadCsv(`${tab}-inventory-${branch.name.replace(/\s+/g, "-")}.csv`, [headers, ...rows]);
  };

  const handlePrint = () => {
    const headers = tab === "food"
      ? ["Item", "Category", "Unit", "Stock", "Threshold", "Status"]
      : ["Item", "Category", "Unit", "Fridge", "Warehouse", "Threshold", "Status"];
    const rows = filtered.map((i) => {
      const bq = branchQty(i);
      return tab === "food"
        ? [i.name, i.category, i.unit, currentValue(i), i.threshold, i.status]
        : [i.name, i.category, i.unit, bq?.fridgeQty ?? 0, bq?.warehouseQty ?? 0, i.threshold, i.status];
    });
    printTable(`${tab === "food" ? "Food" : "Drinks"} Inventory — ${branch.name}`, headers, rows);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, position: "relative" }}>
      <div>
        <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "var(--color-primary)" }}>{branch.name}</p>
        <h1 style={{ margin: "6px 0 0", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-heading)" }}>Inventory</h1>
        <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Food &amp; Drinks inventory</p>
      </div>

      {branch.canPickBranch ? (
        <div style={{ position: "relative", alignSelf: "flex-start" }}>
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
            display: "flex", alignItems: "center", minWidth: 150, alignSelf: "flex-start",
            padding: "10px 14px", borderRadius: 8, border: "1px solid var(--color-border)",
            background: "var(--color-bg-soft)", fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text)",
          }}
          title="Your account is scoped to this branch"
        >
          {branch.name}
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <TabButton active={tab === "food"} onClick={() => switchTab("food")} icon={<ChefHat size={16} strokeWidth={1.8} />} label="Food Inventory" />
        <TabButton active={tab === "drink"} onClick={() => switchTab("drink")} icon={<GlassWater size={16} strokeWidth={1.8} />} label="Drinks Inventory" />
      </div>

      <div className="card">
        {banner ? (
          <>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text)" }}>
              <strong>Last Updated:</strong> {new Date(banner.lastUpdatedAt).toLocaleString()} by {banner.lastUpdatedByName}
            </p>
            <p style={{ margin: "6px 0 0", fontSize: "0.85rem", color: "var(--color-text)" }}>
              <strong>Next morning count due:</strong> {new Date(banner.nextCountDueAt).toLocaleString()}
            </p>
          </>
        ) : (
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Status unavailable</p>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <div className="card" style={{ textAlign: "center" }}>
          {tab === "food"
            ? <ChefHat size={20} strokeWidth={1.8} color="#E10B1C" style={{ margin: "0 auto" }} />
            : <GlassWater size={20} strokeWidth={1.8} color="#E10B1C" style={{ margin: "0 auto" }} />}
          <p style={{ margin: "6px 0 0", fontSize: "1.5rem", fontWeight: 700, color: "var(--color-heading)" }}>
            {itemsLoading ? "…" : stats.totalItems}
          </p>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Total Items</p>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <AlertTriangle size={20} strokeWidth={1.8} color="#a07a00" style={{ margin: "0 auto" }} />
          <p style={{ margin: "6px 0 0", fontSize: "1.5rem", fontWeight: 700, color: "#a07a00" }}>
            {itemsLoading ? "…" : stats.lowStock}
          </p>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Low Stock</p>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <AlertTriangle size={20} strokeWidth={1.8} color="#E10B1C" style={{ margin: "0 auto" }} />
          <p style={{ margin: "6px 0 0", fontSize: "1.5rem", fontWeight: 700, color: "#E10B1C" }}>
            {itemsLoading ? "…" : stats.outOfStock}
          </p>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Critical / Out of Stock</p>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <HashIcon size={20} strokeWidth={1.8} color="var(--color-heading)" style={{ margin: "0 auto" }} />
          <p style={{ margin: "6px 0 0", fontSize: "1.5rem", fontWeight: 700, color: "var(--color-heading)" }}>
            {itemsLoading ? "…" : `₦${stats.totalValue.toLocaleString()}`}
          </p>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Total Value</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <OutlineButton icon={<Upload size={15} strokeWidth={1.8} />} label="Export to CSV" onClick={handleExportCsv} />
        <OutlineButton icon={<Download size={15} strokeWidth={1.8} />} label="Print" onClick={handlePrint} />
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", padding: 20 }}>
          <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
            <Search size={16} strokeWidth={1.8} color="var(--color-text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
            <input
              className="input"
              placeholder="Search item..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ width: "100%", paddingLeft: 38 }}
            />
          </div>

          <Dropdown
            value={category}
            options={["All Categories", ...categories]}
            open={categoryOpen}
            setOpen={setCategoryOpen}
            onChange={(v) => { setCategory(v); setPage(1); }}
          />

          <Dropdown
            value={status}
            options={STATUS_OPTIONS}
            open={statusOpen}
            setOpen={setStatusOpen}
            onChange={(v) => { setStatus(v as StockStatus | "All Status"); setPage(1); }}
            withStatusIcons
          />
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {tab === "food"
                  ? ["Item", "Category", "Unit", "Stock", "Threshold", "Status", "Actions"].map((c) => <th key={c}>{c}</th>)
                  : ["Item", "Category", "Unit", "Fridge", "Warehouse", "Threshold", "Status", "Actions"].map((c) => <th key={c}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {itemsLoading && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "24px 0", color: "var(--color-text-muted)" }}>
                    Loading...
                  </td>
                </tr>
              )}

              {!itemsLoading && itemsError && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "24px 0", color: "var(--color-text-muted)" }}>
                    No inventory data available
                  </td>
                </tr>
              )}

              {!itemsLoading && !itemsError && pageItems.map((item) => {
                const bq = branchQty(item);
                return (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600, color: "var(--color-text)" }}>{item.name}</td>
                    <td>{item.category}</td>
                    <td>{item.unit}</td>
                    {tab === "food" ? (
                      <td>{currentValue(item)}</td>
                    ) : (
                      <>
                        <td>{bq?.fridgeQty ?? 0}</td>
                        <td>{bq?.warehouseQty ?? 0}</td>
                      </>
                    )}
                    <td>{item.threshold}</td>
                    <td><StatusBadge status={item.status} /></td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <IconButton icon={<Plus size={14} strokeWidth={2} />} title="Adjust stock" onClick={() => setAdjustItem(toModalItem(item))} />
                        <IconButton icon={<ArrowLeftRight size={14} strokeWidth={1.8} />} title="Transfer between branches" onClick={() => setTransferItem(toModalItem(item))} />
                        <IconButton icon={<PackageMinus size={14} strokeWidth={1.8} />} title="Remove / wastage" onClick={() => setRemoveItem(toModalItem(item))} />
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!itemsLoading && !itemsError && pageItems.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "24px 0", color: "var(--color-text-muted)" }}>
                    No items match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/*
          Compact pager — was rendering a button per page (1..36), which
          is unusable at this item count. Now it's just Previous / the
          current page / Next, same pattern as the Stock Inventory
          page's pager, plus a "Page X of Y" label so position is still
          clear without a wall of page buttons.
        */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 14,
          padding: "14px 20px", fontSize: "0.85rem", borderTop: "1px solid var(--color-border)",
        }}>
          <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="pager-link"
            style={{
              display: "flex", alignItems: "center", gap: 4, background: "none", border: "none",
              cursor: currentPage <= 1 ? "not-allowed" : "pointer", fontWeight: 600, fontFamily: "var(--font-sans)",
              color: currentPage <= 1 ? "var(--color-text-muted)" : "var(--color-primary)",
            }}
          >
            <ChevronLeft size={15} strokeWidth={2} />
            Previous
          </button>
          <span
            style={{
              width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, background: "var(--color-secondary)", color: "#7a5500", flexShrink: 0,
            }}
          >
            {currentPage}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="pager-link"
            style={{
              display: "flex", alignItems: "center", gap: 4, background: "none", border: "none",
              cursor: currentPage >= totalPages ? "not-allowed" : "pointer", fontWeight: 600, fontFamily: "var(--font-sans)",
              color: currentPage >= totalPages ? "var(--color-text-muted)" : "var(--color-primary)",
            }}
          >
            Next
            <ChevronRight size={15} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {inStock.length > 0 && (
          <p style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: "0.85rem", color: "var(--color-text)" }}>
            <TrendingUp size={14} strokeWidth={2} color="#16A34A" />
            <strong>In Stock:</strong> {inStock.length} items well stocked
          </p>
        )}
        {lowStock.length > 0 && (
          <p style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: "0.85rem", color: "var(--color-text)" }}>
            <AlertTriangle size={14} strokeWidth={1.8} color="#a07a00" />
            <strong>Low Stock Alert:</strong> {lowStock.length} items below threshold
          </p>
        )}
        {critical.length > 0 && (
          <p style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: "0.85rem", color: "var(--color-text)" }}>
            <AlertTriangle size={14} strokeWidth={1.8} color="#E10B1C" />
            <strong>Critical:</strong> {critical.length} items {tab === "food" ? "— customers cannot order" : "— order from supplier"}
          </p>
        )}
        {!itemsLoading && !itemsError && filtered.length === 0 && (
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>No status data to show.</p>
        )}
      </div>

      {adjustItem && (
        <AdjustStockModal
          item={adjustItem}
          onClose={() => setAdjustItem(null)}
          onSubmit={async (form) => {
            const ok = await adjustStock({
              itemId: adjustItem.itemId,
              menuItemId: adjustItem.menuItemId,
              branchId: adjustItem.branchId,
              quantity: form.qty,
              destination: form.destination,
              supplierId: null,
              invoiceNumber: null,
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
              menuItemId: transferItem.menuItemId,
              fromBranchId: form.fromBranchId,
              toBranchId: form.toBranchId,
              quantity: form.qty,
              approvingManagerId: null,
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
              otherDetails: null,
            });
            if (ok) setRemoveItem(null);
          }}
        />
      )}

      <style jsx global>{`
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

        .pager-link { transition: opacity 0.15s ease, gap 0.15s ease; }
        .pager-link:not(:disabled):hover { opacity: 0.75; }
      `}</style>
    </div>
  );
}

/* -- Building blocks -- */
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
        transition: "background 0.15s ease, border-color 0.15s ease, color 0.15s ease",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function OutlineButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 8,
        border: "1px solid var(--color-border)", background: "#fff", cursor: "pointer",
        fontSize: "0.85rem", fontWeight: 500, color: "var(--color-text)", fontFamily: "var(--font-sans)",
        transition: "background 0.15s ease, transform 0.15s ease",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-bg-soft)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {icon}
      {label}
    </button>
  );
}

function IconButton({ icon, onClick, title }: { icon: React.ReactNode; onClick: () => void; title?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30,
        borderRadius: 8, border: "1px solid var(--color-border)", background: "#fff", cursor: "pointer",
        color: "var(--color-text-muted)", transition: "background 0.15s ease, color 0.15s ease, transform 0.15s ease",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-bg-soft)"; e.currentTarget.style.color = "var(--color-text)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "var(--color-text-muted)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {icon}
    </button>
  );
}

function Dropdown({
  value, options, open, setOpen, onChange, withStatusIcons,
}: {
  value: string; options: string[]; open: boolean; setOpen: (v: boolean) => void; onChange: (v: string) => void; withStatusIcons?: boolean;
}) {
  const iconFor = (opt: string) => {
    if (!withStatusIcons) return null;
    if (opt === "In Stock") return <TrendingUp size={13} strokeWidth={2} color="#16A34A" />;
    if (opt === "Low Stock") return <TrendingDown size={13} strokeWidth={2} color="#a07a00" />;
    if (opt === "Critical") return <AlertTriangle size={13} strokeWidth={1.8} color="#E10B1C" />;
    return null;
  };

  return (
    <div style={{ position: "relative", minWidth: 170 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, width: "100%",
          padding: "10px 14px", borderRadius: 8, border: "1px solid var(--color-border)", background: "#fff",
          cursor: "pointer", fontSize: "0.85rem", color: "var(--color-text)", fontFamily: "var(--font-sans)",
        }}
      >
        {value}
        <ChevronDown
          size={15}
          strokeWidth={1.8}
          color="var(--color-text-muted)"
          style={{ transition: "transform 0.2s ease", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      {open && (
        <div
          className="fade-in-down"
          style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, minWidth: 190,
            background: "#fff", border: "1px solid var(--color-border)", borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.10)", overflow: "hidden", zIndex: 60,
          }}
        >
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
                padding: "10px 14px", background: opt === value ? "var(--color-bg-soft)" : "#fff",
                border: "none", cursor: "pointer", fontSize: "0.85rem", fontFamily: "var(--font-sans)",
                color: "var(--color-text)", textAlign: "left", transition: "background 0.15s ease",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {opt === value && <Check size={13} strokeWidth={2} />}
                {opt}
              </span>
              {iconFor(opt)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ModalShell({ title, onClose, children, width = 460 }: { title: string; onClose: () => void; children: React.ReactNode; width?: number }) {
  return (
    <div
      onClick={onClose}
      className="modal-backdrop"
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        zIndex: 100, padding: "5vh 20px", overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-shell"
        style={{
          width, maxWidth: "92vw", maxHeight: "88vh", background: "#fff", borderRadius: 14,
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", flexShrink: 0, borderBottom: "1px solid var(--color-border)" }}>
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
        <div style={{ padding: "20px 24px 24px", overflowY: "auto" }}>{children}</div>
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
      <input className="input" type="number" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} style={{ textAlign: "center", flex: 1 }} />
      <button onClick={() => onChange(value + 1)} style={stepperBtn}><Plus size={14} /></button>
    </div>
  );
}
const stepperBtn: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 8, border: "1px solid var(--color-border)",
  background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
  transition: "background 0.15s ease",
};
const outlineBtn: React.CSSProperties = {
  padding: "9px 18px", borderRadius: 8, border: "1px solid var(--color-border)", background: "#fff",
  cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)", fontFamily: "var(--font-sans)",
  transition: "background 0.15s ease",
};

/* -- Adjust Stock modal — same shape as the Stock Inventory page's.
   Food: no destination toggle, supplier not asked here (this dashboard
   doesn't collect supplier — use the Stock Inventory page's Adjust
   modal for that level of detail; this one is qty + cost + reason).
   Drinks: destination toggle picks warehouse vs fridge. -- */
function AdjustStockModal({
  item, onClose, onSubmit,
}: {
  item: ModalItem;
  onClose: () => void;
  onSubmit: (form: { qty: number; cost: number; reason: string; destination?: "warehouse" | "fridge" }) => void;
}) {
  const isDrink = item.itemType === "drink";
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
    <ModalShell title="Adjust Stock" onClose={onClose}>
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
        </Field>
      )}

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

      <Field label="Reason">
        <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={isDrink ? "e.g. New delivery received from supplier" : "e.g. Extra batch prepared in kitchen"} />
      </Field>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button onClick={onClose} style={outlineBtn}>Cancel</button>
        <button
          className="btn btn-primary"
          style={{ padding: "9px 18px", fontSize: "0.85rem" }}
          disabled={!qty || !reason.trim()}
          onClick={() => onSubmit({ qty, cost, reason, destination: isDrink ? destination : undefined })}
        >
          Apply Change
        </button>
      </div>
    </ModalShell>
  );
}

/* -- Transfer Stock modal — branch to branch, both types.
   Drinks transfer fridgeQty only (warehouse stays local per branch). -- */
function TransferStockModal({
  item, branches, onClose, onSubmit,
}: {
  item: ModalItem;
  branches: { id: string; name: string }[];
  onClose: () => void;
  onSubmit: (form: { fromBranchId: string; toBranchId: string; qty: number; reason: string }) => void;
}) {
  const [fromBranchId, setFromBranchId] = useState(item.branchId || branches[0]?.id || "");
  const [toBranchId, setToBranchId] = useState(branches[1]?.id ?? branches[0]?.id ?? "");
  const [qty, setQty] = useState(0);
  const [reason, setReason] = useState("");

  return (
    <ModalShell title="Transfer Stock" onClose={onClose}>
      <div style={{ padding: "10px 14px", borderRadius: 10, background: "var(--color-bg-soft)", marginBottom: 20, fontWeight: 600, color: "var(--color-text)" }}>
        {item.name}
      </div>

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
        Available: <strong>{item.current} {item.unit}</strong>{item.itemType === "drink" && " (fridge)"}
      </p>
      <Field label="Quantity to transfer">
        <Stepper value={qty} onChange={setQty} />
      </Field>

      <Field label="Reason">
        <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button onClick={onClose} style={outlineBtn}>Cancel</button>
        <button
          className="btn btn-primary"
          style={{ padding: "9px 18px", fontSize: "0.85rem" }}
          disabled={!qty || !reason.trim()}
          onClick={() => onSubmit({ fromBranchId, toBranchId, qty, reason })}
        >
          Confirm Transfer
        </button>
      </div>
    </ModalShell>
  );
}

/* -- Remove Stock Wastage modal — both types. Drinks remove fridgeQty only. -- */
function RemoveStockModal({
  item, onClose, onSubmit,
}: {
  item: ModalItem;
  onClose: () => void;
  onSubmit: (form: { qty: number; cost: number; reason: string }) => void;
}) {
  const [qty, setQty] = useState(0);
  const [cost, setCost] = useState(0);
  const [reason, setReason] = useState("");
  const newStock = Math.max(0, item.current - qty);

  return (
    <ModalShell title="Remove Stock Wastage" onClose={onClose}>
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

      <Field label="Reason">
        <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Spoiled / Expired" />
      </Field>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button onClick={onClose} style={outlineBtn}>Cancel</button>
        <button
          className="btn btn-primary"
          style={{ padding: "9px 18px", fontSize: "0.85rem" }}
          disabled={!qty || !reason.trim()}
          onClick={() => onSubmit({ qty, cost, reason })}
        >
          Remove
        </button>
      </div>
    </ModalShell>
  );
}