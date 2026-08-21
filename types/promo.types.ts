// types/promo-code.types.ts
// ─────────────────────────────────────────────────────────────
// BRANCH: F1 — Types & Services (Promo Codes)
// ─────────────────────────────────────────────────────────────

// Only "PERCENTAGE" appears in the Swagger example value. "FIXED" is a
// reasonable guess for the other common discount shape but is UNCONFIRMED
// — check the backend enum before shipping a discount-type selector.
export type PromoDiscountType = 'PERCENTAGE' | 'FIXED';

// Shape of a single promo code as returned by the API. Confirmed fields
// are the ones present in the create/update request bodies (Swagger shows
// no example *response* body, so this assumes the entity echoes back what
// you send it, plus an id). Fields marked UNCONFIRMED aren't in Swagger at
// all — they're a best guess based on how similar list screens elsewhere in
// this app work (e.g. usage-count columns). Drop them if the real response
// doesn't have them, or confirm with backend before relying on them in UI.
export interface PromoCode {
  id: string;
  code: string;
  description: string;
  discountType: PromoDiscountType;
  discountValue: number;
  minOrderValue: number;
  maxDiscount: number;
  maxUses: number;
  perUserLimit: number;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  isActive: boolean;
  currentUses?: number; // UNCONFIRMED — not in Swagger, guessed for a "12/100 used" style column
  createdAt?: string; // UNCONFIRMED
  updatedAt?: string; // UNCONFIRMED
}

// Matches the POST /admin/promo-codes example body exactly.
export interface CreatePromoCodePayload {
  code: string;
  description: string;
  discountType: PromoDiscountType;
  discountValue: number;
  minOrderValue: number;
  maxDiscount: number;
  maxUses: number;
  perUserLimit: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

// Matches the PATCH /admin/promo-codes/{id} example body — notably it does
// NOT include `code`, so this assumes the code string can't be changed
// after creation. If that's wrong, add `code` back in here.
export type UpdatePromoCodePayload = Partial<Omit<CreatePromoCodePayload, 'code'>>;

// Generic filter shape so the list UI (F3) isn't locked to promo codes
// specifically if you want to reuse this pattern for other simple
// CRUD-list-with-status screens later.
export interface PromoCodeFilters {
  search?: string; // client-side only unless backend adds a `search` query param
  isActive?: boolean;
}