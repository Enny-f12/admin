"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  CalendarDays,
  Bike,
  Package,
  Users,
  UserCog,
  BarChart2,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard",        href: "/dashboard",               icon: LayoutDashboard },
  { label: "Orders",           href: "/dashboard/orders",        icon: ShoppingBag },
  { label: "Menu",             href: "/dashboard/menu",          icon: UtensilsCrossed },
  { label: "Reservations",     href: "/dashboard/reservations",  icon: CalendarDays },
  { label: "Delivery",         href: "/dashboard/delivery",      icon: Bike },
  { label: "Inventory",        href: "/dashboard/inventory",     icon: Package },
  { label: "Customers",        href: "/dashboard/customers",     icon: Users },
  { label: "Staff Management", href: "/dashboard/staff",         icon: UserCog },
  { label: "Analytics",        href: "/dashboard/analytics",     icon: BarChart2 },
  { label: "Settings",         href: "/dashboard/settings",      icon: Settings },
];

/* ── Light sidebar tokens ── */
const SB = {
  bg:         "#FFFFFF",
  border:     "#E4E0D8",
  text:       "#6B6B6B",
  textHover:  "var(--color-text)",       // matches table row hover text
  hoverBg:    "var(--color-bg-soft)",    // matches tbody tr:hover background
  activeBg:   "rgba(225, 11, 28, 0.08)",
  activeText: "#E10B1C",
  divider:    "#E4E0D8",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname  = usePathname();
  const sidebarW  = collapsed ? 72 : 240;

  const pageTitle =
    NAV_ITEMS.find((n) => n.href === pathname)?.label ?? "Dashboard";

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "var(--font-sans)",
        background: "var(--color-bg)",
      }}
    >
      {/* ── Sidebar ── */}
      <aside
        style={{
          width: sidebarW,
          minWidth: sidebarW,
          height: "100vh",
          background: SB.bg,
          borderRight: `1px solid ${SB.border}`,
          display: "flex",
          flexDirection: "column",
          transition: "width 0.22s ease, min-width 0.22s ease",
          overflow: "hidden",
          zIndex: 40,
          flexShrink: 0,
        }}
      >
        {/* Logo + toggle */}
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            padding: collapsed ? "0 16px" : "0 14px 0 20px",
            borderBottom: `1px solid ${SB.divider}`,
            flexShrink: 0,
          }}
        >
          {!collapsed && (
            <Image
              src="/logo/Logo.png"
              alt="Foodies Hot & Spicy"
              width={60}
              height={22}
              style={{ height: "auto", objectFit: "contain" }}
              priority
            />
          )}
          <button
            onClick={() => setCollapsed((v) => !v)}
            aria-label="Toggle sidebar"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: SB.text,
              display: "flex",
              padding: 4,
              borderRadius: 6,
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = SB.textHover)
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = SB.text)
            }
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* Nav items */}
        <nav
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "10px 10px",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
          className="no-scrollbar"
        >
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: collapsed ? "10px 0" : "9px 12px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontWeight: active ? 600 : 400,
                  fontSize: "0.875rem",
                  color: active ? SB.activeText : SB.text,
                  background: active ? SB.activeBg : "transparent",
                  transition: "background 0.15s, color 0.15s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLAnchorElement).style.background = SB.hoverBg;
                    (e.currentTarget as HTMLAnchorElement).style.color = SB.textHover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                    (e.currentTarget as HTMLAnchorElement).style.color = SB.text;
                  }
                }}
              >
                <Icon size={18} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: logout + user */}
        <div
          style={{
            borderTop: `1px solid ${SB.divider}`,
            padding: "10px 10px",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            flexShrink: 0,
          }}
        >
          {/* Logout */}
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: collapsed ? "10px 0" : "9px 12px",
              justifyContent: collapsed ? "center" : "flex-start",
              borderRadius: 8,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: SB.text,
              fontSize: "0.875rem",
              fontFamily: "var(--font-sans)",
              fontWeight: 400,
              width: "100%",
              transition: "color 0.15s, background 0.15s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = SB.textHover;
              (e.currentTarget as HTMLButtonElement).style.background = SB.hoverBg;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = SB.text;
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            <LogOut size={18} strokeWidth={1.8} style={{ flexShrink: 0 }} />
            {!collapsed && <span>Logout</span>}
          </button>

          {/* User row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: collapsed ? "8px 0" : "8px 12px",
              justifyContent: collapsed ? "center" : "flex-start",
              marginTop: 4,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "var(--color-secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
                fontSize: "0.72rem",
                color: "#7a5500",
                flexShrink: 0,
              }}
            >
              AD
            </div>
            {!collapsed && (
              <div style={{ overflow: "hidden" }}>
                <p
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "var(--color-text)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    margin: 0,
                  }}
                >
                  Admin User
                </p>
                <p
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 400,
                    color: SB.text,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    margin: 0,
                  }}
                >
                  admin@foodies.com
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        {/* Navbar */}
        <header
          style={{
            height: 64,
            background: "var(--color-bg-card)",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 28px",
            flexShrink: 0,
            zIndex: 30,
          }}
        >
          <h1
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "var(--color-heading)",
              margin: 0,
            }}
          >
            {pageTitle}
          </h1>

          <button
            aria-label="Notifications"
            style={{
              position: "relative",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-text-secondary)",
              display: "flex",
              padding: 6,
              borderRadius: 8,
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = "var(--color-text)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-secondary)")
            }
          >
            <Bell size={20} strokeWidth={1.8} />
            <span
              style={{
                position: "absolute",
                top: 5,
                right: 5,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--color-secondary)",
                border: "2px solid var(--color-bg-card)",
              }}
            />
          </button>
        </header>

        {/* Page content */}
        <main
          style={{ flex: 1, overflowY: "auto", padding: "28px" }}
          className="no-scrollbar"
        >
          {children}
        </main>
      </div>
    </div>
  );
}