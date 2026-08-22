

export type Role =
  | "SUPER_ADMIN"
  | "MANAGER"
  | "ORDER_TAKER"
  | "INVENTORY_COUNTER"
  | "CUSTOMER_CARE"
  | "CASHIER"
  | "ACCOUNTANT"
  | "KITCHEN_STAFF";

export const ROLES: Role[] = [
  "SUPER_ADMIN",
  "MANAGER",
  "ORDER_TAKER",
  "INVENTORY_COUNTER",
  "CUSTOMER_CARE",
  "CASHIER",
  "ACCOUNTANT",
  "KITCHEN_STAFF",
];

// Every href that currently exists in NAV_SECTIONS. Kept as a typed const
// object (not raw strings) so a typo in ROLE_PERMISSIONS below is a
// compile error, not a silent bug.
export const ROUTES = {
  dashboard: "/dashboard",
  morningCount: "/inventory/morning-count",
  stockInventory: "/inventory/stock",
  drinksFridge: "/inventory/drinks-fridge",
  suppliers: "/inventory/suppliers",
  foodInventory: "/inventory/food",
  reconciliation: "/inventory/reconciliation",
  orders: "/orders",
  walkIn: "/orders/walk-in",
  kitchen: "/kitchen",
  payments: "/payments",
  reservations: "/reservations",
  delivery: "/delivery",
  menu: "/menu",
  customers: "/customers",
  staff: "/staff",
  promoCodes: "/promo-codes",
  reviews: "/reviews",
  accounting: "/accounting",
  analytics: "/analytics",
  auditLogs: "/audit-logs",
  settings: "/settings",
} as const;

export type RouteKey = keyof typeof ROUTES;
export type Route = (typeof ROUTES)[RouteKey];

const ALL_ROUTES = Object.values(ROUTES) as Route[];

const FINANCE_SYSTEM_ROUTES: Route[] = [
  ROUTES.accounting,
  ROUTES.analytics,
  ROUTES.auditLogs,
  ROUTES.settings,
];

// ─────────────────────────────────────────────────────────────
// ROLE_PERMISSIONS — explicit allow-list per role. A role not listed
// here, or a route not in its list, means NO access.
// ─────────────────────────────────────────────────────────────
export const ROLE_PERMISSIONS: Record<Role, Route[]> = {
  SUPER_ADMIN: ALL_ROUTES,

  // "all except staff, finance and system ui's section"
  
  MANAGER: ALL_ROUTES.filter(
    (r) => r !== ROUTES.staff && !FINANCE_SYSTEM_ROUTES.includes(r)
  ),

  // "only orders" — taken literally. Walk-in/Phone included since it's a
  // sub-page of Orders and matches the ERP table's "create manual orders
  // for walk-in/phone customers." Drop ROUTES.walkIn if Order Taker
  // should be locked to /orders alone.
  ORDER_TAKER: [ROUTES.orders, ROUTES.walkIn],

  // "food inventory and morning count"
  INVENTORY_COUNTER: [ROUTES.foodInventory, ROUTES.morningCount],

  // "food inventory, orders, reservations"
  CUSTOMER_CARE: [ROUTES.foodInventory, ROUTES.orders, ROUTES.reservations],

  // "orders, payment"
  CASHIER: [ROUTES.orders, ROUTES.payments],

  // "accounting" — the ERP table's Accountant also gets read-only
  // sales/COGS/wastage/profit-loss reports with CSV/Excel export, which
  // more plausibly lives under Analytics than Accounting alone. Not in
  // your shorthand though, so left out until confirmed.
  ACCOUNTANT: [ROUTES.accounting],

  // Not in the ERP table at all — new role from your shorthand list.
  KITCHEN_STAFF: [ ROUTES.kitchen],
};

export function hasAccess(role: Role, route: Route): boolean {
  return ROLE_PERMISSIONS[role]?.includes(route) ?? false;
}

// Filters a NAV_SECTIONS-shaped array down to what a role can see, and
// drops a whole section if it ends up with zero visible items.
export function filterNavSections<
  T extends { title: string; items: { href: string }[] }
>(sections: T[], role: Role): T[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => hasAccess(role, item.href as Route)),
    }))
    .filter((section) => section.items.length > 0);
}

// First accessible route for a role — used by RouteGuard (see
// components/auth/RouteGuard.tsx) to redirect somewhere valid instead of
// a hardcoded /dashboard every role may not actually have.
export function getDefaultRoute(role: Role): Route {
  return ROLE_PERMISSIONS[role]?.[0] ?? ROUTES.dashboard;
}

// True if `pathname` is inside an allowed route for this role. Matches by
// prefix, not exact string — /orders/12345 should count as allowed for
// any role that has /orders, without every dynamic order-detail path
// needing its own entry in ROUTES.
export function isPathAllowed(role: Role, pathname: string): boolean {
  const allowed = ROLE_PERMISSIONS[role];
  if (!allowed) return false;
  return allowed.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}