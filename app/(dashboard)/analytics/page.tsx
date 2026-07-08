"use client";
import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";
import type { TooltipProps } from "recharts";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";

type Range = "7d" | "30d" | "6m" | "1y";
type Metric = "revenue" | "orders";

interface DataPoint { month: string; revenue: number; orders: number; }
interface TopItem { rank: number; name: string; orders: number; revenue: number; }

const DATA: Record<Range, DataPoint[]> = {
  "7d": [
    { month: "Mon", revenue: 12000, orders: 78 },
    { month: "Tue", revenue: 9500, orders: 62 },
    { month: "Wed", revenue: 14000, orders: 91 },
    { month: "Thu", revenue: 11000, orders: 72 },
    { month: "Fri", revenue: 18000, orders: 115 },
    { month: "Sat", revenue: 22000, orders: 142 },
    { month: "Sun", revenue: 16500, orders: 107 },
  ],
  "30d": [
    { month: "Week 1", revenue: 52000, orders: 340 },
    { month: "Week 2", revenue: 61000, orders: 390 },
    { month: "Week 3", revenue: 58000, orders: 370 },
    { month: "Week 4", revenue: 77000, orders: 430 },
  ],
  "6m": [
    { month: "Jan", revenue: 120000, orders: 820 },
    { month: "Feb", revenue: 150000, orders: 940 },
    { month: "Mar", revenue: 170000, orders: 1100 },
    { month: "Apr", revenue: 160000, orders: 1050 },
    { month: "May", revenue: 200000, orders: 1280 },
    { month: "Jun", revenue: 220000, orders: 1390 },
    { month: "Jul", revenue: 248000, orders: 1530 },
  ],
  "1y": [
    { month: "Aug", revenue: 90000, orders: 600 },
    { month: "Sep", revenue: 95000, orders: 640 },
    { month: "Oct", revenue: 108000, orders: 710 },
    { month: "Nov", revenue: 115000, orders: 760 },
    { month: "Dec", revenue: 140000, orders: 920 },
    { month: "Jan", revenue: 120000, orders: 820 },
    { month: "Feb", revenue: 150000, orders: 940 },
    { month: "Mar", revenue: 170000, orders: 1100 },
    { month: "Apr", revenue: 160000, orders: 1050 },
    { month: "May", revenue: 200000, orders: 1280 },
    { month: "Jun", revenue: 220000, orders: 1390 },
    { month: "Jul", revenue: 248000, orders: 1530 },
  ],
};

const TOP_ITEMS: TopItem[] = [
  { rank: 1, name: "Inferno Burger", orders: 312, revenue: 50000 },
  { rank: 2, name: "Jam Doughnut", orders: 245, revenue: 50000 },
  { rank: 3, name: "Spicy Jollof Rice", orders: 189, revenue: 70000 },
  { rank: 4, name: "Fried Rice", orders: 200, revenue: 70000 },
  { rank: 5, name: "Peppersoup", orders: 167, revenue: 42000 },
];

const RANGE_OPTS: { key: Range; label: string }[] = [
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "6m", label: "6 months" },
  { key: "1y", label: "1 year" },
];

const RANK_COLORS = ["#E05C2A", "#F5A623", "#F5C842", "#D1D5DB", "#D1D5DB"];

const fmt = (n: number) => "₦" + n.toLocaleString("en-NG");
const fmtShort = (n: number) => n >= 1000 ? "₦" + Math.round(n / 1000) + "k" : "₦" + n;
const sumField = (arr: DataPoint[], key: Metric) => arr.reduce((a, d) => a + d[key], 0);
const calcChange = (arr: DataPoint[], key: Metric) => {
  if (arr.length < 2) return 0;
  const mid = Math.floor(arr.length / 2);
  const a = arr.slice(0, mid).reduce((s, d) => s + d[key], 0);
  const b = arr.slice(mid).reduce((s, d) => s + d[key], 0);
  return a ? Math.round(((b - a) / a) * 100) : 0;
};

// ── Icons ─────────────────────────────────────────────────────────────────────
function IconRevenue() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E05C2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
function IconOrders() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7.5 4.27 9 5.15M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
    </svg>
  );
}
function IconAvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
    </svg>
  );
}
function IconDownload() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
function TrendUp() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  );
}
function TrendDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" />
    </svg>
  );
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ChartTooltipProps = TooltipProps<ValueType, NameType> & { metric: Metric; label?: string | number; payload?: any };

