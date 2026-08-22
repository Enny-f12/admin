// services/promo-code.service.ts
// ─────────────────────────────────────────────────────────────
// BRANCH: F1 — Types & Services (Promo Codes)
// ─────────────────────────────────────────────────────────────
import { apiClient } from '@/lib/api-client';
import {
  PromoCode,
  CreatePromoCodePayload,
  UpdatePromoCodePayload,
} from '@/types/promo.types';

// All four endpoints below are confirmed live in Swagger under
// "Admin Promo Codes" (GET/POST/PATCH/DELETE all returned 2xx codes in the
// screenshots — no "not yet built" caveat needed like audit logs).
export const promoCodeService = {
  // GET /admin/promo-codes — no query params shown in Swagger, so this
  // assumes it returns the full list unpaginated (unlike audit logs' {
  // items, total }). If the list grows large enough to need pagination,
  // that'll be a backend addition, not a frontend guess.
  getPromoCodes: () =>
    apiClient.get<PromoCode[]>('/admin/promo-codes').then((r) => r.data),

  // POST /admin/promo-codes
  createPromoCode: (payload: CreatePromoCodePayload) =>
    apiClient.post<PromoCode>('/admin/promo-codes', payload).then((r) => r.data),

  // PATCH /admin/promo-codes/{id} — body omits `code` in the Swagger
  // example, so `UpdatePromoCodePayload` excludes it too (see types file).
  updatePromoCode: (id: string, payload: UpdatePromoCodePayload) =>
    apiClient.patch<PromoCode>(`/admin/promo-codes/${id}`, payload).then((r) => r.data),

  // DELETE /admin/promo-codes/{id}
  deletePromoCode: (id: string) =>
    apiClient.delete<void>(`/admin/promo-codes/${id}`).then((r) => r.data),
};