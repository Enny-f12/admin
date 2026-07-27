"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Search,
  ChevronDown,
  Upload,
  Download,
  DollarSign,
  Plus,
  Minus,
  ArrowLeftRight,
  Bell,
  Check,
  ChefHat,
  GlassWater,
  X,
  Calendar,
} from "lucide-react";
import { useInventoryDashboardStore } from "@/store/useInventoryStore";
import { FoodInventoryItem } from "@/types/food-inventory.types";
import { DrinksInventoryItem, Supplier } from "@/types/drinks.types";
import { drinksService } from "@/services/drinks.service";

type Status = "In Stock" | "Low Stock" | "Out of Stock";

const STATUS_OPTIONS: (Status | "All Status")[] = ["All Status", "In Stock", "Low Stock", "Out of Stock"];
const PAGE_SIZE = 6;

const STATUS_CLASS: Record<Status, string> = {
  "In Stock": "badge badge-green",
  "Low Stock": "badge badge-yellow",
  "Out of Stock": "badge badge-red",
};

const StatusBadge = ({ status }: { status: Status }) => (
  <span className={STATUS_CLASS[status]} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
    {status === "In Stock" && <TrendingUp size={12} strokeWidth={2} />}
    {status === "Low Stock" && <TrendingDown size={12} strokeWidth={2} />}
    {status === "Out of Stock" && <AlertTriangle size={12} strokeWidth={2} />}
    {status}
  </span>
);

