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
  branchId?: string;
  dietaryTags?: string[];
}


export interface GetCategoriesFilters {
  branchId?: string;
}


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