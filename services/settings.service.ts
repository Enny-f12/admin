// services/settings.service.ts
import { apiClient } from '@/lib/api-client';
import {
  Banner,
  BannerFormData,
  NotificationSettings,
  UpdateNotificationSettingsPayload,
  Branch,
  CreateBranchPayload,
  UpdateBranchPayload,
} from '@/types/settings.types';

function bannerFormToFormData(form: Partial<BannerFormData>) {
  const fd = new FormData();
  if (form.title !== undefined) fd.append('title', form.title);
  if (form.subtitle !== undefined) fd.append('subtitle', form.subtitle);
  if (form.ctaText !== undefined) fd.append('ctaText', form.ctaText);
  if (form.ctaLink !== undefined) fd.append('ctaLink', form.ctaLink);
  if (form.startDate !== undefined) fd.append('startDate', form.startDate);
  if (form.endDate !== undefined) fd.append('endDate', form.endDate);
  if (form.active !== undefined) fd.append('active', String(form.active));
  if (form.imageFile) fd.append('image', form.imageFile);
  return fd;
}

export const settingsService = {
  // ── Banners — NOT YET BUILT — backend request doc #1-4 ────────────
  getBanners: () => apiClient.get<Banner[]>('/admin/banners').then((r) => r.data),

  createBanner: (form: BannerFormData) =>
    apiClient
      .post<Banner>('/admin/banners', bannerFormToFormData(form), {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),

  updateBanner: (id: string, form: Partial<BannerFormData>) =>
    apiClient
      .patch<Banner>(`/admin/banners/${id}`, bannerFormToFormData(form), {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),

  deleteBanner: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/admin/banners/${id}`).then((r) => r.data),

  // ── Notifications — NOT YET BUILT — backend request doc #5-6 ──────
  getNotificationSettings: () =>
    apiClient.get<NotificationSettings>('/admin/settings/notifications').then((r) => r.data),

  updateNotificationSettings: (payload: UpdateNotificationSettingsPayload) =>
    apiClient.put<NotificationSettings>('/admin/settings/notifications', payload).then((r) => r.data),

  // ── Branches — GET already live, POST/PATCH requested — doc #7 ────
  getBranches: () => apiClient.get<Branch[]>('/admin/branches').then((r) => r.data),

  createBranch: (payload: CreateBranchPayload) =>
    apiClient.post<Branch>('/admin/branches', payload).then((r) => r.data),

  updateBranch: (id: string, payload: UpdateBranchPayload) =>
    apiClient.patch<Branch>(`/admin/branches/${id}`, payload).then((r) => r.data),
};