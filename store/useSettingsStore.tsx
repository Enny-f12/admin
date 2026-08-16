// store/useSettingsStore.ts
import { create } from 'zustand';
import { toast } from 'sonner';
import { settingsService } from '@/services/settings.service';
import {
  Banner,
  BannerFormData,
  NotificationSettings,
  Branch,
  CreateBranchPayload,
  UpdateBranchPayload,
} from '@/types/settings.types';

function extractErrorMessage(error: unknown, fallback: string) {
  const anyErr = error as any;
  return anyErr?.response?.data?.message ?? anyErr?.message ?? fallback;
}

interface SettingsState {
  banners: Banner[] | null;
  bannersLoading: boolean;
  bannersError: boolean;
  isSavingBanner: boolean;

  notifications: NotificationSettings | null;
  notificationsLoading: boolean;
  notificationsError: boolean;
  isSavingNotifications: boolean;

  branches: Branch[] | null;
  branchesLoading: boolean;
  branchesError: boolean;
  isSavingBranch: boolean;

  fetchBanners: () => Promise<void>;
  createBanner: (form: BannerFormData) => Promise<boolean>;
  updateBanner: (id: string, form: Partial<BannerFormData>) => Promise<boolean>;
  deleteBanner: (id: string) => Promise<void>;

  fetchNotificationSettings: () => Promise<void>;
  toggleNotification: (channel: 'email' | 'sms', id: string) => void;
  saveNotificationSettings: () => Promise<void>;

  fetchBranches: () => Promise<void>;
  createBranch: (payload: CreateBranchPayload) => Promise<boolean>;
  updateBranchField: (id: string, key: keyof Branch, value: string) => void;
  saveBranches: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  banners: null,
  bannersLoading: false,
  bannersError: false,
  isSavingBanner: false,

  notifications: null,
  notificationsLoading: false,
  notificationsError: false,
  isSavingNotifications: false,

  branches: null,
  branchesLoading: false,
  branchesError: false,
  isSavingBranch: false,

  // ── Banners ─────────────────────────────────────────────────────

  fetchBanners: async () => {
    set({ bannersLoading: true, bannersError: false });
    try {
      const banners = await settingsService.getBanners();
      set({ banners, bannersLoading: false });
    } catch {
      set({ bannersLoading: false, bannersError: true });
    }
  },

  createBanner: async (form) => {
    set({ isSavingBanner: true });
    try {
      const banner = await settingsService.createBanner(form);
      set((state) => ({
        isSavingBanner: false,
        banners: state.banners ? [...state.banners, banner] : [banner],
      }));
      toast.success('Banner created successfully.');
      return true;
    } catch (error) {
      set({ isSavingBanner: false });
      toast.error(extractErrorMessage(error, 'Could not create banner.'));
      return false;
    }
  },

  updateBanner: async (id, form) => {
    set({ isSavingBanner: true });
    try {
      const updated = await settingsService.updateBanner(id, form);
      set((state) => ({
        isSavingBanner: false,
        banners: state.banners ? state.banners.map((b) => (b.id === id ? updated : b)) : state.banners,
      }));
      toast.success('Banner updated.');
      return true;
    } catch (error) {
      set({ isSavingBanner: false });
      toast.error(extractErrorMessage(error, 'Could not update banner.'));
      return false;
    }
  },

  deleteBanner: async (id) => {
    const { banners } = get();
    const previous = banners;
    set({ banners: banners ? banners.filter((b) => b.id !== id) : banners });
    try {
      await settingsService.deleteBanner(id);
      toast.success('Banner removed.');
    } catch (error) {
      set({ banners: previous });
      toast.error(extractErrorMessage(error, 'Could not remove banner.'));
    }
  },

  // ── Notifications ───────────────────────────────────────────────

  fetchNotificationSettings: async () => {
    set({ notificationsLoading: true, notificationsError: false });
    try {
      const notifications = await settingsService.getNotificationSettings();
      set({ notifications, notificationsLoading: false });
    } catch {
      set({ notificationsLoading: false, notificationsError: true });
    }
  },

  toggleNotification: (channel, id) => {
    set((state) => {
      if (!state.notifications) return state;
      return {
        notifications: {
          ...state.notifications,
          [channel]: state.notifications[channel].map((n) => (n.id === id ? { ...n, on: !n.on } : n)),
        },
      };
    });
  },

  saveNotificationSettings: async () => {
    const { notifications } = get();
    if (!notifications) return;
    set({ isSavingNotifications: true });
    try {
      const updated = await settingsService.updateNotificationSettings({
        email: notifications.email.map((n) => ({ id: n.id, on: n.on })),
        sms: notifications.sms.map((n) => ({ id: n.id, on: n.on })),
      });
      set({ notifications: updated, isSavingNotifications: false });
      toast.success('Notification settings saved');
    } catch (error) {
      set({ isSavingNotifications: false });
      toast.error(extractErrorMessage(error, 'Could not save notification settings.'));
    }
  },

  // ── Branches ────────────────────────────────────────────────────

  fetchBranches: async () => {
    set({ branchesLoading: true, branchesError: false });
    try {
      const branches = await settingsService.getBranches();
      set({ branches, branchesLoading: false });
    } catch {
      set({ branchesLoading: false, branchesError: true });
    }
  },

  createBranch: async (payload) => {
    set({ isSavingBranch: true });
    try {
      const branch = await settingsService.createBranch(payload);
      set((state) => ({
        isSavingBranch: false,
        branches: state.branches ? [...state.branches, branch] : [branch],
      }));
      toast.success('Location added');
      return true;
    } catch (error) {
      set({ isSavingBranch: false });
      toast.error(extractErrorMessage(error, 'Could not add location.'));
      return false;
    }
  },

  // Local-only edit — persisted via saveBranches below, matching the
  // mock's "edit inline, one Save Changes button for all rows" pattern.
  updateBranchField: (id, key, value) => {
    set((state) => ({
      branches: state.branches
        ? state.branches.map((b) => (b.id === id ? { ...b, [key]: value } : b))
        : state.branches,
    }));
  },

  saveBranches: async () => {
    const { branches } = get();
    if (!branches) return;
    set({ isSavingBranch: true });
    try {
      const updated = await Promise.all(
        branches.map((b) =>
          settingsService.updateBranch(b.id, {
            name: b.name,
            location: b.location,
            phone: b.phone,
            email: b.email,
          }),
        ),
      );
      set({ branches: updated, isSavingBranch: false });
      toast.success('Branch locations saved');
    } catch (error) {
      set({ isSavingBranch: false });
      toast.error(extractErrorMessage(error, 'Could not save branch locations.'));
    }
  },
}));