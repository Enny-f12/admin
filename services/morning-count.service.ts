// services/morning-count.service.ts
import { apiClient } from '@/lib/api-client';
import {
  MorningCountSheet,
  MorningCountItem,
  MorningCountCategory,
  UpdateItemCurrentPayload,
  UpdateItemUomPayload,
  PendingCategorySummary,
} from '@/types/morning-count.types';

export const morningCountService = {
  // NOT YET BUILT — backend request doc #1
  getSheet: (outletId: string, date: string) =>
    apiClient
      .get<MorningCountSheet>('/morning-count', { params: { outletId, date } })
      .then((r) => r.data),

  // NOT YET BUILT — backend request doc #4
  saveDraft: (sheetId: string) =>
    apiClient
      .post<{ draftSavedAt: string }>(`/morning-count/${sheetId}/save-draft`)
      .then((r) => r.data),

  // NOT YET BUILT — backend request doc #2
  updateItemCurrent: (sheetId: string, itemId: string, payload: UpdateItemCurrentPayload) =>
    apiClient
      .patch<MorningCountItem>(`/morning-count/${sheetId}/items/${itemId}`, payload)
      .then((r) => r.data),

  // NOT YET BUILT — backend request doc #3
  updateItemUom: (sheetId: string, itemId: string, payload: UpdateItemUomPayload) =>
    apiClient
      .patch<MorningCountItem>(`/morning-count/${sheetId}/items/${itemId}/uom`, payload)
      .then((r) => r.data),

  // NOT YET BUILT — backend request doc #5
  submitCategory: (sheetId: string, categoryId: string) =>
    apiClient
      .post<MorningCountCategory>(`/morning-count/${sheetId}/categories/${categoryId}/submit`)
      .then((r) => r.data),

  // NOT YET BUILT — backend request doc #6
  getPendingCategories: (outletId: string, date: string) =>
    apiClient
      .get<{ categories: PendingCategorySummary[] }>('/morning-count/pending', {
        params: { outletId, date },
      })
      .then((r) => r.data),
};