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

export const promoCodeService = {
  // GET /admin/promo-codes — branchId is a required query param.
  getPromoCodes: (branchId: string) =>
    apiClient
      .get<PromoCode[]>('/admin/promo-codes', {
        params: { branchId },
      })
      .then((r) => r.data),

  // POST /admin/promo-codes — branchId required in body (see payload type)
  createPromoCode: (payload: CreatePromoCodePayload) =>
    apiClient.post<PromoCode>('/admin/promo-codes', payload).then((r) => r.data),

  // PATCH /admin/promo-codes/{id} — body omits `code` but requires
  // branchId, matching the Swagger example.
  updatePromoCode: (id: string, payload: UpdatePromoCodePayload) =>
    apiClient.patch<PromoCode>(`/admin/promo-codes/${id}`, payload).then((r) => r.data),

  // DELETE /admin/promo-codes/{id}
  deletePromoCode: (id: string) =>
    apiClient.delete<void>(`/admin/promo-codes/${id}`).then((r) => r.data),
};