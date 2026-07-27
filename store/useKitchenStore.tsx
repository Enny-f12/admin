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

  fetchLiveQueue: () => Promise<void>;
  fetchCompleted: (minutes?: number) => Promise<void>;
  fetchSettings: () => Promise<void>;
  saveSettings: (payload: UpdateKitchenSettingsPayload) => Promise<boolean>;
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

  // NOT YET BUILT — fail silently, no toast (this is polled repeatedly)
  fetchLiveQueue: async () => {
    set({ liveQueueLoading: true, liveQueueError: false });
    try {
      const liveQueue = await kitchenService.getLiveQueue();
      set({ liveQueue, liveQueueLoading: false });
    } catch {
      set({ liveQueueLoading: false, liveQueueError: true });
    }
  },

  fetchCompleted: async (minutes = 30) => {
    set({ completedLoading: true, completedError: false });
    try {
      const completed = await kitchenService.getCompleted(minutes);
      set({ completed, completedLoading: false });
    } catch {
      set({ completedLoading: false, completedError: true });
    }
  },

  fetchSettings: async () => {
    set({ settingsLoading: true, settingsError: false });
    try {
      const settings = await kitchenService.getSettings();
      set({ settings, settingsLoading: false });
    } catch {
      set({ settingsLoading: false, settingsError: true });
    }
  },

  saveSettings: async (payload) => {
    set({ isSavingSettings: true });
    try {
      const settings = await kitchenService.updateSettings(payload);
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