export default function InventoryDashboardPage() {
  const [tab, setTab] = useState<"food" | "drinks">("food");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [status, setStatus] = useState<Status | "All Status">("All Status");
  const [page, setPage] = useState(1);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [fridgeAlertOpen, setFridgeAlertOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);

  const {
    foodItems,
    foodTotal,
    foodStats,
    foodCategories,
    foodLoading,
    foodError,
    drinkItems,
    drinksTotal,
    drinksStats,
    drinksLoading,
    drinksError,
    banner,
    fetchFoodItems,
    fetchFoodCategories,
    fetchDrinkItems,
    fetchBanner,
    adjustWarehouseStock,
    transferToFridge,
    receiveDelivery,
  } = useInventoryDashboardStore();

  useEffect(() => {
    fetchFoodCategories();
    fetchBanner();
  }, [fetchFoodCategories, fetchBanner]);

  useEffect(() => {
    if (tab === "food") {
      fetchFoodItems({
        search: search || undefined,
        category: category === "All Categories" ? undefined : category,
        status: status === "All Status" ? undefined : status,
        page,
        pageSize: PAGE_SIZE,
      });
    } else {
      fetchDrinkItems({
        search: search || undefined,
        status: status === "All Status" ? undefined : status,
        page,
        pageSize: PAGE_SIZE,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, search, category, status, page]);

  const switchTab = (t: "food" | "drinks") => {
    setTab(t);
    setPage(1);
    setSearch("");
    setStatus("All Status");
    setCategory("All Categories");
    if (t === "drinks") setFridgeAlertOpen(true);
  };

  const loading = tab === "food" ? foodLoading : drinksLoading;
  const hasError = tab === "food" ? foodError : drinksError;
  const total = tab === "food" ? foodTotal : drinksTotal;
  const stats = tab === "food" ? foodStats : drinksStats;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const drinkStatusOf = (i: DrinksInventoryItem): Status => i.status;

  const lowStockDrinks = drinkItems?.filter((i) => i.status === "Low Stock") ?? [];
  const outOfStockDrinks = drinkItems?.filter((i) => i.status === "Out of Stock") ?? [];
  const lowStockFood = foodItems?.filter((i) => i.status === "Low Stock") ?? [];
  const outOfStockFood = foodItems?.filter((i) => i.status === "Out of Stock") ?? [];
  const inStockFood = foodItems?.filter((i) => i.status === "In Stock") ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, position: "relative" }}>
      <div>
        <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "var(--color-primary)" }}>Foodies 1 LEKKI</p>
        <h1 style={{ margin: "6px 0 0", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-heading)" }}>Inventory</h1>
        <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Food &amp; Drinks inventory</p>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <TabButton active={tab === "food"} onClick={() => switchTab("food")} icon={<ChefHat size={16} strokeWidth={1.8} />} label="Food Inventory" />
        <TabButton active={tab === "drinks"} onClick={() => switchTab("drinks")} icon={<GlassWater size={16} strokeWidth={1.8} />} label="Drinks Inventory" />
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
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            {/* TODO(BACKEND): GET /admin/inventory/status-banner not implemented — see request doc #3 */}
            Status unavailable
          </p>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <div className="card" style={{ textAlign: "center" }}>
          {tab === "food"
            ? <ChefHat size={20} strokeWidth={1.8} color="#E10B1C" style={{ margin: "0 auto" }} />
            : <GlassWater size={20} strokeWidth={1.8} color="#E10B1C" style={{ margin: "0 auto" }} />}
          <p style={{ margin: "6px 0 0", fontSize: "1.5rem", fontWeight: 700, color: "var(--color-heading)" }}>
            {stats ? stats.totalItems : loading ? "…" : "–"}
          </p>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Total Items</p>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <AlertTriangle size={20} strokeWidth={1.8} color="#a07a00" style={{ margin: "0 auto" }} />
          <p style={{ margin: "6px 0 0", fontSize: "1.5rem", fontWeight: 700, color: "#a07a00" }}>
            {stats ? stats.lowStock : loading ? "…" : "–"}
          </p>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Low Stock</p>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <AlertTriangle size={20} strokeWidth={1.8} color="#E10B1C" style={{ margin: "0 auto" }} />
          <p style={{ margin: "6px 0 0", fontSize: "1.5rem", fontWeight: 700, color: "#E10B1C" }}>
            {stats ? stats.outOfStock : loading ? "…" : "–"}
          </p>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Out of Stock</p>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <DollarSign size={20} strokeWidth={1.8} color="var(--color-heading)" style={{ margin: "0 auto" }} />
          <p style={{ margin: "6px 0 0", fontSize: "1.5rem", fontWeight: 700, color: "var(--color-heading)" }}>
            {stats ? `₦${stats.totalValue.toLocaleString()}` : loading ? "…" : "–"}
          </p>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Total Value</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <OutlineButton icon={<Upload size={15} strokeWidth={1.8} />} label="Export to CSV" />
        <OutlineButton icon={<Download size={15} strokeWidth={1.8} />} label="Print" />
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

          {tab === "food" && (
            <Dropdown
              value={category}
              options={["All Categories", ...(foodCategories ?? [])]}
              open={categoryOpen}
              setOpen={setCategoryOpen}
              onChange={(v) => { setCategory(v); setPage(1); }}
            />
          )}

          <Dropdown
            value={status}
            options={STATUS_OPTIONS}
            open={statusOpen}
            setOpen={setStatusOpen}
            onChange={(v) => { setStatus(v as Status | "All Status"); setPage(1); }}
            withStatusIcons
          />
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {tab === "food"
                  ? ["Item", "Unit", "Pack", "Stock", "Threshold", "Status"].map((c) => <th key={c}>{c}</th>)
                  : ["Item", "Unit", "Fridge", "Warehouse", "Threshold", "Status"].map((c) => <th key={c}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "24px 0", color: "var(--color-text-muted)" }}>
                    Loading…
                  </td>
                </tr>
              )}

              {!loading && hasError && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "24px 0", color: "var(--color-text-muted)" }}>
                    {/* TODO(BACKEND): tab === "food" ? see request doc #1 : see request doc #4 */}
                    No inventory data available
                  </td>
                </tr>
              )}

              {!loading && !hasError && tab === "food" && (foodItems ?? []).map((item: FoodInventoryItem) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600, color: "var(--color-text)" }}>{item.name}</td>
                  <td>{item.unit}</td>
                  <td>{item.pack}</td>
                  <td>{item.stock}</td>
                  <td>{item.threshold}</td>
                  <td><StatusBadge status={item.status} /></td>
                </tr>
              ))}

              {!loading && !hasError && tab === "drinks" && (drinkItems ?? []).map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600, color: "var(--color-text)" }}>{item.name}</td>
                  <td>{item.unit}</td>
                  <td>{item.fridgeStock}</td>
                  <td>{item.warehouseStock}</td>
                  <td>{item.fridgeThreshold}</td>
                  <td><StatusBadge status={drinkStatusOf(item)} /></td>
                </tr>
              ))}

              {!loading && !hasError && ((tab === "food" ? foodItems?.length : drinkItems?.length) ?? 0) === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "24px 0", color: "var(--color-text-muted)" }}>
                    No items match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 14, padding: "14px 20px", fontSize: "0.85rem" }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-primary)", fontWeight: 600 }}
          >
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
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-primary)", fontWeight: 600 }}
          >
            Next
          </button>
        </div>
      </div>

      {tab === "food" ? (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {inStockFood.length > 0 && (
            <p style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: "0.85rem", color: "var(--color-text)" }}>
              <TrendingUp size={14} strokeWidth={2} color="#16A34A" />
              <strong>In Stock:</strong> {inStockFood.length} items well stocked
            </p>
          )}
          {lowStockFood.length > 0 && (
            <p style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: "0.85rem", color: "var(--color-text)" }}>
              <AlertTriangle size={14} strokeWidth={1.8} color="#a07a00" />
              <strong>Low Stock Alert:</strong> {lowStockFood.length} items below threshold
            </p>
          )}
          {outOfStockFood.length > 0 && (
            <p style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: "0.85rem", color: "var(--color-text)" }}>
              <AlertTriangle size={14} strokeWidth={1.8} color="#E10B1C" />
              <strong>Out of Stock:</strong> {outOfStockFood.length} items - customers cannot order
            </p>
          )}
          {!loading && !hasError && (foodItems?.length ?? 0) === 0 && (
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>No status data to show.</p>
          )}
        </div>
      ) : (
        <>
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {lowStockDrinks.length > 0 && (
              <p style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: "0.85rem", color: "var(--color-text)" }}>
                <AlertTriangle size={14} strokeWidth={1.8} color="#a07a00" />
                <strong>Low Fridge Alert:</strong>{" "}
                {lowStockDrinks.map((r) => `${r.name} (${r.fridgeStock} left)`).join(", ")}
              </p>
            )}
            {outOfStockDrinks.length > 0 && (
              <p style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: "0.85rem", color: "var(--color-text)" }}>
                <AlertTriangle size={14} strokeWidth={1.8} color="#E10B1C" />
                <strong>Out of Stock:</strong> {outOfStockDrinks.map((r) => r.name).join(", ")} - order from supplier
              </p>
            )}
            {!loading && !hasError && lowStockDrinks.length === 0 && outOfStockDrinks.length === 0 && (
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>No alerts right now.</p>
            )}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <OutlineButton icon={<Plus size={15} strokeWidth={1.8} />} label="Receive Delivery" onClick={() => setReceiveOpen(true)} />
            <OutlineButton icon={<ArrowLeftRight size={15} strokeWidth={1.8} />} label="Transfer to Fridge" onClick={() => setTransferOpen(true)} />
            <OutlineButton icon={<Plus size={15} strokeWidth={1.8} />} label="Adjust Stock" onClick={() => setAdjustOpen(true)} />
          </div>
        </>
      )}

      {receiveOpen && (
        <ReceiveDeliveryModal
          onClose={() => setReceiveOpen(false)}
          onSubmit={async (payload) => {
            const ok = await receiveDelivery(payload);
            if (ok) setReceiveOpen(false);
          }}
        />
      )}
      {transferOpen && (
        <TransferModal
          items={drinkItems ?? []}
          onClose={() => setTransferOpen(false)}
          onSubmit={async (payload) => {
            const ok = await transferToFridge(payload);
            if (ok) setTransferOpen(false);
          }}
        />
      )}
      {adjustOpen && (
        <AdjustStockModal
          items={drinkItems ?? []}
          onClose={() => setAdjustOpen(false)}
          onSubmit={async (payload) => {
            const ok = await adjustWarehouseStock(payload);
            if (ok) setAdjustOpen(false);
          }}
        />
      )}

      {tab === "drinks" && fridgeAlertOpen && (lowStockDrinks.length > 0 || outOfStockDrinks.length > 0) && (
        <LowFridgeAlertModal
          lowStockItems={lowStockDrinks}
          outOfStockItems={outOfStockDrinks}
          onDismiss={() => setFridgeAlertOpen(false)}
        />
      )}
    </div>
  );
}

