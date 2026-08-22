// services/review.service.ts
// ─────────────────────────────────────────────────────────────
// BRANCH: F1 — Types & Services (Reviews)
// ─────────────────────────────────────────────────────────────
import { apiClient } from '@/lib/api-client';
import { Review, ReviewStatus } from '@/types/review.types';

// Both endpoints confirmed live in Swagger under "Admin Reviews".
export const reviewService = {
  // GET /admin/reviews — `status` is an optional query param (dropdown
  // includes a blank "—" option in Swagger), so omit it to fetch everything.
  getReviews: (status?: ReviewStatus) =>
    apiClient
      .get<Review[]>('/admin/reviews', { params: status ? { status } : undefined })
      .then((r) => r.data),

  // PATCH /admin/reviews/{id}/status — body is just { status }, confirmed
  // by the Swagger example value.
  updateReviewStatus: (id: string, status: ReviewStatus) =>
    apiClient
      .patch<Review>(`/admin/reviews/${id}/status`, { status })
      .then((r) => r.data),
};