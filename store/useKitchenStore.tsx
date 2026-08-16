import { create } from 'zustand';
import { toast } from 'sonner';
import { kitchenService } from '@/services/kitchen.service';
import { KitchenOrder, CompletedKitchenOrder, KitchenDisplaySettings, UpdateKitchenSettingsPayload } from '@/types/kitchen.types';

function extractErrorMessage(error: unknown, fallback: string) {
  const anyErr = error as any;
  return anyErr?.response?.data?.message ?? anyErr?.message ?? fallback;
}

interface KitchenState {
  liveQueue: KitchenOrder[] | null;
  liveQueueLoading: boolean;
  liveQueueError: boolean;

  completed: CompletedKitchenOrder[] | null;
  completedLoading: boolean;
  completedError: boolean;

  settings: KitchenDisplaySettings | null;
  settingsLoading: boolean;
  settingsError: boolean;
  isSavingSettings: boolean;

  fetchLiveQueue: (branchId?: string) => Promise<void>;
  fetchCompleted: (minutes?: number, branchId?: string) => Promise<void>;
  fetchSettings: (branchId?: string) => Promise<void>;
  saveSettings: (payload: UpdateKitchenSettingsPayload, branchId?: string) => Promise<boolean>;
}

export const useKitchenStore = create<KitchenState>((set) => ({
  liveQueue: null,
  liveQueueLoading: false,
  liveQueueError: false,

  completed: null,
  completedLoading: false,
  completedError: false,

  settings: null,
  settingsLoading: false,
  settingsError: false,
  isSavingSettings: false,

  // Fails silently, no toast -- this is polled repeatedly and a
  // transient error shouldn't spam the kitchen screen with toasts.
  fetchLiveQueue: async (branchId) => {
    set({ liveQueueLoading: true, liveQueueError: false });
    try {
      const liveQueue = await kitchenService.getLiveQueue(branchId);
      set({ liveQueue, liveQueueLoading: false });
    } catch {
      set({ liveQueueLoading: false, liveQueueError: true });
    }
  },

  fetchCompleted: async (minutes = 30, branchId) => {
    set({ completedLoading: true, completedError: false });
    try {
      const completed = await kitchenService.getCompleted(minutes, branchId);
      set({ completed, completedLoading: false });
    } catch {
      set({ completedLoading: false, completedError: true });
    }
  },

  fetchSettings: async (branchId) => {
    set({ settingsLoading: true, settingsError: false });
    try {
      const settings = await kitchenService.getSettings(branchId);
      set({ settings, settingsLoading: false });
    } catch {
      set({ settingsLoading: false, settingsError: true });
    }
  },

  saveSettings: async (payload, branchId) => {
    set({ isSavingSettings: true });
    try {
      const settings = await kitchenService.updateSettings(payload, branchId);
      set({ settings, isSavingSettings: false });
      toast.success('Settings saved.');
      return true;
    } catch (error) {
      set({ isSavingSettings: false });
      toast.error(extractErrorMessage(error, 'Could not save settings.'));
      return false;
    }
  },
}));