// types/promo-code.types.ts

export type PromoDiscountType = 'PERCENTAGE' | 'FIXED';


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


export type UpdatePromoCodePayload = Partial<Omit<CreatePromoCodePayload, 'code'>>;


export interface PromoCodeFilters {
  search?: string; 
  isActive?: boolean;
}