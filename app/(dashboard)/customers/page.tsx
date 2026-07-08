"use client";
import { useState, useMemo } from "react";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  orders: number;
  spent: number;
  lastOrder: string;
  joined: string;
}

const CUSTOMERS: Customer[] = [
  { id: 1, name: "Sarah Mitchell", email: "sarahmitchell@gmail.com", phone: "+234 912 2344 456", orders: 24, spent: 20000, lastOrder: "Today", joined: "April 2026" },
  { id: 2, name: "Mike Okafor", email: "mikeokafor@gmail.com", phone: "+234 803 4455 667", orders: 18, spent: 15000, lastOrder: "Yesterday", joined: "May 2026" },
  { id: 3, name: "Ada Kalu", email: "adakalu@gmail.com", phone: "+234 701 2233 445", orders: 10, spent: 15000, lastOrder: "15th May 2026", joined: "May 2026" },
  { id: 4, name: "John Caleb", email: "johncaleb@gmail.com", phone: "+234 814 5566 778", orders: 30, spent: 10000, lastOrder: "20th May 2026", joined: "May 2026" },
  { id: 5, name: "Lisa Park", email: "lisapark@gmail.com", phone: "+234 905 6677 889", orders: 12, spent: 5000, lastOrder: "20th May 2026", joined: "May 2026" },
  { id: 6, name: "Abel Ferdinard", email: "abel001@gmail.com", phone: "+234 706 7788 990", orders: 5, spent: 16000, lastOrder: "20th May 2026", joined: "June 2026" },
];

const AVATAR_COLORS = ["#E05C2A", "#F5A623", "#16A34A", "#0284C7", "#7C3AED", "#DB2777"];

const fmt = (n: number) => "₦" + n.toLocaleString("en-NG");
const initials = (name: string) =>
  name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

