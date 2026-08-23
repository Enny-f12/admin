// services/review.service.ts
// ─────────────────────────────────────────────────────────────
// BRANCH: F1 — Types & Services (Reviews)
// ─────────────────────────────────────────────────────────────
import { apiClient } from '@/lib/api-client';
import { Review, ReviewStatus } from '@/types/review.types';

// Both endpoints confirmed live in Swagger under "Admin Reviews".
export const reviewService = {
  // GET /admin/reviews — `status` and `branchId` are both optional query
  // params (Swagger shows blank/empty defaults for each), so either or
  // both can be omitted to widen the result set.
  getReviews: (status?: ReviewStatus, branchId?: string) =>
    apiClient
      .get<Review[]>('/admin/reviews', {
        params: {
          ...(status ? { status } : {}),
          ...(branchId ? { branchId } : {}),
        },
      })
      .then((r) => r.data),

  // PATCH /admin/reviews/{id}/status — body is just { status }, confirmed
  // by the Swagger example value.
  updateReviewStatus: (id: string, status: ReviewStatus) =>
    apiClient
      .patch<Review>(`/admin/reviews/${id}/status`, { status })
      .then((r) => r.data),
};