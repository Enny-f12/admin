"use client";
import { useState } from "react";

interface MarginItem {
  id: number;
  item: string;
  sellingPrice: number;
  costPrice: number;
  margin: number;
  type: "Food" | "Drink";
}

interface SaleRow {
  id: number;
  time: string;
  source: string;
  items: string;
  total: number;
  recordedBy: string;
}

const MARGIN_ITEMS: MarginItem[] = [
  { id: 1, item: "Jollof Rice", sellingPrice: 3000, costPrice: 1200, margin: 60, type: "Food" },
  { id: 2, item: "Beef", sellingPrice: 2000, costPrice: 1000, margin: 50, type: "Food" },
  { id: 3, item: "Can Coke", sellingPrice: 1000, costPrice: 800, margin: 20, type: "Drink" },
];

const RECENT_SALES: SaleRow[] = [
  { id: 1, time: "10:15 AM", source: "Manual Sale", items: "Jollof x2, Coke x2", total: 7600, recordedBy: "Sarah J." },
  { id: 2, time: "10:00 AM", source: "POS (Auto)", items: "Egusi x1", total: 3500, recordedBy: "Moniepoint" },
  { id: 3, time: "9:45 AM", source: "Mobile App", items: "Fried Rice x1", total: 3200, recordedBy: "System" },
];

const fmt = (n: number) => "₦" + n.toLocaleString("en-NG");

// ── Icons ─────────────────────────────────────────────────────────────────────
function IconDollar() {
  return (
    <span style={{ fontWeight: 800, fontSize: 18, lineHeight: 1, color: "#fff" }}>₦</span>
  );
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
function IconChevronDown({ color = "#9CA3AF" }: { color?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5v14" />
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

function ReadonlyField({ label, value }: { label: string; value: string }) {
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
        {value}
      </div>
    </div>
  );
}

function DropdownField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{label}</label>
      <button
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 42, padding: "0 14px", width: "100%",
          background: "#FAFAFA", border: "1px solid #EBEBEB", borderRadius: 8,
          fontSize: 14, color: "#374151", cursor: "pointer",
        }}
      >
        {value}
        <IconChevronDown />
      </button>
    </div>
  );
}

function MetricCard({
  label, value, change, positive,
}: { label: string; value: string; change: string; positive: boolean }) {
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
        <span
          style={{
            display: "flex", alignItems: "center", gap: 3,
            fontSize: 12.5, fontWeight: 700, color: positive ? "#16A34A" : "#DC2626",
          }}
        >
          {change} {positive ? <IconArrowUp /> : <IconArrowDown />}
        </span>
      </div>
      <div>
        <p style={{ fontSize: 13, color: "#9CA3AF", margin: "0 0 4px" }}>{label}</p>
        <p style={{ fontSize: "1.4rem", fontWeight: 700, color: "#111827", margin: 0 }}>{value}</p>
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
  item, onCancel, onSave,
}: { item: MarginItem; onCancel: () => void; onSave: () => void }) {
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
        <button
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "#E05C2A", color: "#fff", border: "none",
            borderRadius: 10, padding: "11px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          <IconPlus /> Add Item
        </button>
      </div>

      <div style={{ ...CARD, padding: 24, maxWidth: 560 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <DropdownField label="Item" value={item.item} />
          <DropdownField label="Type" value={item.type} />
          <ReadonlyField label="Selling Price" value={fmt(item.sellingPrice)} />
          <ReadonlyField label="Cost Price" value={fmt(item.costPrice)} />
          <ReadonlyField label="Profit Margin" value={`${item.margin}%`} />

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
              onClick={onSave}
              style={{
                background: "#E10B1C", color: "#fff", border: "none",
                borderRadius: 10, padding: "11px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              Save
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
export default function AccountingPage() {
  const [view, setView] = useState<"dashboard" | "edit">("dashboard");
  const [activeItem, setActiveItem] = useState<MarginItem>(MARGIN_ITEMS[0]);

  const openItem = (item: MarginItem) => {
    setActiveItem(item);
    setView("edit");
  };

  if (view === "edit") {
    return (
      <ItemConfigView
        item={activeItem}
        onCancel={() => setView("dashboard")}
        onSave={() => setView("dashboard")}
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
          <DropdownField label="Period" value="May 1, 2026" />
          <DropdownField label="To" value="May 15, 2026" />
        </div>
      </div>

      {/* Metric cards */}
      <div
        style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16, marginBottom: 20,
        }}
      >
        <MetricCard label="Total Sales" value={fmt(1245000)} change="+15%" positive />
        <MetricCard label="COGS" value={fmt(490000)} change="+8%" positive />
        <MetricCard label="Gross Profit" value={fmt(755000)} change="+18%" positive />
        <MetricCard label="Wastage" value={fmt(12500)} change="-5%" positive={false} />
      </div>

      {/* Profit margin by item */}
      <SectionCard
        title="PROFIT MARGIN BY ITEM"
        action={
          <button
            onClick={() => setView("edit")}
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
              {MARGIN_ITEMS.map((m) => (
                <tr
                  key={m.id}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ ...TD_STYLE, fontWeight: 700, color: "#111827" }}>{m.item}</td>
                  <td style={TD_STYLE}>{fmt(m.sellingPrice)}</td>
                  <td style={TD_STYLE}>{fmt(m.costPrice)}</td>
                  <td style={TD_STYLE}>{m.margin}%</td>
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
              <ReadonlyField label="Revenue" value={fmt(1000000)} />
              <ReadonlyField label="COGS" value={fmt(420000)} />
              <ReadonlyField label="Margin %" value="62" />
            </div>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: "0 0 12px" }}>Drinks (Sold as received)</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <ReadonlyField label="Revenue" value={fmt(145000)} />
              <ReadonlyField label="COGS" value={fmt(70000)} />
              <ReadonlyField label="Margin %" value="52" />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Daily stock movement */}
      <SectionCard title="DAILY STOCK MOVEMENT">
        <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 360 }}>
          <ReadonlyField label="Opening Stock (May 1)" value={fmt(380000)} />
          <ReadonlyField label="+ Purchases/ Deliveries" value={fmt(120000)} />
          <ReadonlyField label="- COGS" value={fmt(450000)} />
          <ReadonlyField label="- Wastage" value={fmt(12500)} />
          <ReadonlyField label="Closing Stock (May 15)" value={fmt(37500)} />
        </div>
      </SectionCard>

      {/* VAT collected */}
      <SectionCard title="VAT COLLECTED REPORT">
        <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 360 }}>
          <ReadonlyField label="Total Sales" value={fmt(1245000)} />
          <ReadonlyField label="VAT (7.5%)" value={fmt(93375)} />
          <DropdownField label="Remittance Due" value="May 16, 2026" />
        </div>
      </SectionCard>

      {/* Sales by payment method */}
      <SectionCard title="SALES BY PAYMENT METHOD">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16 }}>
          <ReadonlyField label="Mobile App (%)" value="45" />
          <ReadonlyField label="POS (%)" value="35" />
          <ReadonlyField label="Cash (%)" value="15" />
          <ReadonlyField label="Bank Transfer (%)" value="5" />
        </div>
      </SectionCard>

      {/* Wastage breakdown */}
      <SectionCard title="WASTAGE BREAKDOWN">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
          <ReadonlyField label="Spoiled/Expired" value={`${fmt(75000)}  (60%)`} />
          <ReadonlyField label="Damaged" value={`${fmt(3000)}  (24%)`} />
          <ReadonlyField label="Other" value={fmt(2000)} />
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
              {RECENT_SALES.map((s) => (
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