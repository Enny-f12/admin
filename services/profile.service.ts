// services/profile.service.ts
import { apiClient } from '@/lib/api-client';

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

// NOTE: adjust this path if your backend exposes password-change under a
// different route (e.g. /admin/staff/:id/password, /users/me/password).
export const profileService = {
  changePassword: (payload: ChangePasswordPayload) =>
    apiClient.post('/auth/change-password', payload).then((r) => r.data),
};