"use client";
import { useEffect, useState } from "react";
import { useAccountingStore } from "@/store/useAccountingStore";
import { MarginItem } from "@/types/accounting.types";
import {  SkeletonText } from "@/components/ui/Skeleton";

const fmt = (n: number | null | undefined) =>
  n === null || n === undefined || !Number.isFinite(n) ? "–" : "₦" + n.toLocaleString("en-NG");

// ── Icons ─────────────────────────────────────────────────────────────────────
function IconDollar() {
  return <span style={{ fontWeight: 800, fontSize: 18, lineHeight: 1, color: "#fff" }}>₦</span>;
}
function IconArrowUp() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m18 15-6-6-6 6" />
    </svg>
  );
}
function IconArrowDown() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
function IconPencil() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}
function IconAlert() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#E10B1C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" />
    </svg>
  );
}

// ── Shared style helpers ────────────────────────────────────────────────────
const CARD: React.CSSProperties = {
  background: "#fff",
  borderRadius: 16,
  border: "1px solid #EBEBEB",
  boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
};

const TH_STYLE: React.CSSProperties = {
  padding: "14px 20px",
  fontSize: 13,
  fontWeight: 600,
  color: "#6B7280",
  textAlign: "left",
  whiteSpace: "nowrap",
  borderBottom: "1px solid #F0F0F0",
  background: "#fff",
};

const TD_STYLE: React.CSSProperties = {
  padding: "16px 20px",
  fontSize: 14,
  color: "#374151",
  borderBottom: "1px solid #F5F5F5",
  whiteSpace: "nowrap",
};

function ReadonlyField({ label, value, loading }: { label: string; value: string; loading?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{label}</label>
      <div
        style={{
          height: 42, padding: "0 14px", display: "flex", alignItems: "center",
          background: "#FAFAFA", border: "1px solid #EBEBEB", borderRadius: 8,
          fontSize: 14, color: "#374151",
        }}
      >
        {loading ? <SkeletonText width="50%" height={13} /> : value}
      </div>
    </div>
  );
}

