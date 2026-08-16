// types/menu.ts

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

// NOTE: no branchId anywhere in this file — confirmed via Swagger that
// Menu Admin (categories + items) is scoped by vendorId, not branch.
// A dish's isAvailable is vendor-wide, not per-branch, as of this schema.

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