// store/useReviewStore.ts
// ─────────────────────────────────────────────────────────────
// BRANCH: F2 — Store (Reviews)
// ─────────────────────────────────────────────────────────────
import { create } from 'zustand';
import { toast } from 'sonner';
import { reviewService } from '@/services/review.service';
import { Review, ReviewStatus } from '@/types/review.types';

function extractErrorMessage(error: unknown, fallback: string) {
  const anyErr = error as any;
  return anyErr?.response?.data?.message ?? anyErr?.message ?? fallback;
}

interface ReviewState {
  reviews: Review[] | null;
  reviewsLoading: boolean;
  reviewsError: boolean;

  // Per-row id, not a shared boolean — moderation is a row-by-row action
  // (Publish/Hide/Flag on one review shouldn't disable every other row's
  // buttons while it's in flight).
  updatingStatusId: string | null;

  fetchReviews: (status?: ReviewStatus) => Promise<void>;
  updateReviewStatus: (id: string, status: ReviewStatus) => Promise<boolean>;
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  reviews: null,
  reviewsLoading: false,
  reviewsError: false,

  updatingStatusId: null,

  fetchReviews: async (status) => {
    set({ reviewsLoading: true, reviewsError: false });
    try {
      const reviews = await reviewService.getReviews(status);
      set({ reviews, reviewsLoading: false });
    } catch {
      set({ reviewsLoading: false, reviewsError: true });
    }
  },

  updateReviewStatus: async (id, status) => {
    const { reviews } = get();
    const previous = reviews;
    // Optimistic: flip the status locally right away so moderation feels
    // instant, then reconcile with whatever the server actually returns.
    set({
      updatingStatusId: id,
      reviews: reviews ? reviews.map((r) => (r.id === id ? { ...r, status } : r)) : reviews,
    });
    try {
      const updated = await reviewService.updateReviewStatus(id, status);
      set((state) => ({
        updatingStatusId: null,
        reviews: state.reviews ? state.reviews.map((r) => (r.id === id ? updated : r)) : state.reviews,
      }));
      toast.success('Review status updated.');
      return true;
    } catch (error) {
      // Roll back to the pre-optimistic state on failure.
      set({ reviews: previous, updatingStatusId: null });
      toast.error(extractErrorMessage(error, 'Could not update review status.'));
      return false;
    }
  },
}));