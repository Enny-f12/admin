// store/useStaffStore.ts
import { create } from 'zustand';
import { toast } from 'sonner';
import { staffService } from '@/services/staff.service';
import { StaffMember, CreateStaffPayload, UpdateStaffPayload } from '@/types/staff';

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

  fetchStaff: () => Promise<void>;
  createStaff: (payload: CreateStaffPayload) => Promise<boolean>;
  updateStaff: (id: string, payload: UpdateStaffPayload) => Promise<boolean>;
  deleteStaff: (id: string) => Promise<boolean>;
}

export const useStaffStore = create<StaffState>((set, get) => ({
  staff: null,
  isLoading: false,
  isError: false,
  isSaving: false,
  isDeleting: false,

  fetchStaff: async () => {
    set({ isLoading: true, isError: false });
    try {
      const staff = await staffService.getStaff();
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
      await get().fetchStaff();
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
      await get().fetchStaff();
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
      toast.success('Staff member removed');
      await get().fetchStaff();
      return true;
    } catch (error) {
      set({ isDeleting: false });
      toast.error(extractErrorMessage(error, 'Could not remove staff member'));
      return false;
    }
  },
}));