/* ── Building blocks ── */
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

function OutlineButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 8,
        border: "1px solid var(--color-border)", background: "#fff", cursor: "pointer",
        fontSize: "0.85rem", fontWeight: 500, color: "var(--color-text)", fontFamily: "var(--font-sans)",
      }}
    >
      {icon}
      {label}
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
    if (opt === "Out of Stock") return <AlertTriangle size={13} strokeWidth={1.8} color="#E10B1C" />;
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
        <ChevronDown size={15} strokeWidth={1.8} color="var(--color-text-muted)" />
      </button>
      {open && (
        <div
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
                color: "var(--color-text)", textAlign: "left",
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

/* ── Shared modal shell ── */
function ModalShell({ title, onClose, children, width = 460 }: { title: string; onClose: () => void; children: React.ReactNode; width?: number }) {
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
          width, maxWidth: "92vw", maxHeight: "88vh", background: "#fff", borderRadius: 14,
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", overflow: "hidden",
        }}
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
};
const outlineBtn: React.CSSProperties = {
  padding: "9px 18px", borderRadius: 8, border: "1px solid var(--color-border)", background: "#fff",
  cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)", fontFamily: "var(--font-sans)",
};

/* ── Receive Delivery modal ── */
type ReceivedRow = { name: string; qty: number; costPerUnit: number };

