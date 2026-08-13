// app/(admin)/layout.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext } from "react";
import {
  LayoutDashboard,
  ClipboardPlus,
  Box,
  GlassWater,
  Building2,
  ChefHat,
  ClipboardCheck,
  ShoppingBag,
  Phone,
  Monitor,
  CreditCard,
  CalendarDays,
  Bike,
  UtensilsCrossed,
  Users,
  UserCog,
  BarChart2,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Store,
  ChevronDown,
  Check,
  Calculator,
  ClipboardList,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuthStore } from "@/store/useAuthStore";

/* ── Nav structure ── */
const NAV_SECTIONS = [
  {
    title: "OVERVIEW",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "INVENTORY",
    items: [
      { label: "Morning Count", href: "/inventory/morning-count", icon: ClipboardPlus },
      { label: "Stock Inventory", href: "/inventory/stock", icon: Box },
      { label: "Drinks & Fridge", href: "/inventory/drinks-fridge", icon: GlassWater },
      { label: "Suppliers", href: "/inventory/suppliers", icon: Building2 },
      { label: "Food Inventory", href: "/inventory/food", icon: ChefHat },
      { label: "Reconciliation", href: "/inventory/reconciliation", icon: ClipboardCheck },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { label: "Orders", href: "/orders", icon: ShoppingBag },
      { label: "Walk-in/ Phone", href: "/orders/walk-in", icon: Phone },
      { label: "Kitchen Display", href: "/kitchen", icon: Monitor },
      { label: "Payments", href: "/payments", icon: CreditCard },
      { label: "Reservations", href: "/reservations", icon: CalendarDays },
      { label: "Delivery", href: "/delivery", icon: Bike },
    ],
  },
  {
    title: "MENU & PEOPLE",
    items: [
      { label: "Menu", href: "/menu", icon: UtensilsCrossed },
      { label: "Customers", href: "/customers", icon: Users },
      { label: "Staff", href: "/staff", icon: UserCog },
    ],
  },
  {
    title: "FINANCE & SYSTEM",
    items: [
      { label: "Accounting", href: "/accounting", icon: Calculator },
      { label: "Analytics", href: "/analytics", icon: BarChart2 },
      { label: "Audit Logs", href: "/audit-logs", icon: ClipboardList },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

/**
 * Branch names are used exactly as returned by GET /auth/branches — no
 * relabeling. If the backend's branch names ever need to change, that's
 * a backend-side edit, not a frontend override.
 */

/**
 * CHANGED — branch scoping now has a real backend to talk to: GET
 * /auth/branches (confirmed live, same endpoint the login screen uses).
 * BranchContext now carries { id, name } instead of a bare display
 * string, since `id` is what any branch-scoped API call actually needs
 * (e.g. the delivery zones / reservations endpoints that take a
 * `branchId` query param). `name` is already display-mapped via
 * displayBranchName() before it reaches context, so consumers can render
 * it directly.
 */
export interface SelectedBranch {
  id: string;
  name: string;
}

const BranchContext = createContext<SelectedBranch>({ id: "", name: "" });
export const useBranch = () => useContext(BranchContext);

/* ── Light sidebar tokens ── */
const SB = {
  bg:          "#FFFFFF",
  border:      "#E4E0D8",
  text:        "#6B6B6B",
  textHover:   "var(--color-text)",
  hoverBg:     "var(--color-bg-soft)",
  activeBg:    "rgba(225, 11, 28, 0.08)",
  activeText:  "#E10B1C",
  divider:     "#E4E0D8",
  sectionText: "#9A9690",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const pathname = usePathname();
  const sidebarW = collapsed ? 72 : 240;

  // NEW — real branch list, shared with the login screen via the same
  // auth store slice (one fetch source, no duplicate hardcoded lists).
  const { branches, branchesLoading, fetchBranches } = useAuthStore();
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  // Default to the first branch once the list loads, if nothing's been
  // explicitly picked yet.
  useEffect(() => {
    if (branches && branches.length > 0 && selectedBranchId === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedBranchId(branches[0].id);
    }
  }, [branches, selectedBranchId]);

  const selectedBranch =
    branches?.find((b) => b.id === selectedBranchId) ?? branches?.[0] ?? null;

  const branchContextValue: SelectedBranch = selectedBranch
    ? { id: selectedBranch.id, name: selectedBranch.name }
    : { id: "", name: branchesLoading ? "Loading…" : "Select branch" };

  const pageTitle =
    NAV_SECTIONS.flatMap((s) => s.items).find((n) => n.href === pathname)
      ?.label ?? "Dashboard";

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
              src="/logo/foodies1.png"
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
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} style={{ marginBottom: 8 }}>
              {!collapsed && (
                <p
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    color: SB.sectionText,
                    margin: "12px 12px 6px",
                  }}
                >
                  {section.title}
                </p>
              )}
              {collapsed && (
                <div
                  style={{
                    height: 1,
                    background: SB.divider,
                    margin: "8px 8px",
                  }}
                />
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {section.items.map(({ label, href, icon: Icon }) => {
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
                          (e.currentTarget as HTMLAnchorElement).style.background =
                            SB.hoverBg;
                          (e.currentTarget as HTMLAnchorElement).style.color =
                            SB.textHover;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          (e.currentTarget as HTMLAnchorElement).style.background =
                            "transparent";
                          (e.currentTarget as HTMLAnchorElement).style.color =
                            SB.text;
                        }
                      }}
                    >
                      <Icon size={18} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                      {!collapsed && <span>{label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
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
          <Link href="/login">
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
                (e.currentTarget as HTMLButtonElement).style.background =
                  SB.hoverBg;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = SB.text;
                (e.currentTarget as HTMLButtonElement).style.background =
                  "transparent";
              }}
            >
              <LogOut size={18} strokeWidth={1.8} style={{ flexShrink: 0 }} />
              {!collapsed && <span>Logout</span>}
            </button>
          </Link>

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
              ME
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
                  Michael E.
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
                  Manager
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
            position: "relative",
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

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Branch selector — CHANGED: now backed by GET /auth/branches
                via useAuthStore instead of a hardcoded array. Names shown
                exactly as returned by the backend. */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setBranchOpen((v) => !v)}
                disabled={branchesLoading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--color-border)",
                  background: "#fff",
                  cursor: branchesLoading ? "default" : "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  color: "var(--color-text)",
                  fontFamily: "var(--font-sans)",
                  opacity: branchesLoading ? 0.7 : 1,
                }}
              >
                <Store size={15} strokeWidth={1.8} color="var(--color-primary)" />
                {branchContextValue.name}
                <ChevronDown size={15} strokeWidth={1.8} color="var(--color-text-muted)" />
              </button>

              {branchOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    right: 0,
                    width: 170,
                    background: "#fff",
                    border: "1px solid var(--color-border)",
                    borderRadius: 10,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                    overflow: "hidden",
                    zIndex: 60,
                  }}
                >
                  {(branches ?? []).map((b) => {
                    const selected = b.id === selectedBranch?.id;
                    return (
                      <button
                        key={b.id}
                        onClick={() => {
                          setSelectedBranchId(b.id);
                          setBranchOpen(false);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                          padding: "10px 14px",
                          background: selected ? "var(--color-bg-soft)" : "#fff",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "0.85rem",
                          fontFamily: "var(--font-sans)",
                          color: "var(--color-text)",
                          textAlign: "left",
                        }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLButtonElement).style.background =
                            "var(--color-bg-soft)")
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLButtonElement).style.background =
                            selected ? "var(--color-bg-soft)" : "#fff")
                        }
                      >
                        {b.name}
                        {selected && (
                          <Check size={14} strokeWidth={2} color="var(--color-primary)" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notifications — live, wired to GET /notifications */}
            <NotificationBell />
          </div>
        </header>

        {/* Dimming overlay while branch dropdown is open */}
        {branchOpen && (
          <div
            onClick={() => setBranchOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.06)",
              zIndex: 20,
            }}
          />
        )}

        {/* Page content */}
        <main
          style={{ flex: 1, overflowY: "auto", padding: "28px" }}
          className="no-scrollbar"
        >
          <BranchContext.Provider value={branchContextValue}>
            {children}
          </BranchContext.Provider>
        </main>
      </div>
    </div>
  );
}