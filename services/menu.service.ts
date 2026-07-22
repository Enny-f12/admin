// services/menu.service.ts
import { apiClient } from '@/lib/api-client';
import {
  MenuCategory,
  MenuItem,
  GetItemsFilters,
  CreateMenuItemPayload,
  UpdateMenuItemPayload,
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

  // ── Admin ──
  createItem: (payload: CreateMenuItemPayload, files: File[]) => {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined) return;
      if (Array.isArray(value)) {
        value.forEach((v) => formData.append(key, v));
      } else {
        formData.append(key, String(value));
      }
    });
    files.forEach((file) => formData.append('files', file));

    return apiClient
      .post<MenuItem>('/admin/menu/items', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  updateItem: (id: string, payload: UpdateMenuItemPayload) =>
    apiClient.patch<MenuItem>(`/admin/menu/items/${id}`, payload).then((r) => r.data),

  deleteItem: (id: string) =>
    apiClient.delete(`/admin/menu/items/${id}`).then((r) => r.data),

  toggleAvailability: (id: string) =>
    apiClient.patch<MenuItem>(`/admin/menu/items/${id}/availability`).then((r) => r.data),

  
  updateItemImage: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('files', file);
    return apiClient
      .post<MenuItem>(`/admin/menu/items/${id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
};