function ReceiveDeliveryModal({
  onClose, onSubmit,
}: {
  onClose: () => void;
  onSubmit: (payload: {
    supplierId: string | null;
    deliveryDate: string;
    invoiceNumber: string;
    isDraft: boolean;
    items: { itemName: string; quantity: number; costPerUnit: number }[];
  }) => void;
}) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [invoice, setInvoice] = useState("");
  const [items, setItems] = useState<ReceivedRow[]>([{ name: "", qty: 0, costPerUnit: 0 }]);

  useEffect(() => {
    drinksService.getSuppliers().then(setSuppliers).catch(() => setSuppliers([]));
  }, []);

  const totalCost = items.reduce((sum, i) => sum + i.qty * i.costPerUnit, 0);
  const canSubmit = items.some((i) => i.name.trim() && i.qty > 0);

  const addItem = () => setItems((prev) => [...prev, { name: "", qty: 0, costPerUnit: 0 }]);
  const updateItem = (i: number, patch: Partial<ReceivedRow>) =>
    setItems((prev) => prev.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  const submit = (isDraft: boolean) => {
    onSubmit({
      supplierId: supplierId || null,
      deliveryDate,
      invoiceNumber: invoice,
      isDraft,
      items: items
        .filter((i) => i.name.trim() && i.qty > 0)
        .map((i) => ({ itemName: i.name, quantity: i.qty, costPerUnit: i.costPerUnit })),
    });
  };

  return (
    <ModalShell title="Receive Delivery" onClose={onClose} width={620}>
      <Field label="Supplier">
        <select className="input" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
          <option value="">Select supplier</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </Field>
      <Field label="Delivery Date">
        <div style={{ position: "relative" }}>
          <Calendar size={16} strokeWidth={1.8} color="var(--color-primary)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
          <input className="input" type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} style={{ paddingLeft: 38 }} />
        </div>
      </Field>
      <Field label="Invoice Number">
        <input className="input" placeholder="INV-5678......." value={invoice} onChange={(e) => setInvoice(e.target.value)} />
      </Field>

      <p style={{ margin: "0 0 10px", fontSize: "0.85rem", fontWeight: 700, color: "var(--color-heading)" }}>
        ITEMS RECEIVED (adds to Warehouse)
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
        {items.map((row, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1.4fr 0.8fr 0.9fr auto", gap: 8, alignItems: "center" }}>
            <input className="input" placeholder="Item name" value={row.name} onChange={(e) => updateItem(i, { name: e.target.value })} />
            <input className="input" type="number" value={row.qty} onChange={(e) => updateItem(i, { qty: Number(e.target.value) || 0 })} placeholder="Qty" />
            <input className="input" type="number" value={row.costPerUnit} onChange={(e) => updateItem(i, { costPerUnit: Number(e.target.value) || 0 })} placeholder="Cost/unit" />
            <span style={{ fontWeight: 600, fontSize: "0.85rem", whiteSpace: "nowrap" }}>₦{(row.qty * row.costPerUnit).toLocaleString()}</span>
          </div>
        ))}
      </div>
      <button
        onClick={addItem}
        style={{
          display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8,
          border: "1px solid rgba(225,11,28,0.3)", background: "rgba(225,11,28,0.05)",
          color: "var(--color-primary)", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer",
          fontFamily: "var(--font-sans)", marginBottom: 16,
        }}
      >
        <Plus size={15} strokeWidth={2} />
        Add Item
      </button>

      <p style={{ margin: "0 0 16px", fontSize: "1rem", fontWeight: 700, color: "var(--color-heading)" }}>
        Total Cost: ₦{totalCost.toLocaleString()}
      </p>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button onClick={() => submit(true)} disabled={!canSubmit} style={outlineBtn}>Save Draft</button>
        <button className="btn btn-primary" style={{ padding: "9px 18px", fontSize: "0.85rem" }} disabled={!canSubmit} onClick={() => submit(false)}>
          Confirm Receipt
        </button>
      </div>
    </ModalShell>
  );
}

