// lib/branch.ts

// Mirrors the guard already living in useDashboardStore.ts (asBranchId).
// Pulled out here so new stores/pages don't duplicate the regex — worth
// updating useDashboardStore.ts to import from here too when you're next
// in that file, so there's a single source of truth.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Anything that isn't a real UUID — including the "ALL_BRANCHES" sentinel —
// comes back undefined, meaning "no branch filter." Backend 400s on a
// non-UUID branchId (confirmed live on /admin/inventory/alerts and
// /admin/audit-logs), and omitting the param entirely is how "aggregate
// across all branches" works everywhere else in the app.
export function asBranchId(branchId?: string | null): string | undefined {
  return branchId && UUID_RE.test(branchId) ? branchId : undefined;
}