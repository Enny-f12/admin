import { create } from 'zustand';
import { toast } from 'sonner';
import { staffService } from '@/services/staff.service';
import {
  StaffMember,
  CreateStaffPayload,
  UpdateStaffPayload,
  StaffFilters,
  PermissionsResponse,
  RoleDefaultsResponse,
} from '@/types/staff';

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

  // Fetched once and cached — same pattern as branches in useAuthStore.
  // Null means "not loaded yet"; the page decides when to fetch.
  permissions: PermissionsResponse | null;
  isLoadingPermissions: boolean;

  roleDefaults: RoleDefaultsResponse | null;
  isLoadingRoleDefaults: boolean;

  lastFilters: StaffFilters;

  fetchStaff: (filters?: StaffFilters) => Promise<void>;
  fetchPermissions: () => Promise<void>;
  fetchRoleDefaults: () => Promise<void>;
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

  permissions: null,
  isLoadingPermissions: false,

  roleDefaults: null,
  isLoadingRoleDefaults: false,

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

  fetchPermissions: async () => {
    set({ isLoadingPermissions: true });
    try {
      const permissions = await staffService.getPermissions();
      set({ permissions, isLoadingPermissions: false });
    } catch (error) {
      // Left null on failure — the modal falls back to empty checkbox
      // lists rather than blocking staff creation entirely.
      set({ isLoadingPermissions: false });
      toast.error(extractErrorMessage(error, 'Could not load permissions'));
    }
  },

  fetchRoleDefaults: async () => {
    set({ isLoadingRoleDefaults: true });
    try {
      const roleDefaults = await staffService.getRoleDefaults();
      set({ roleDefaults, isLoadingRoleDefaults: false });
    } catch (error) {
      set({ isLoadingRoleDefaults: false });
      toast.error(extractErrorMessage(error, 'Could not load roles'));
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