export type ReviewStatus = 'PUBLISHED' | 'HIDDEN' | 'FLAGGED';

export interface Review {
  id: string;
  branchId: string | null;
  branch: { id: string; name: string } | null;
  userId: string;
  menuItemId: string;
  orderId: string;
  orderItemId: string;
  rating: number;
  title: string | null;
  comment: string | null;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
  user: { fullName: string; email: string } | null;
  menuItem: { name: string } | null;
  order: { orderNumber: string } | null;
}

export interface ReviewFilters {
  status?: ReviewStatus;
  branchId?: string;
}