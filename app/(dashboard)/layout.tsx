// app/(admin)/layout.tsx — full file

"use client";

import { useEffect, useMemo, useState } from "react";
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
  Menu,
  X,
  BadgePercent,
  Star,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import PushSetup from "@/components/PushSetup";
import { useAuthStore } from "@/store/useAuthStore";
import RouteGuard from "@/components/auth/RouteGuard";
import { filterNavSections, Role } from "@/lib/permissions";

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
      { label: "Promo Codes", href: "/promo-codes", icon: BadgePercent },
      { label: "Reviews", href: "/reviews", icon: Star },
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
 * SelectedBranch is the minimal shape ({ id, name }) that most consumers
 * of useBranch() actually need. BranchContextValue extends it with the
 * extra fields a page needs if it wants to render its own branch picker
 * (e.g. Stock Inventory) instead of just displaying the current branch.
 */
export interface SelectedBranch {
  id: string;
  name: string;
}

export interface BranchContextValue extends SelectedBranch {
  /** True for SUPER_ADMIN (sees every branch), and also true for anyone
   *  whose preferences.assignedBranchIds has more than one entry (sees
   *  only their own assigned branches). See canPickBranch logic below.
   *  Any page that wants to render its own dropdown should gate on this
   *  instead of re-deriving role/branch-count itself. */
  canPickBranch: boolean;
  /** The branches this specific user is allowed to pick between — NOT
   *  necessarily every branch in the system. SUPER_ADMIN gets the full
   *  list; everyone else (even pickers) is scoped to their own
   *  preferences.assignedBranchIds. Empty for locked single-branch users. */
  branches: SelectedBranch[];
  /** Changes the active branch. No-ops meaningfully for locked users since
   *  their UI never exposes a way to call this, but it's always safe to call. */
  setBranch: (branch: SelectedBranch) => void;
}

const BranchContext = createContext<BranchContextValue>({
  id: "",
  name: "",
  canPickBranch: false,
  branches: [],
  setBranch: () => {},
});
export const useBranch = () => useContext(BranchContext);

// Note: an "All Branches" pseudo-selection previously existed here as a
// sentinel id. It has been removed — the branch picker now only ever
// offers the individual branches returned by GET /auth/branches, and a
// picker always has a real branch selected (defaulting to their last
// login branch, or the first branch returned, if none was set).
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

function Skeleton({
  width = "100%",
  height = 14,
  radius = 6,
  style = {},
}: {
  width?: string | number;
  height?: number;
  radius?: number;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className="skeleton-shimmer"
      style={{ display: "inline-block", width, height, borderRadius: radius, ...style }}
    />
  );
}

