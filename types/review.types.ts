// types/review.types.ts
// ─────────────────────────────────────────────────────────────
// BRANCH: F1 — Types & Services (Reviews)
// ─────────────────────────────────────────────────────────────

// Confirmed via Swagger: GET /admin/reviews's `status` query param lists
// these three values verbatim.
export type ReviewStatus = 'PUBLISHED' | 'HIDDEN' | 'FLAGGED';

// UNCONFIRMED — Swagger shows no example response body for either the
// list or update-status endpoints, only status codes. `id` and `status`
// are certain (they're used as path/body params elsewhere). Everything
// else below is a placeholder guess at what a review entity plausibly
// carries, based on standard review-list UIs. Do NOT build UI against the
// commented-out-feeling fields until confirmed — swap this for the real
// shape as soon as backend shares it or you hit the endpoint with "Try it
// out".
export interface Review {
  id: string;
  status: ReviewStatus;
  rating?: number; // UNCONFIRMED
  comment?: string; // UNCONFIRMED
  customerName?: string; // UNCONFIRMED
  menuItemName?: string; // UNCONFIRMED
  branchId?: string; // UNCONFIRMED — flagging since other admin screens filter by branch
  createdAt?: string; // UNCONFIRMED
}

export interface ReviewFilters {
  status?: ReviewStatus;
}