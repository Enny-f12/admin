// store/useStaffStore.ts
import { create } from 'zustand';
import { toast } from 'sonner';
import { staffService } from '@/services/staff.service';
import { StaffMember, CreateStaffPayload, UpdateStaffPayload, StaffFilters } from '@/types/staff';

function extractErrorMessage(error: unknown, fallback: string) {
  const anyErr = error as any;
  return anyErr?.response?.data?.message ?? anyErr?.message ?? fallback;
}

interface StaffState {
  staff: StaffMember[] | null;
  isLoading: boolean;
  isError: boolean;

  isSaving: boolean;
  isDeleting: boolean;

  // keeps the list in sync with whatever filter was last applied, so
  // create/update/deactivate know how to refetch correctly
  lastFilters: StaffFilters;

  fetchStaff: (filters?: StaffFilters) => Promise<void>;
  createStaff: (payload: CreateStaffPayload) => Promise<boolean>;
  updateStaff: (id: string, payload: UpdateStaffPayload) => Promise<boolean>;
  // NOTE: name kept as "deleteStaff" to match the existing DELETE call,
  // but confirmed via a live response that this deactivates (status flips
  // ACTIVE -> OFFLINE) rather than removing the record.
  deleteStaff: (id: string) => Promise<boolean>;
}

export const useStaffStore = create<StaffState>((set, get) => ({
  staff: null,
  isLoading: false,
  isError: false,
  isSaving: false,
  isDeleting: false,
  lastFilters: {},

  fetchStaff: async (filters = {}) => {
    set({ isLoading: true, isError: false, lastFilters: filters });
    try {
      const staff = await staffService.getStaff(filters);
      set({ staff, isLoading: false });
    } catch (error) {
      set({ isLoading: false, isError: true });
      toast.error(extractErrorMessage(error, 'Could not load staff'));
    }
  },

  createStaff: async (payload) => {
    set({ isSaving: true });
    try {
      await staffService.createStaff(payload);
      set({ isSaving: false });
      toast.success(`${payload.name} added`);
      await get().fetchStaff(get().lastFilters);
      return true;
    } catch (error) {
      set({ isSaving: false });
      toast.error(extractErrorMessage(error, 'Could not add staff member'));
      return false;
    }
  },

  updateStaff: async (id, payload) => {
    set({ isSaving: true });
    try {
      await staffService.updateStaff(id, payload);
      set({ isSaving: false });
      toast.success(`${payload.name ?? 'Staff member'} updated`);
      await get().fetchStaff(get().lastFilters);
      return true;
    } catch (error) {
      set({ isSaving: false });
      toast.error(extractErrorMessage(error, 'Could not update staff member'));
      return false;
    }
  },

  deleteStaff: async (id) => {
    set({ isDeleting: true });
    try {
      await staffService.deleteStaff(id);
      set({ isDeleting: false });
      toast.success('Staff member deactivated');
      await get().fetchStaff(get().lastFilters);
      return true;
    } catch (error) {
      set({ isDeleting: false });
      toast.error(extractErrorMessage(error, 'Could not deactivate staff member'));
      return false;
    }
  },
}));