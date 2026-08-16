// services/staff.service.ts
import { apiClient } from '@/lib/api-client';
import { StaffMember, CreateStaffPayload, UpdateStaffPayload, StaffFilters } from '@/types/staff';

export const staffService = {
  getStaff: (filters: StaffFilters = {}) =>
    apiClient.get<StaffMember[]>('/admin/staff', { params: filters }).then((r) => r.data),

  createStaff: (payload: CreateStaffPayload) =>
    apiClient.post<StaffMember>('/admin/staff', payload).then((r) => r.data),

  updateStaff: (id: string, payload: UpdateStaffPayload) =>
    apiClient.patch<StaffMember>(`/admin/staff/${id}`, payload).then((r) => r.data),

  // Confirmed via live testing: this deactivates (status ACTIVE -> OFFLINE)
  // rather than deleting the record.
  deleteStaff: (id: string) =>
    apiClient.delete(`/admin/staff/${id}`).then((r) => r.data),
};