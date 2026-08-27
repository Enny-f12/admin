export type Role =
  | "SUPER_ADMIN"
  | "MANAGER"
  | "ORDER_TAKER"
  | "INVENTORY_COUNTER_STAFF"
  | "CUSTOMER_CARE"
  | "CASHIER"
  | "ACCOUNTANT"
  | "KITCHEN_STAFF"
  | "DELIVERY_COORDINATOR";

// Order matches GET /admin/staff/role-defaults `roles`, purely so a diff
// against that response is easy to eyeball.
export const ROLES: Role[] = [
  "SUPER_ADMIN",
  "MANAGER",
  "KITCHEN_STAFF",
  "CASHIER",
  "ORDER_TAKER",
  "DELIVERY_COORDINATOR",
  "INVENTORY_COUNTER_STAFF",
  "ACCOUNTANT",
  "CUSTOMER_CARE",
];

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

// A permission key that deliberately matches nothing real. Used for
// routes below that have no corresponding key in
// GET /admin/staff/permissions yet — see ROUTE_PERMISSIONS comment.
const UNMAPPED = "__no_backend_permission_key__";

// ─────────────────────────────────────────────────────────────
// ROUTE_PERMISSIONS — which granular permission key(s) unlock each
// route. A staff member needs AT LEAST ONE of the listed keys (in either
// their `permissions` or `invPermissions` grant) to see/reach that route.
//
// Dashboard is a special case, NOT gated by permission keys — see
// ROLE_RESTRICTED_ROUTES below, which overrides this entirely for it.
// Left as [] here only as the "no restriction" fallback shape; the real
// rule lives in ROLE_RESTRICTED_ROUTES.
//
// Two routes — Reviews and Audit Logs — have NO matching permission key
// in the backend's response at all, so they're pinned to UNMAPPED, which
// nothing will ever satisfy except the SUPER_ADMIN bypass below.
// Flagging for backend: either add reviews:view / audit:view keys, or
// tell us which existing key should gate these.
// ─────────────────────────────────────────────────────────────
export const ROUTE_PERMISSIONS: Record<Route, string[]> = {
  [ROUTES.dashboard]: [],
  [ROUTES.morningCount]: ["inventory:stock_count", "inventory:add_stock"],
  [ROUTES.stockInventory]: ["inventory:view"],
  [ROUTES.drinksFridge]: ["inventory:manage_drinks"],
  [ROUTES.suppliers]: ["inventory:manage_suppliers"],
  [ROUTES.foodInventory]: ["inventory:manage_food"],
  [ROUTES.reconciliation]: ["inventory:adjust", "inventory:view_movements"],
  [ROUTES.orders]: ["orders:view"],
  [ROUTES.walkIn]: ["walkin:create_order"],
  [ROUTES.kitchen]: ["kitchen:view_orders"],
  [ROUTES.payments]: ["payments:view"],
  [ROUTES.reservations]: ["reservations:view"],
  [ROUTES.delivery]: ["drivers:view", "drivers:assign"],
  [ROUTES.menu]: ["menu:view"],
  [ROUTES.customers]: ["customers:view"],
  [ROUTES.staff]: ["staff:view"],
  [ROUTES.promoCodes]: ["promos:view"],
  [ROUTES.reviews]: [UNMAPPED], // TODO(BACKEND): no reviews:* key exists
  [ROUTES.accounting]: ["accounting:view"],
  [ROUTES.analytics]: ["analytics:view"],
  [ROUTES.auditLogs]: [UNMAPPED], // TODO(BACKEND): no audit:* key exists
  [ROUTES.settings]: ["settings:view"],
};

// ─────────────────────────────────────────────────────────────
// ROLE_RESTRICTED_ROUTES — routes gated by ROLE membership instead of
// granular permission grants. Checked BEFORE ROUTE_PERMISSIONS in
// hasAccess() below; if a route appears here, its ROUTE_PERMISSIONS
// entry is ignored entirely for that route.
//
// Currently just the dashboard, restricted to Manager + Super Admin per
// product decision — there's no dashboard:view key in
// GET /admin/staff/permissions to hang this on, and "only these two
// roles" isn't really a grantable permission anyway, so a role allowlist
// is the right tool here rather than stretching the permission model to
// fit it.
// ─────────────────────────────────────────────────────────────
const ROLE_RESTRICTED_ROUTES: Partial<Record<Route, string[]>> = {
  [ROUTES.dashboard]: ["SUPER_ADMIN", "MANAGER"],
};

const ALL_ROUTES = Object.values(ROUTES) as Route[];

/**
 * The shape route-gating actually needs from a staff member: their two
 * granted-permission arrays plus their role (role drives the
 * SUPER_ADMIN full-access bypass and any ROLE_RESTRICTED_ROUTES checks;
 * everything else is gated purely on live permission grants, which is
 * what makes this dynamic — editing someone's checkboxes in the staff
 * modal changes their nav immediately, no redeploy needed).
 */
export interface AccessSubject {
  role: string;
  permissions: string[];
  invPermissions: string[];
}

export function hasAccess(subject: AccessSubject, route: Route): boolean {
  if (subject.role === "SUPER_ADMIN") return true;

  const roleAllowlist = ROLE_RESTRICTED_ROUTES[route];
  if (roleAllowlist) return roleAllowlist.includes(subject.role);

  const required = ROUTE_PERMISSIONS[route];
  if (!required || required.length === 0) return true;
  // Defensive fallback: if permissions/invPermissions ever come back
  // undefined (e.g. an endpoint that doesn't populate them the way
  // login does), treat it as "no extra grants" rather than throwing on
  // the spread below.
  const granted = new Set([...(subject.permissions ?? []), ...(subject.invPermissions ?? [])]);
  return required.some((key) => granted.has(key));
}

// Filters a NAV_SECTIONS-shaped array down to what this staff member can
// actually see, and drops a whole section if it ends up with zero
// visible items.
export function filterNavSections<T extends { title: string; items: { href: string }[] }>(
  sections: T[],
  subject: AccessSubject
): T[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => hasAccess(subject, item.href as Route)),
    }))
    .filter((section) => section.items.length > 0);
}

// First accessible route for this staff member — used by RouteGuard to
// redirect somewhere valid instead of a hardcoded /dashboard they may
// not actually have. For most non-Manager/Super-Admin roles this
// deliberately skips dashboard (see ROLE_RESTRICTED_ROUTES) and lands on
// their first permitted operational route instead.
export function getDefaultRoute(subject: AccessSubject): Route {
  return ALL_ROUTES.find((r) => hasAccess(subject, r)) ?? ROUTES.dashboard;
}

// True if `pathname` is inside a route this staff member can access.
// Matches by prefix — /orders/12345 counts as allowed for anyone with
// access to /orders. No always-allowed-paths bypass anymore: /profile
// was the only one and that page no longer exists (change password now
// lives in a header modal, not a routed page).
export function isPathAllowed(subject: AccessSubject, pathname: string): boolean {
  return ALL_ROUTES.some(
    (route) =>
      hasAccess(subject, route) &&
      (pathname === route || pathname.startsWith(`${route}/`))
  );
}