function ChartTooltip({ active, payload, label, metric }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const raw = payload[0]?.value;
  const value = typeof raw === "number" ? raw : 0;
  return (
    <div style={{ background: "#fff", border: "1px solid #F0F0F0", borderRadius: 12, padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", minWidth: 130 }}>
      <p style={{ fontWeight: 700, fontSize: 12, color: "#374151", margin: "0 0 6px" }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 700, color: "#E05C2A", margin: 0 }}>
        {metric === "revenue" ? fmt(value) : value + " orders"}
      </p>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, iconBg, label, value, change }: { icon: React.ReactNode; iconBg: string; label: string; value: string; change: number }) {
  const up = change >= 0;
  return (
    <div style={{ background: "#fff", border: "1px solid #F0F0F0", borderRadius: 16, padding: "18px 20px", display: "flex", flexDirection: "column" as const, gap: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </div>
        <span style={{
          display: "flex", alignItems: "center", gap: 4,
          fontSize: 11, fontWeight: 700,
          padding: "4px 8px", borderRadius: 20,
          background: up ? "#F0FDF4" : "#FFF1F2",
          color: up ? "#16A34A" : "#DC2626",
        }}>
          {up ? <TrendUp /> : <TrendDown />}
          {Math.abs(change)}%
        </span>
      </div>
      <div>
        <p style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: "0 0 4px", lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0 }}>{label}</p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>("6m");
  const [metric, setMetric] = useState<Metric>("revenue");

  const data = useMemo(() => DATA[range], [range]);
  const totalRevenue = useMemo(() => sumField(data, "revenue"), [data]);
  const totalOrders = useMemo(() => sumField(data, "orders"), [data]);
  const avgOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const revChange = useMemo(() => calcChange(data, "revenue"), [data]);
  const ordChange = useMemo(() => calcChange(data, "orders"), [data]);

  return (
    <div style={{ margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "var(--color-primary)" }}>
                Foodies 1 LEKKI
            </p>
            <h1 style={{ margin: "6px 0 0", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-heading)" }}>
                ANALYTICS
            </h1>
          
          <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>Every change is logged in with user, timestamp and overview</p>
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: 7, background: "#E05C2A", color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <IconDownload /> Export
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
        <StatCard icon={<IconRevenue />} iconBg="#FFF0EB" label="Total Revenue" value={fmt(totalRevenue)} change={revChange} />
        <StatCard icon={<IconOrders />} iconBg="#FFF7E6" label="Total Orders" value={totalOrders.toLocaleString()} change={ordChange} />
        <StatCard icon={<IconAvg />} iconBg="#EFF6FF" label="Avg. Order Value" value={fmt(avgOrder)} change={Math.round((revChange + ordChange) / 2)} />
      </div>

      {/* Chart card */}
      <div style={{ background: "#fff", border: "1px solid #F0F0F0", borderRadius: 16, padding: "20px", marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>

        {/* Chart controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 12, marginBottom: 20 }}>
          {/* Metric toggle */}
          <div style={{ display: "flex", gap: 6 }}>
            {(["revenue", "orders"] as Metric[]).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                style={{
                  padding: "6px 14px", borderRadius: 8, border: "none",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  textTransform: "capitalize" as const,
                  background: metric === m ? "#E05C2A" : "#F3F4F6",
                  color: metric === m ? "#fff" : "#6B7280",
                  transition: "all 0.15s",
                }}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Range pills */}
          <div style={{ display: "flex", gap: 2, background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: 3 }}>
            {RANGE_OPTS.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                style={{
                  padding: "5px 12px", borderRadius: 8, border: "none",
                  fontSize: 11, fontWeight: 600, cursor: "pointer",
                  background: range === r.key ? "#fff" : "transparent",
                  color: range === r.key ? "#111827" : "#9CA3AF",
                  boxShadow: range === r.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s",
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", margin: "0 0 16px" }}>
          {metric === "revenue" ? "Revenue" : "Order"} Overview
        </p>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false}
              tickFormatter={metric === "revenue" ? fmtShort : (v: number) => String(v)}
              width={52}
            />
            <Tooltip content={(props) => <ChartTooltip {...props} metric={metric} />} />
            <Line
              type="monotone" dataKey={metric} stroke="#E05C2A" strokeWidth={2.5}
              dot={{ r: 4, fill: "#E05C2A", strokeWidth: 0 }}
              activeDot={{ r: 6, fill: "#E05C2A", stroke: "#fff", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

        {/* Top Selling Items */}
        <div style={{ background: "#fff", border: "1px solid #F0F0F0", borderRadius: 16, padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: "0 0 16px" }}>Top Selling Items</p>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
            {TOP_ITEMS.map((item) => (
              <div key={item.rank} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                  background: RANK_COLORS[item.rank - 1],
                  color: item.rank <= 3 ? "#fff" : "#6B7280",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700,
                }}>
                  {item.rank}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: "0 0 1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{item.name}</p>
                  <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>{item.orders} orders</p>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#E05C2A", flexShrink: 0 }}>{fmt(item.revenue)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by Item bar chart */}
        <div style={{ background: "#fff", border: "1px solid #F0F0F0", borderRadius: 16, padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: "0 0 16px" }}>Revenue by Item</p>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={TOP_ITEMS} layout="vertical" margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={fmtShort} />
              <YAxis
                type="category" dataKey="name" width={88}
                tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false}
                tickFormatter={(v: string) => v.length > 13 ? v.slice(0, 13) + "…" : v}
              />
              <Tooltip
                formatter={(value: ValueType | undefined) => [typeof value === "number" ? fmt(value) : value ?? "", "Revenue"]}
                contentStyle={{ background: "#fff", border: "1px solid #F0F0F0", borderRadius: 12, fontSize: 12 }}
              />
              <Bar dataKey="revenue" radius={[0, 6, 6, 0] as [number, number, number, number]} maxBarSize={20}>
                {TOP_ITEMS.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? "#E05C2A" : i === 1 ? "#F5A623" : i === 2 ? "#F5C842" : "#E5E7EB"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}