// ── Icons ─────────────────────────────────────────────────────────────────────
function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#BDBDBD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}
function IconEye() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#BDBDBD" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function IconMail({ size = 17, color = "#BDBDBD" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}
function IconX({ size = 14, color = "#9CA3AF" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
function IconPhone() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.89 12 19.79 19.79 0 0 1 1.92 3.22C1.7 2.09 2.57 1 3.64 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.86-.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
function IconBox() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E05C2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7.5 4.27 9 5.15M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E05C2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// ── Customer Modal ────────────────────────────────────────────────────────────
function CustomerModal({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const color = AVATAR_COLORS[customer.id % AVATAR_COLORS.length];
  const stats = [
    { icon: <IconBox />, value: String(customer.orders), label: "Orders" },
    { icon: <span style={{ color: "#E05C2A", fontWeight: 800, fontSize: 18, lineHeight: 1 }}>₦</span>, value: customer.spent.toLocaleString("en-NG"), label: "Spent" },
    { icon: <IconClock />, value: customer.lastOrder, label: "Last Order" },
  ];
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 380, background: "#fff",
          borderRadius: 20, overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
          border: "1px solid #F0F0F0",
        }}
      >
        {/* Header */}
        <div style={{
          background: "#FFF5F0", padding: "20px 20px 16px",
          display: "flex", alignItems: "center", gap: 14,
          borderBottom: "1px solid #F0E8E4", position: "relative",
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: color, color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 15, flexShrink: 0,
          }}>
            {initials(customer.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: 16, color: "#111827", margin: 0 }}>{customer.name}</p>
            <p style={{ fontSize: 12, color: "#9CA3AF", margin: "3px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{customer.email}</p>
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: "50%",
            border: "1px solid #E5E7EB", background: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0,
          }}>
            <IconX />
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid #F3F4F6" }}>
          {stats.map((s, i) => (
            <div key={i} style={{
              display: "flex", flexDirection: "column" as const, alignItems: "center",
              gap: 5, padding: "16px 8px", textAlign: "center" as const,
              borderRight: i < 2 ? "1px solid #F3F4F6" : "none",
            }}>
              <div>{s.icon}</div>
              <p style={{ fontWeight: 700, fontSize: 14, color: "#111827", margin: 0 }}>{s.value}</p>
              <p style={{ fontSize: 10, color: "#9CA3AF", margin: 0, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div style={{ padding: "14px 20px", display: "flex", flexDirection: "column" as const, gap: 10, borderBottom: "1px solid #F3F4F6" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <IconPhone />
            <span style={{ fontSize: 13, color: "#374151" }}>{customer.phone}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <IconCalendar />
            <span style={{ fontSize: 13, color: "#374151" }}>Joined {customer.joined}</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "14px 16px" }}>
          <button onClick={onClose} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            background: "#E05C2A", color: "#fff", border: "none",
            borderRadius: 10, padding: "10px 0", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>
            <IconMail size={14} color="#fff" /> Send Email
          </button>
          <button onClick={onClose} style={{
            background: "transparent", color: "#6B7280",
            border: "1px solid #E5E7EB", borderRadius: 10,
            padding: "10px 0", fontSize: 13, fontWeight: 500, cursor: "pointer",
          }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [focused, setFocused] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return CUSTOMERS.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
  }, [search]);

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
    padding: "18px 20px",
    fontSize: 14,
    color: "#6B7280",
    borderBottom: "1px solid #F5F5F5",
    whiteSpace: "nowrap",
  };

  return (
    <>
      {selected && <CustomerModal customer={selected} onClose={() => setSelected(null)} />}

      <div style={{ margin: "0 auto" }}>

        {/* Page title */}
        <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "var(--color-primary)" }}>
          Foodies 1 LEKKI
        </p>
        <h1 style={{ margin: "6px 0 0", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-heading)" }}>
          CUSTOMERS MANAGEMENT
        </h1>
        <p style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--color-text-muted)", margin: "0 0 24px" }}>
          View and manage customers
        </p>

        {/* Outer card */}
        <div style={{
          background: "#fff", borderRadius: 16,
          border: "1px solid #EBEBEB",
          boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
          overflow: "hidden",
        }}>

          {/* Search */}
          <div style={{ padding: "20px 20px 0" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              height: 46, padding: "0 14px",
              background: "#FAFAFA",
              border: `1.5px solid ${focused ? "#E05C2A" : "#EBEBEB"}`,
              borderRadius: 10,
              boxShadow: focused ? "0 0 0 3px rgba(224,92,42,0.08)" : "none",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}>
              <IconSearch />
              <input
                type="text"
                placeholder="Search customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={{
                  flex: 1, border: "none", outline: "none",
                  background: "transparent", fontSize: 14,
                  color: "#111827", minWidth: 0,
                }}
              />
              {search && (
                <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 0 }}>
                  <IconX />
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto", marginTop: 20 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...TH_STYLE }}>Name</th>
                  <th style={{ ...TH_STYLE }}>Email</th>
                  <th style={{ ...TH_STYLE, textAlign: "center" }}>Orders</th>
                  <th style={{ ...TH_STYLE }}>Spent</th>
                  <th style={{ ...TH_STYLE }}>Last Order</th>
                  <th style={{ ...TH_STYLE }}>Joined</th>
                  <th style={{ ...TH_STYLE, textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ ...TD_STYLE, textAlign: "center", padding: "48px 0", color: "#9CA3AF" }}>
                      No customers found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr
                      key={c.id}
                      style={{ transition: "background 0.1s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* Name — bold, no avatar */}
                      <td style={{ ...TD_STYLE }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{c.name}</span>
                      </td>

                      {/* Email */}
                      <td style={{ ...TD_STYLE }}>{c.email}</td>

                      {/* Orders */}
                      <td style={{ ...TD_STYLE, textAlign: "center" }}>
                        <span style={{ fontWeight: 600, color: "#374151" }}>{c.orders}</span>
                      </td>

                      {/* Spent */}
                      <td style={{ ...TD_STYLE }}>
                        <span style={{ fontWeight: 700, color: "#111827" }}>{fmt(c.spent)}</span>
                      </td>

                      {/* Last Order */}
                      <td style={{ ...TD_STYLE }}>{c.lastOrder}</td>

                      {/* Joined */}
                      <td style={{ ...TD_STYLE }}>{c.joined}</td>

                      {/* Actions */}
                      <td style={{ ...TD_STYLE, textAlign: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                          <button
                            title="View details"
                            onClick={() => setSelected(c)}
                            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 4 }}
                          >
                            <IconEye />
                          </button>
                          <button
                            title="Send email"
                            onClick={() => setSelected(c)}
                            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 4 }}
                          >
                            <IconMail />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div style={{
            padding: "14px 20px",
            borderTop: "1px solid #F0F0F0",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>
              Showing <b style={{ color: "#374151" }}>{filtered.length}</b> of{" "}
              <b style={{ color: "#374151" }}>{CUSTOMERS.length}</b> customers
            </p>
            <div style={{ display: "flex", gap: 6 }}>
              {["Previous", "Next"].map((label) => (
                <button
                  key={label}
                  disabled
                  style={{
                    padding: "6px 14px", borderRadius: 8,
                    border: "1px solid #E5E7EB", background: "#fff",
                    fontSize: 12, color: "#D1D5DB", cursor: "not-allowed",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}