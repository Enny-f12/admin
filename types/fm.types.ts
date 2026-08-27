// types/fm.ts
// Full-menu types — same shapes as types/menu.ts but with branchId removed
// entirely (no per-branch filtering anywhere in this variant).

export interface MenuCategory {
  id: string;
  vendorId: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  children?: MenuCategory[];
}

export interface MenuItemImage {
  id: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface MenuItem {
  id: string;
  vendorId: string;
  categoryId: string;
  category?: MenuCategory;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number;
  currency: string;
  dietaryTags: string[];
  searchKeywords: string[];
  isAvailable: boolean;
  isPopular: boolean;
  stockThreshold: number | null;
  prepTimeMinutes: number | null;
  images: MenuItemImage[];
  deletedAt: string | null;
}

export interface GetItemsFilters {
  categoryId?: string;
  dietaryTags?: string[];
}

// No branch-based filtering for categories in this variant — categories
// are fetched vendor-wide, so there's nothing left to put in this filter.
// Kept as an (empty) type rather than deleted so call sites that pass
// `{}` don't need to change if filters are added back later.
export type GetCategoriesFilters = Record<string, never>;

export interface CreateMenuItemPayload {
  vendorId: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  basePrice: number;
  currency?: string;
  dietaryTags?: string[];
  searchKeywords?: string[];
  isAvailable?: boolean;
  isPopular?: boolean;
  stockThreshold?: number;
  prepTimeMinutes?: number;
}

export interface UpdateMenuItemPayload {
  categoryId?: string;
  name?: string;
  slug?: string;
  description?: string;
  basePrice?: number;
  currency?: string;
  dietaryTags?: string[];
  searchKeywords?: string[];
  isAvailable?: boolean;
  isPopular?: boolean;
  stockThreshold?: number;
  prepTimeMinutes?: number;
}

export interface CreateCategoryPayload {
  vendorId: string;
  parentId?: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryPayload {
  parentId?: string;
  name?: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
}