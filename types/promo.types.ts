export type PromoDiscountType = 'PERCENTAGE' | 'FIXED';

export interface PromoCode {
  id: string;
  code: string;
  branchId: string;
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
  currentUses?: number; 
  createdAt?: string;
  updatedAt?: string; 
}

// POST /admin/promo-codes 
export interface CreatePromoCodePayload {
  code: string;
  branchId: string;
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


export type UpdatePromoCodePayload = Partial<Omit<CreatePromoCodePayload, 'code'>>;

export interface PromoCodeFilters {
  search?: string;
  isActive?: boolean;
  branchId?: string; 
}