function MetricCard({
  label, value, change, positive, loading,
}: { label: string; value: string; change: string; positive: boolean; loading?: boolean }) {
  return (
    <div style={{ ...CARD, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div
          style={{
            width: 38, height: 38, borderRadius: 10, background: "#E05C2A",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <IconDollar />
        </div>
        {!loading && (
          <span
            style={{
              display: "flex", alignItems: "center", gap: 3,
              fontSize: 12.5, fontWeight: 700, color: positive ? "#16A34A" : "#DC2626",
            }}
          >
            {change} {positive ? <IconArrowUp /> : <IconArrowDown />}
          </span>
        )}
      </div>
      <div>
        <p style={{ fontSize: 13, color: "#9CA3AF", margin: "0 0 4px" }}>{label}</p>
        {loading ? (
          <div style={{ marginTop: 4 }}><SkeletonText width={90} height={22} /></div>
        ) : (
          <p style={{ fontSize: "1.4rem", fontWeight: 700, color: "#111827", margin: 0 }}>{value}</p>
        )}
        <p style={{ fontSize: 11.5, color: "#B0B0B0", margin: "4px 0 0" }}>vs last period</p>
      </div>
    </div>
  );
}

function SectionCard({
  title, action, children,
}: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ ...CARD, padding: 24, marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", color: "#111827", margin: 0 }}>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  );
}

// ── Cost & Profit Margin Configuration view ─────────────────────────────────
function ItemConfigView({
  item, onCancel, onSave, isSaving,
}: { item: MarginItem; onCancel: () => void; onSave: (costPrice: number) => void; isSaving: boolean }) {
  const [costPrice, setCostPrice] = useState(item.costPrice);
  const margin = item.sellingPrice > 0 ? Math.round(((item.sellingPrice - costPrice) / item.sellingPrice) * 100) : 0;

  return (
    <div style={{ margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "var(--color-primary)" }}>
            Foodies 1 LEKKI
          </p>
          <h1 style={{ margin: "6px 0 0", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-heading)" }}>
            Cost &amp; Profit Margin Configuration
          </h1>
          <p style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--color-text-muted)", margin: 0 }}>
            Financials, profit analysis and VAT
          </p>
        </div>
      </div>

      <div style={{ ...CARD, padding: 24, maxWidth: 560 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <ReadonlyField label="Item" value={item.itemName} />
          <ReadonlyField label="Type" value={item.type} />
          <ReadonlyField label="Selling Price" value={fmt(item.sellingPrice)} />

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Cost Price</label>
            <input
              type="number"
              value={costPrice}
              onChange={(e) => setCostPrice(Number(e.target.value) || 0)}
              style={{
                height: 42, padding: "0 14px",
                background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8,
                fontSize: 14, color: "#374151",
              }}
            />
          </div>

          <ReadonlyField label="Profit Margin" value={`${margin}%`} />

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <IconAlert />
            <span style={{ fontSize: 13, color: "#374151" }}>Cost price affects COGS and profitability reports.</span>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onCancel}
              style={{
                background: "transparent", color: "#6B7280",
                border: "1px solid #E5E7EB", borderRadius: 10,
                padding: "11px 22px", fontSize: 14, fontWeight: 500, cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(costPrice)}
              disabled={isSaving}
              style={{
                background: "#E10B1C", color: "#fff", border: "none",
                borderRadius: 10, padding: "11px 22px", fontSize: 14, fontWeight: 600,
                cursor: isSaving ? "default" : "pointer", opacity: isSaving ? 0.6 : 1,
              }}
            >
              {isSaving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={onCancel}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "var(--color-primary)", fontSize: 13.5, fontWeight: 600,
          textDecoration: "underline", padding: 0, marginTop: 18,
        }}
      >
        View Accountant Dashboard
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const START_DATE = "2026-05-01";
const END_DATE = "2026-05-15";

export default function AccountingPage() {
  const {
    summary, summaryLoading, summaryError, fetchSummary,
    marginItems, marginItemsLoading, marginItemsError, fetchMarginItems,
    updateItemCostPrice, isSavingCostPrice,
    recentSales, recentSalesLoading, recentSalesError, fetchRecentSales,
  } = useAccountingStore();

  const [view, setView] = useState<"dashboard" | "edit">("dashboard");
  const [activeItem, setActiveItem] = useState<MarginItem | null>(null);

  useEffect(() => {
    const filters = { startDate: START_DATE, endDate: END_DATE };
    fetchSummary(filters);
    fetchMarginItems({ ...filters, limit: 5 });
    fetchRecentSales({ ...filters, limit: 5 });
  }, [fetchSummary, fetchMarginItems, fetchRecentSales]);

  const openItem = (item: MarginItem) => {
    setActiveItem(item);
    setView("edit");
  };

  const handleSave = async (costPrice: number) => {
    if (!activeItem) return;
    const ok = await updateItemCostPrice(activeItem.id, costPrice);
    if (ok) setView("dashboard");
  };

  if (view === "edit" && activeItem) {
    return (
      <ItemConfigView
        item={activeItem}
        isSaving={isSavingCostPrice}
        onCancel={() => setView("dashboard")}
        onSave={handleSave}
      />
    );
  }

  return (
    <div style={{ margin: "0 auto" }}>
      {/* Page title + period */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
        <div>
          <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "var(--color-primary)" }}>
            Foodies 1 LEKKI
          </p>
          <h1 style={{ margin: "6px 0 0", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-heading)" }}>
            FINANCIAL RECONCILIATION
          </h1>
          <p style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--color-text-muted)", margin: 0 }}>
            Financials, profit analysis and VAT
          </p>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <ReadonlyField label="Period" value={START_DATE} />
          <ReadonlyField label="To" value={END_DATE} />
        </div>
      </div>

      {/* Metric cards */}
      <div
        style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16, marginBottom: 20,
        }}
      >
        <MetricCard
          label="Total Sales" loading={summaryLoading}
          value={fmt(summary?.totalSales.amount)}
          change={summary ? `${summary.totalSales.changePercent > 0 ? "+" : ""}${summary.totalSales.changePercent}%` : "–"}
          positive={(summary?.totalSales.changePercent ?? 0) >= 0}
        />
        <MetricCard
          label="COGS" loading={summaryLoading}
          value={fmt(summary?.cogs.amount)}
          change={summary ? `${summary.cogs.changePercent > 0 ? "+" : ""}${summary.cogs.changePercent}%` : "–"}
          positive={(summary?.cogs.changePercent ?? 0) >= 0}
        />
        <MetricCard
          label="Gross Profit" loading={summaryLoading}
          value={fmt(summary?.grossProfit.amount)}
          change={summary ? `${summary.grossProfit.changePercent > 0 ? "+" : ""}${summary.grossProfit.changePercent}%` : "–"}
          positive={(summary?.grossProfit.changePercent ?? 0) >= 0}
        />
        <MetricCard
          label="Wastage" loading={summaryLoading}
          value={fmt(summary?.wastage.amount)}
          change={summary ? `${summary.wastage.changePercent > 0 ? "+" : ""}${summary.wastage.changePercent}%` : "–"}
          positive={(summary?.wastage.changePercent ?? 0) < 0}
        />
      </div>

      {!summaryLoading && summaryError && (
        <div style={{ ...CARD, padding: 16, marginBottom: 20 }}>
          <p style={{ margin: 0, fontSize: 13, color: "#9CA3AF" }}>
            {/* TODO(BACKEND): GET /admin/accounting/summary not implemented — see request doc #1 */}
            Summary data unavailable
          </p>
        </div>
      )}

      {/* Profit margin by item */}
      <SectionCard
        title="PROFIT MARGIN BY ITEM"
        action={
          <button
            style={{ background: "none", border: "none", cursor: "pointer", color: "#E10B1C", fontSize: 12.5, fontWeight: 700 }}
          >
            VIEW ALL
          </button>
        }
      >
        <div style={{ overflowX: "auto", margin: "-24px", marginTop: 0 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={TH_STYLE}>Item</th>
                <th style={TH_STYLE}>Selling Price</th>
                <th style={TH_STYLE}>Cost Price</th>
                <th style={TH_STYLE}>Margin %</th>
                <th style={TH_STYLE}>Subtotal</th>
                <th style={{ ...TH_STYLE, textAlign: "center" }}></th>
              </tr>
            </thead>
            <tbody>
              {marginItemsLoading && Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} style={TD_STYLE}><SkeletonText width="70%" height={12} /></td>
                  ))}
                </tr>
              ))}

              {!marginItemsLoading && (marginItemsError || !marginItems?.length) && (
                <tr>
                  <td colSpan={6} style={{ ...TD_STYLE, textAlign: "center", color: "#9CA3AF" }}>
                    {/* TODO(BACKEND): GET /admin/accounting/item-margins not implemented — see request doc #2 */}
                    No margin data available
                  </td>
                </tr>
              )}

              {!marginItemsLoading && !marginItemsError && marginItems?.map((m) => (
                <tr
                  key={m.id}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ ...TD_STYLE, fontWeight: 700, color: "#111827" }}>{m.itemName}</td>
                  <td style={TD_STYLE}>{fmt(m.sellingPrice)}</td>
                  <td style={TD_STYLE}>{fmt(m.costPrice)}</td>
                  <td style={TD_STYLE}>{m.marginPercent}%</td>
                  <td style={{ ...TD_STYLE, fontWeight: 600 }}>{fmt(m.sellingPrice - m.costPrice)}</td>
                  <td style={{ ...TD_STYLE, textAlign: "center" }}>
                    <button
                      onClick={() => openItem(m)}
                      title="Edit"
                      style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", padding: 4 }}
                    >
                      <IconPencil />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* COGS breakdown */}
      <SectionCard title="COST OF GOODS SOLD BREAKDOWN">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: "0 0 12px" }}>Food Items (Prepared in-house)</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <ReadonlyField label="Revenue" loading={summaryLoading} value={fmt(summary?.cogsBreakdown.food.revenue)} />
              <ReadonlyField label="COGS" loading={summaryLoading} value={fmt(summary?.cogsBreakdown.food.cogs)} />
              <ReadonlyField label="Margin %" loading={summaryLoading} value={summary ? `${summary.cogsBreakdown.food.marginPercent}` : "–"} />
            </div>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: "0 0 12px" }}>Drinks (Sold as received)</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <ReadonlyField label="Revenue" loading={summaryLoading} value={fmt(summary?.cogsBreakdown.drinks.revenue)} />
              <ReadonlyField label="COGS" loading={summaryLoading} value={fmt(summary?.cogsBreakdown.drinks.cogs)} />
              <ReadonlyField label="Margin %" loading={summaryLoading} value={summary ? `${summary.cogsBreakdown.drinks.marginPercent}` : "–"} />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Daily stock movement */}
      <SectionCard title="DAILY STOCK MOVEMENT">
        <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 360 }}>
          <ReadonlyField label={`Opening Stock (${START_DATE})`} loading={summaryLoading} value={fmt(summary?.stockMovement.openingStock)} />
          <ReadonlyField label="+ Purchases/ Deliveries" loading={summaryLoading} value={fmt(summary?.stockMovement.purchases)} />
          <ReadonlyField label="- COGS" loading={summaryLoading} value={fmt(summary?.stockMovement.cogs)} />
          <ReadonlyField label="- Wastage" loading={summaryLoading} value={fmt(summary?.stockMovement.wastage)} />
          <ReadonlyField label={`Closing Stock (${END_DATE})`} loading={summaryLoading} value={fmt(summary?.stockMovement.closingStock)} />
        </div>
      </SectionCard>

      {/* VAT collected */}
      <SectionCard title="VAT COLLECTED REPORT">
        <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 360 }}>
          <ReadonlyField label="Total Sales" loading={summaryLoading} value={fmt(summary?.vat.totalSales)} />
          <ReadonlyField label={`VAT (${summary?.vat.vatRate ?? "–"}%)`} loading={summaryLoading} value={fmt(summary?.vat.vatAmount)} />
          <ReadonlyField label="Remittance Due" loading={summaryLoading} value={summary?.vat.remittanceDueDate ?? "–"} />
        </div>
      </SectionCard>

      {/* Sales by payment method */}
      <SectionCard title="SALES BY PAYMENT METHOD">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16 }}>
          <ReadonlyField label="Mobile App (%)" loading={summaryLoading} value={summary ? `${summary.paymentMethodBreakdown.mobileApp}` : "–"} />
          <ReadonlyField label="POS (%)" loading={summaryLoading} value={summary ? `${summary.paymentMethodBreakdown.pos}` : "–"} />
          <ReadonlyField label="Cash (%)" loading={summaryLoading} value={summary ? `${summary.paymentMethodBreakdown.cash}` : "–"} />
          <ReadonlyField label="Bank Transfer (%)" loading={summaryLoading} value={summary ? `${summary.paymentMethodBreakdown.bankTransfer}` : "–"} />
        </div>
      </SectionCard>

      {/* Wastage breakdown */}
      <SectionCard title="WASTAGE BREAKDOWN">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
          <ReadonlyField
            label="Spoiled/Expired" loading={summaryLoading}
            value={summary ? `${fmt(summary.wastageBreakdown.spoiledExpired.amount)}  (${summary.wastageBreakdown.spoiledExpired.percent}%)` : "–"}
          />
          <ReadonlyField
            label="Damaged" loading={summaryLoading}
            value={summary ? `${fmt(summary.wastageBreakdown.damaged.amount)}  (${summary.wastageBreakdown.damaged.percent}%)` : "–"}
          />
          <ReadonlyField label="Other" loading={summaryLoading} value={fmt(summary?.wastageBreakdown.other.amount)} />
        </div>
      </SectionCard>

      {/* Recent sales */}
      <SectionCard
        title="RECENT SALES (with recorded by)"
        action={
          <button style={{ background: "none", border: "none", cursor: "pointer", color: "#E10B1C", fontSize: 12.5, fontWeight: 700 }}>
            VIEW ALL
          </button>
        }
      >
        <div style={{ overflowX: "auto", margin: "-24px", marginTop: 0 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={TH_STYLE}>Time</th>
                <th style={TH_STYLE}>Source</th>
                <th style={TH_STYLE}>Items</th>
                <th style={TH_STYLE}>Total</th>
                <th style={TH_STYLE}>Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {recentSalesLoading && Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} style={TD_STYLE}><SkeletonText width="70%" height={12} /></td>
                  ))}
                </tr>
              ))}

              {!recentSalesLoading && (recentSalesError || !recentSales?.length) && (
                <tr>
                  <td colSpan={5} style={{ ...TD_STYLE, textAlign: "center", color: "#9CA3AF" }}>
                    {/* TODO(BACKEND): GET /admin/accounting/recent-sales not implemented — see request doc #4 */}
                    No recent sales available
                  </td>
                </tr>
              )}

              {!recentSalesLoading && !recentSalesError && recentSales?.map((s) => (
                <tr
                  key={s.id}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ ...TD_STYLE, fontWeight: 600, color: "#111827" }}>{s.time}</td>
                  <td style={TD_STYLE}>{s.source}</td>
                  <td style={TD_STYLE}>{s.items}</td>
                  <td style={{ ...TD_STYLE, fontWeight: 700, color: "#111827" }}>{fmt(s.total)}</td>
                  <td style={TD_STYLE}>{s.recordedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}