function getInitials(fullName?: string | null) {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "–";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// "SUPER_ADMIN" -> "Super Admin", "MANAGER" -> "Manager"
function formatRole(role?: string | null) {
  if (!role) return "";
  return role
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();
  const sidebarW = collapsed ? 72 : 240;

  const { branches, branchesLoading, fetchBranches, user, loginBranchId } = useAuthStore();
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  // Access rule (updated to use preferences.assignedBranchIds, confirmed
  // present on the real login response — e.g. a Manager with
  // assignedBranchId: "3ee8..." also had
  // preferences.assignedBranchIds: ["3ee8...", "adf6..."], meaning they're
  // actually scoped to TWO branches, not the one the singular field
  // suggested):
  //  - SUPER_ADMIN always gets full branch-picker access to every branch,
  //    regardless of what's in preferences.
  //  - Anyone else with 2+ ids in preferences.assignedBranchIds gets a
  //    picker too, but scoped ONLY to those branches — never the full list.
  //  - Anyone with exactly 1 assigned branch (via preferences, or via the
  //    singular assignedBranchId as a fallback for accounts where
  //    preferences isn't populated) is locked, same as before.
  //  - Zero assigned branches → "No branch assigned" state, unchanged.
  const assignedBranchIds = useMemo(() => {
    const prefs = user?.preferences?.assignedBranchIds;
    if (prefs && prefs.length > 0) return prefs;
    // Fallback for any account that predates preferences being populated,
    // or where it's missing for some other reason — don't silently lock
    // someone out just because this newer field isn't set yet.
    return user?.assignedBranchId ? [user.assignedBranchId] : [];
    // Dependency is the whole `user` object, not the two narrower property
    // paths — React Compiler infers `user` as the dependency for this body
    // regardless of how granular the array is written, so matching that
    // exactly avoids the "could not preserve manual memoization" bailout.
  }, [user]);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const canPickBranch = isSuperAdmin || assignedBranchIds.length > 1;

  // The branches this user is actually allowed to choose between.
  // SUPER_ADMIN sees everything GET /auth/branches returns; everyone else
  // — including multi-branch pickers — only sees their own assigned set.
  // This is deliberately NOT the same as canPickBranch: a locked
  // single-branch user still needs their one branch resolvable here so
  // the header chip can show its real name instead of a fallback string.
  const pickableBranches = useMemo(() => {
    if (isSuperAdmin) return branches ?? [];
    return (branches ?? []).filter((b) => assignedBranchIds.includes(b.id));
  }, [isSuperAdmin, branches, assignedBranchIds]);

  // Sidebar nav filtered to what this role can actually open. Deliberately
  // renders as an empty section list (not the full NAV_SECTIONS) until
  // `user` has loaded, rather than briefly showing every link and then
  // shrinking the list once the role is known — showing a link that
  // immediately redirects the moment it's clicked is worse than a nav
  // that populates a beat after the rest of the shell.
  const visibleSections = user?.role
    ? filterNavSections(NAV_SECTIONS, user.role as Role)
    : [];

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  // Initial selection. Locked users (exactly one assigned branch) get it
  // straight away. Pickers — SUPER_ADMIN or a multi-branch user — default
  // to whatever branch they chose on the login screen (loginBranchId), but
  // ONLY if that branch is actually one they're allowed to see; a
  // multi-branch Manager's loginBranchId should never let them land on a
  // branch outside their own preferences.assignedBranchIds. Otherwise,
  // falls back to the first branch in their pickable set once it's loaded.
  useEffect(() => {
    if (selectedBranchId !== null) return;
    if (!canPickBranch) {
      if (assignedBranchIds[0]) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedBranchId(assignedBranchIds[0]);
      }
      return;
    }
    const loginBranchIsAllowed =
      loginBranchId && (isSuperAdmin || assignedBranchIds.includes(loginBranchId));
    if (loginBranchIsAllowed) {
       
      setSelectedBranchId(loginBranchId);
      return;
    }
    if (pickableBranches.length > 0) {
       
      setSelectedBranchId(pickableBranches[0].id);
    }
  }, [canPickBranch, assignedBranchIds, isSuperAdmin, loginBranchId, selectedBranchId, pickableBranches]);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileNavOpen(false);
  }, [pathname]);

  const effectiveBranchId = canPickBranch ? selectedBranchId : assignedBranchIds[0] ?? null;

  const selectedBranch = branches?.find((b) => b.id === effectiveBranchId) ?? null;

  const branchContextValue: BranchContextValue = {
    ...(selectedBranch
      ? { id: selectedBranch.id, name: selectedBranch.name }
      : {
          id: effectiveBranchId ?? "",
          name: branchesLoading
            ? ""
            : canPickBranch
              ? "Select branch"
              : assignedBranchIds.length > 0
                ? "Your Branch"
                : "No branch assigned",
        }),
    canPickBranch,
    branches: pickableBranches,
    setBranch: (b) => setSelectedBranchId(b.id),
  };

  // Title lookup intentionally still uses the full NAV_SECTIONS, not
  // visibleSections — if a role-restricted page briefly renders before
  // RouteGuard's redirect fires, the header should still show a real
  // title rather than falling back to "Dashboard" for a page that isn't
  // actually the dashboard.
  const pageTitle =
    NAV_SECTIONS.flatMap((s) => s.items).find((n) => n.href === pathname)
      ?.label ?? "Dashboard";

  return (
    <div className="app-shell">
      <PushSetup />
      <style jsx global>{`
        .skeleton-shimmer {
          background: linear-gradient(
            90deg,
            var(--color-bg-soft) 25%,
            rgba(0, 0, 0, 0.06) 37%,
            var(--color-bg-soft) 63%
          );
          background-size: 400% 100%;
          animation: skeleton-shimmer 1.4s ease infinite;
        }
        @keyframes skeleton-shimmer {
          0% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0 50%;
          }
        }
        .app-shell {
          display: flex;
          height: 100vh;
          overflow: hidden;
          font-family: var(--font-sans);
          background: var(--color-bg);
        }
        .sidebar {
          height: 100vh;
          background: #fff;
          border-right: 1px solid ${SB.border};
          display: flex;
          flex-direction: column;
          transition: width 0.22s ease, min-width 0.22s ease, transform 0.22s ease;
          overflow: hidden;
          z-index: 50;
          flex-shrink: 0;
        }
        .main-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-width: 0;
        }
        .hamburger-btn {
          display: none;
        }
        .mobile-nav-overlay {
          display: none;
        }
        @media (max-width: 860px) {
          .sidebar {
            position: fixed;
            inset: 0 auto 0 0;
            width: 260px !important;
            min-width: 260px !important;
            transform: translateX(-100%);
          }
          .sidebar.mobile-open {
            transform: translateX(0);
          }
          .desktop-collapse-btn {
            display: none !important;
          }
          .hamburger-btn {
            display: flex !important;
          }
          .mobile-nav-overlay.open {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.35);
            z-index: 45;
          }
          .navbar-title {
            display: none;
          }
          .branch-selector-btn span.branch-label {
            max-width: 90px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .navbar-inner {
            padding: 0 14px !important;
          }
          .page-content {
            padding: 16px !important;
          }
        }
        @media (max-width: 420px) {
          .branch-selector-btn span.branch-label {
            max-width: 60px;
          }
        }
      `}</style>

      {/* ── Sidebar ── */}
      <aside
        className={`sidebar${mobileNavOpen ? " mobile-open" : ""}`}
        style={{ width: sidebarW, minWidth: sidebarW }}
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
            className="desktop-collapse-btn"
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
          {/* Close button for the mobile drawer */}
          <button
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close menu"
            style={{
              display: mobileNavOpen ? "flex" : "none",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: SB.text,
              padding: 4,
              borderRadius: 6,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav items — filtered by role, see visibleSections above */}
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
          {visibleSections.map((section) => (
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

          {/* User row — pulled from useAuthStore().user (fullName, role).
              Shows a skeleton until the store has hydrated a user.
              Links to /profile, same as the navbar avatar below. */}
          <Link
            href="/profile"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: collapsed ? "8px 0" : "8px 12px",
              justifyContent: collapsed ? "center" : "flex-start",
              marginTop: 4,
              textDecoration: "none",
              borderRadius: 8,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.background = SB.hoverBg)
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.background = "transparent")
            }
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
              {user ? getInitials(user.fullName) : <Skeleton width={18} height={10} radius={4} />}
            </div>
            {!collapsed && (
              <div style={{ overflow: "hidden" }}>
                {user ? (
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
                    {user.fullName}
                  </p>
                ) : (
                  <Skeleton width={90} height={12} style={{ marginBottom: 4 }} />
                )}
                {user ? (
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
                    {formatRole(user.role)}
                  </p>
                ) : (
                  <Skeleton width={60} height={10} />
                )}
              </div>
            )}
          </Link>
        </div>
      </aside>

      {/* Backdrop for mobile drawer */}
      <div
        className={`mobile-nav-overlay${mobileNavOpen ? " open" : ""}`}
        onClick={() => setMobileNavOpen(false)}
      />

      {/* ── Main area ── */}
      <div className="main-area">
        {/* Navbar */}
        <header
          className="navbar-inner"
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
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <button
              className="hamburger-btn"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--color-text)",
                padding: 4,
                borderRadius: 6,
                flexShrink: 0,
              }}
            >
              <Menu size={20} strokeWidth={1.8} />
            </button>

            <h1
              className="navbar-title"
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "var(--color-heading)",
                margin: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {pageTitle}
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
            {/* Branch selector — a picker (canPickBranch) sees the full
                list of individual branches returned by the backend.
                Everyone else is pinned to their own assignedBranchId and
                sees a static, non-interactive chip — no dropdown,
                nothing to switch. */}
            <div style={{ position: "relative" }}>
              {canPickBranch ? (
                <button
                  className="branch-selector-btn"
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
                  <Store size={15} strokeWidth={1.8} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                  {branchesLoading ? (
                    <Skeleton width={64} height={12} />
                  ) : (
                    <span className="branch-label">{branchContextValue.name}</span>
                  )}
                  <ChevronDown size={15} strokeWidth={1.8} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
                </button>
              ) : (
                <div
                  className="branch-selector-btn"
                  title="Your account is scoped to this branch"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-bg-soft)",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    color: "var(--color-text)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  <Store size={15} strokeWidth={1.8} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                  {branchesLoading ? (
                    <Skeleton width={64} height={12} />
                  ) : (
                    <span className="branch-label">{branchContextValue.name}</span>
                  )}
                </div>
              )}

              {canPickBranch && branchOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    right: 0,
                    width: 180,
                    background: "#fff",
                    border: "1px solid var(--color-border)",
                    borderRadius: 10,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                    overflow: "hidden",
                    zIndex: 60,
                  }}
                >
                  {pickableBranches.map((b) => {
                    const selected = b.id === effectiveBranchId;
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

            {/* Profile avatar — initials from useAuthStore().user, links
                to /profile. Full details there are pulled from the staff
                endpoint since useAuthStore().user only carries
                fullName/role. */}
            <Link
              href="/profile"
              title="Profile"
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "var(--color-primary)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.72rem",
                fontWeight: 700,
                textDecoration: "none",
                flexShrink: 0,
              }}
            >
              {user ? getInitials(user.fullName) : <Skeleton width={16} height={10} radius={4} />}
            </Link>
          </div>
        </header>

        {/* Dimming overlay while branch dropdown is open */}
        {canPickBranch && branchOpen && (
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

        {/* Page content — gated by RouteGuard so a page a role can't
            access never actually renders, even briefly, before the
            redirect fires. */}
        <main
          className="page-content no-scrollbar"
          style={{ flex: 1, overflowY: "auto", padding: "28px" }}
        >
          <BranchContext.Provider value={branchContextValue}>
            <RouteGuard>{children}</RouteGuard>
          </BranchContext.Provider>
        </main>
      </div>
    </div>
  );
}