// types/review.types.ts

export type ReviewStatus = 'PUBLISHED' | 'HIDDEN' | 'FLAGGED';


export interface Review {
  id: string;
  status: ReviewStatus;
  rating?: number; 
  comment?: string; 
  customerName?: string; 
  menuItemName?: string; 
  branchId?: string; 
  createdAt?: string; 
}

export interface ReviewFilters {
  status?: ReviewStatus;
  branchId?: string; 
}