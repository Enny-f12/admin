// services/staff.service.ts
import { apiClient } from '@/lib/api-client';
import { StaffMember, CreateStaffPayload, UpdateStaffPayload } from '@/types/staff';

export const staffService = {
  getStaff: () =>
    apiClient.get<StaffMember[]>('/admin/staff').then((r) => r.data),

  createStaff: (payload: CreateStaffPayload) =>
    apiClient.post<StaffMember>('/admin/staff', payload).then((r) => r.data),

  updateStaff: (id: string, payload: UpdateStaffPayload) =>
    apiClient.patch<StaffMember>(`/admin/staff/${id}`, payload).then((r) => r.data),

  deleteStaff: (id: string) =>
    apiClient.delete(`/admin/staff/${id}`).then((r) => r.data),
};