/* ── Transfer to Fridge modal ── */
function TransferModal({
  items, onClose, onSubmit,
}: {
  items: DrinksInventoryItem[];
  onClose: () => void;
  onSubmit: (payload: { itemId: string; quantity: number; reason: string }) => void;
}) {
  const [itemId, setItemId] = useState(items[0]?.id ?? "");
  const item = items.find((i) => i.id === itemId) ?? items[0];
  const [qty, setQty] = useState(0);
  const [reason, setReason] = useState("Restock fridge for lunch rush");

  if (!item) {
    return (
      <ModalShell title="Transfer to Fridge" onClose={onClose}>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>No drinks data available.</p>
      </ModalShell>
    );
  }

  const newFridgeStock = item.fridgeStock + qty;
  const newWarehouseStock = item.warehouseStock - qty;
  const belowThreshold = item.fridgeStock < item.fridgeThreshold;
  const exceedsWarehouse = qty > item.warehouseStock;

  return (
    <ModalShell title="Transfer to Fridge" onClose={onClose}>
      <Field label="Item">
        <select className="input" value={itemId} onChange={(e) => { setItemId(e.target.value); setQty(0); }}>
          {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
      </Field>
      <Field label="Current Fridge Stock">
        <input className="input" value={item.fridgeStock} readOnly />
      </Field>
      <Field label="Current Warehouse Stock">
        <input className="input" value={item.warehouseStock} readOnly />
      </Field>
      <Field label="Fridge Threshold">
        <input className="input" value={`${item.fridgeThreshold} units`} readOnly />
      </Field>

      {belowThreshold && (
        <p style={{ display: "flex", alignItems: "center", gap: 6, margin: "-6px 0 14px", fontSize: "0.85rem", color: "#a07a00" }}>
          <AlertTriangle size={14} strokeWidth={1.8} />
          Fridge is below threshold. Restocking recommended.
        </p>
      )}

      <Field label="Qty to Transfer">
        <Stepper value={qty} onChange={setQty} />
      </Field>

      {exceedsWarehouse && (
        <p style={{ margin: "-6px 0 14px", fontSize: "0.8rem", color: "#E10B1C" }}>
          Exceeds available warehouse stock.
        </p>
      )}

      <Field label="New Fridge Stock">
        <input className="input" value={newFridgeStock} readOnly />
      </Field>
      <Field label="New Warehouse Stock">
        <input className="input" value={newWarehouseStock} readOnly />
      </Field>
      <Field label="Reason">
        <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button onClick={onClose} style={outlineBtn}>Cancel</button>
        <button
          className="btn btn-primary"
          style={{ padding: "9px 18px", fontSize: "0.85rem" }}
          disabled={!qty || exceedsWarehouse}
          onClick={() => onSubmit({ itemId: item.id, quantity: qty, reason })}
        >
          Transfer to Fridge
        </button>
      </div>
    </ModalShell>
  );
}

/* ── Adjust Stock modal ── */
function AdjustStockModal({
  items, onClose, onSubmit,
}: {
  items: DrinksInventoryItem[];
  onClose: () => void;
  onSubmit: (payload: { itemId: string; quantity: number; costPerUnit: number; reason: string }) => void;
}) {
  const [itemId, setItemId] = useState(items[0]?.id ?? "");
  const item = items.find((i) => i.id === itemId) ?? items[0];
  const [qty, setQty] = useState(0);
  const [cost, setCost] = useState(0);
  const [reason, setReason] = useState("New delivery received from supplier");

  if (!item) {
    return (
      <ModalShell title="Adjust Stock" onClose={onClose}>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>No drinks data available.</p>
      </ModalShell>
    );
  }

  const newStock = item.warehouseStock + qty;
  const totalCost = qty * cost;

  return (
    <ModalShell title="Adjust Stock" onClose={onClose}>
      <Field label="Item">
        <select className="input" value={itemId} onChange={(e) => { setItemId(e.target.value); setQty(0); }}>
          {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
      </Field>

      <p style={{ margin: "0 0 6px", fontSize: "0.85rem", color: "var(--color-text)" }}>
        Current: <strong>{item.warehouseStock} {item.unit}</strong>
      </p>
      <Field label="Qty to Adjust">
        <Stepper value={qty} onChange={setQty} />
      </Field>

      <p style={{ margin: "0 0 16px", fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text)" }}>
        New Stock: {newStock} {item.unit}
      </p>

      <Field label="Cost per unit">
        <input className="input" type="number" value={cost} onChange={(e) => setCost(Number(e.target.value) || 0)} />
      </Field>
      <p style={{ margin: "-6px 0 16px", fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text)" }}>
        Total cost: ₦{totalCost.toLocaleString()}
      </p>

      <Field label="Reason">
        <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button onClick={onClose} style={outlineBtn}>Cancel</button>
        <button
          className="btn btn-primary"
          style={{ padding: "9px 18px", fontSize: "0.85rem" }}
          disabled={!qty || !reason.trim()}
          onClick={() => onSubmit({ itemId: item.id, quantity: qty, costPerUnit: cost, reason })}
        >
          Apply Change
        </button>
      </div>
    </ModalShell>
  );
}

function LowFridgeAlertModal({
  lowStockItems, outOfStockItems, onDismiss,
}: { lowStockItems: DrinksInventoryItem[]; outOfStockItems: DrinksInventoryItem[]; onDismiss: () => void }) {
  return (
    <div
      onClick={onDismiss}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: 520, maxWidth: "92vw", background: "var(--color-primary)", borderRadius: 14, padding: 28, color: "#fff", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
      >
        <p style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 18px", fontSize: "1.1rem", fontWeight: 700 }}>
          <Bell size={18} strokeWidth={2} />
          LOW FRIDGE ALERT
        </p>

        {lowStockItems.length > 0 && (
          <>
            <p style={{ margin: "0 0 8px", fontSize: "0.9rem" }}>
              The following are drinks low in fridge but available in warehouse:
            </p>
            <ul style={{ margin: "0 0 16px", paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
              {lowStockItems.map((i) => (
                <li key={i.id} style={{ fontSize: "0.9rem" }}>
                  {i.name} ({i.fridgeStock} in fridge, {i.warehouseStock} in warehouse){" "}
                  <a href="#" style={{ color: "#fff", textDecoration: "underline", fontStyle: "italic" }} onClick={(e) => e.preventDefault()}>
                    Transfer to Fridge
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}

        {outOfStockItems.length > 0 && (
          <>
            <p style={{ margin: "0 0 8px", fontSize: "0.9rem" }}>
              The following are drinks OUT in both fridge and warehouse:
            </p>
            <ul style={{ margin: "0 0 20px", paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
              {outOfStockItems.map((i) => (
                <li key={i.id} style={{ fontSize: "0.9rem" }}>
                  {i.name} ({i.fridgeStock} fridge, {i.warehouseStock} warehouse){" "}
                  <a href="#" style={{ color: "#fff", textDecoration: "underline", fontStyle: "italic" }} onClick={(e) => e.preventDefault()}>
                    Order from Supplier
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}

        <button
          onClick={onDismiss}
          style={{
            padding: "9px 20px", borderRadius: 8, border: "1px solid #fff", background: "transparent",
            color: "#fff", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", fontFamily: "var(--font-sans)",
          }}
        >
          Dismiss All
        </button>
      </div>
    </div>
  );
}