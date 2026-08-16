// store/useNotificationStore.ts
import { create } from 'zustand';
import { toast } from 'sonner';
import { notificationService } from '@/services/notification.service';
import { Notification } from '@/types/notification';

function extractErrorMessage(error: unknown, fallback: string) {
  const anyErr = error as any;
  return anyErr?.response?.data?.message ?? anyErr?.message ?? fallback;
}

interface NotificationState {
  notifications: Notification[] | null;
  isLoading: boolean;
  isError: boolean;
  isMarkingAllRead: boolean;

  pollHandle: ReturnType<typeof setInterval> | null;

  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: null,
  isLoading: false,
  isError: false,
  isMarkingAllRead: false,
  pollHandle: null,

  // Fails silently — bell icon shouldn't toast-spam on load or on each poll tick
  fetchNotifications: async () => {
    set({ isLoading: true, isError: false });
    try {
      const notifications = await notificationService.getAll();
      set({ notifications, isLoading: false });
    } catch {
      set({ isLoading: false, isError: true });
    }
  },

  // Optimistic — toggling read state should feel instant, and silently
  // fails on rollback (no toast) to match the original's silent errorMessage
  markAsRead: async (id) => {
    const previous = get().notifications;
    set({
      notifications: previous
        ? previous.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
        : previous,
    });
    try {
      await notificationService.markAsRead(id);
    } catch {
      set({ notifications: previous });
    }
  },

  markAllAsRead: async () => {
    const previous = get().notifications;
    set({
      isMarkingAllRead: true,
      notifications: previous
        ? previous.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() }))
        : previous,
    });
    try {
      await notificationService.markAllAsRead();
      set({ isMarkingAllRead: false });
      toast.success('All notifications marked as read');
    } catch (error) {
      set({ isMarkingAllRead: false, notifications: previous });
      toast.error(extractErrorMessage(error, 'Could not update notifications'));
    }
  },

  startPolling: () => {
    if (get().pollHandle) return; // already polling
    const handle = setInterval(() => {
      get().fetchNotifications();
    }, 30000);
    set({ pollHandle: handle });
  },

  stopPolling: () => {
    const handle = get().pollHandle;
    if (handle) clearInterval(handle);
    set({ pollHandle: null });
  },
}));