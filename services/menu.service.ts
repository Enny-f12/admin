// services/menu.service.ts
import { apiClient } from '@/lib/api-client';
import {
  MenuCategory,
  MenuItem,
  GetItemsFilters,
  CreateMenuItemPayload,
  UpdateMenuItemPayload,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '@/types/menu';

export const menuService = {
  // ── Public ──
  getCategories: () =>
    apiClient.get<MenuCategory[]>('/menu/categories').then((r) => r.data),

  getItems: (filters: GetItemsFilters = {}) =>
    apiClient
      .get<MenuItem[]>('/menu/items', {
        params: {
          categoryId: filters.categoryId,
          dietaryTags: filters.dietaryTags?.join(','),
        },
      })
      .then((r) => r.data),

  getItem: (id: string) =>
    apiClient.get<MenuItem>(`/menu/items/${id}`).then((r) => r.data),

  search: (q: string) =>
    apiClient.get<MenuItem[]>('/menu/search', { params: { q } }).then((r) => r.data),

  // ── Admin: Categories ──
  createCategory: (payload: CreateCategoryPayload) =>
    apiClient.post<MenuCategory>('/admin/menu/categories', payload).then((r) => r.data),

  updateCategory: (id: string, payload: UpdateCategoryPayload) =>
    apiClient.patch<MenuCategory>(`/admin/menu/categories/${id}`, payload).then((r) => r.data),

  
  deleteCategory: (id: string) =>
    apiClient.delete(`/admin/menu/categories/${id}`).then((r) => r.data),

  
  createItem: (payload: CreateMenuItemPayload) =>
    apiClient.post<MenuItem>('/admin/menu/items', payload).then((r) => r.data),

  updateItem: (id: string, payload: UpdateMenuItemPayload) =>
    apiClient.patch<MenuItem>(`/admin/menu/items/${id}`, payload).then((r) => r.data),

  deleteItem: (id: string) =>
    apiClient.delete(`/admin/menu/items/${id}`).then((r) => r.data),

  toggleAvailability: (id: string) =>
    apiClient.patch<MenuItem>(`/admin/menu/items/${id}/availability`).then((r) => r.data),

  
  uploadItemImages: (id: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return apiClient
      .post<MenuItem>(`/admin/menu/items/${id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  
  deleteItemImage: (itemId: string, imageId: string) =>
    apiClient.delete(`/admin/menu/items/${itemId}/images/${imageId}`).then((r) => r.data),
};