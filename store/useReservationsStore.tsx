// store/useReservationsStore.ts
import { create } from 'zustand';
import { toast } from 'sonner';
import { reservationsService } from '@/services/reservations.service';
import {
  ReservationPolicies,
  UpdateReservationPoliciesPayload,
  AddSpecialDatePayload,
  DiningTable,
  CreateTablePayload,
  AdminReservation,
  ReservationStatus,
  WaitlistEntry,
  ReminderRule,
} from '@/types/reservations.types';

function extractErrorMessage(error: unknown, fallback: string) {
  const anyErr = error as any;
  return anyErr?.response?.data?.message ?? anyErr?.message ?? fallback;
}

interface ReservationsState {
  // Policies (speculative)
  policies: ReservationPolicies | null;
  policiesLoading: boolean;
  policiesError: boolean;
  isSavingPolicies: boolean;
  isSavingSpecialDate: boolean;

  // Tables (confirmed live)
  tables: DiningTable[] | null;
  tablesLoading: boolean;
  tablesError: boolean;
  isCreatingTable: boolean;

  // Reservations (confirmed live)
  reservations: AdminReservation[] | null;
  reservationsLoading: boolean;
  reservationsError: boolean;
  isUpdatingReservationStatus: boolean;

  // Waitlist (speculative)
  waitlist: WaitlistEntry[] | null;
  waitlistLoading: boolean;
  waitlistError: boolean;

  // Reminders (speculative)
  reminders: ReminderRule[] | null;
  remindersLoading: boolean;
  remindersError: boolean;
  isSavingReminders: boolean;

  fetchPolicies: (branchId?: string) => Promise<void>;
  savePolicies: (payload: UpdateReservationPoliciesPayload) => Promise<boolean>;
  addSpecialDate: (payload: AddSpecialDatePayload) => Promise<boolean>;
  removeSpecialDate: (id: string) => Promise<void>;

  fetchTables: (branchId: string) => Promise<void>;
  createTable: (branchId: string, payload: CreateTablePayload) => Promise<boolean>;

  fetchReservations: (branchId?: string, status?: ReservationStatus) => Promise<void>;
  updateReservationStatus: (id: string, status: ReservationStatus) => Promise<boolean>;

  fetchWaitlist: () => Promise<void>;
  notifyWaitlistEntry: (id: string) => Promise<void>;
  seatWaitlistEntry: (id: string) => Promise<void>;

  fetchReminders: () => Promise<void>;
  toggleReminder: (id: string) => void;
  saveReminders: () => Promise<void>;
}

export const useReservationsStore = create<ReservationsState>((set, get) => ({
  policies: null,
  policiesLoading: false,
  policiesError: false,
  isSavingPolicies: false,
  isSavingSpecialDate: false,

  tables: null,
  tablesLoading: false,
  tablesError: false,
  isCreatingTable: false,

  reservations: null,
  reservationsLoading: false,
  reservationsError: false,
  isUpdatingReservationStatus: false,

  waitlist: null,
  waitlistLoading: false,
  waitlistError: false,

  reminders: null,
  remindersLoading: false,
  remindersError: false,
  isSavingReminders: false,

  // ── Policies (speculative) ─────────────────────────────────────────

  fetchPolicies: async (branchId) => {
    set({ policiesLoading: true, policiesError: false });
    try {
      const policies = await reservationsService.getPolicies(branchId);
      set({ policies, policiesLoading: false });
    } catch {
      set({ policiesLoading: false, policiesError: true });
    }
  },

  savePolicies: async (payload) => {
    set({ isSavingPolicies: true });
    try {
      const policies = await reservationsService.updatePolicies(payload);
      set({ policies, isSavingPolicies: false });
      toast.success('Policies saved', { description: 'Changes pushed to the customer app.' });
      return true;
    } catch (error) {
      set({ isSavingPolicies: false });
      toast.error(extractErrorMessage(error, 'Could not save policies.'));
      return false;
    }
  },

  addSpecialDate: async (payload) => {
    set({ isSavingSpecialDate: true });
    try {
      const specialDate = await reservationsService.addSpecialDate(payload);
      set((state) => ({
        isSavingSpecialDate: false,
        policies: state.policies
          ? { ...state.policies, specialDates: [...state.policies.specialDates, specialDate] }
          : state.policies,
      }));
      toast.success('Special date added');
      return true;
    } catch (error) {
      set({ isSavingSpecialDate: false });
      toast.error(extractErrorMessage(error, 'Could not add special date.'));
      return false;
    }
  },

  removeSpecialDate: async (id) => {
    const { policies } = get();
    const previous = policies;
    set({
      policies: policies
        ? { ...policies, specialDates: policies.specialDates.filter((d) => d.id !== id) }
        : policies,
    });
    try {
      await reservationsService.removeSpecialDate(id);
    } catch (error) {
      set({ policies: previous });
      toast.error(extractErrorMessage(error, 'Could not remove special date.'));
    }
  },

  // ── Tables (confirmed live) ────────────────────────────────────────

  fetchTables: async (branchId) => {
    set({ tablesLoading: true, tablesError: false });
    try {
      const tables = await reservationsService.getTables(branchId);
      set({ tables, tablesLoading: false });
    } catch {
      set({ tablesLoading: false, tablesError: true });
    }
  },

  createTable: async (branchId, payload) => {
    set({ isCreatingTable: true });
    try {
      const table = await reservationsService.createTable(branchId, payload);
      set((state) => ({
        isCreatingTable: false,
        tables: state.tables ? [...state.tables, table] : [table],
      }));
      toast.success('Table added.');
      return true;
    } catch (error) {
      set({ isCreatingTable: false });
      toast.error(extractErrorMessage(error, 'Could not add table.'));
      return false;
    }
  },

  // ── Reservations (confirmed live) ──────────────────────────────────

  fetchReservations: async (branchId, status) => {
    set({ reservationsLoading: true, reservationsError: false });
    try {
      const reservations = await reservationsService.getReservations(branchId, status);
      set({ reservations, reservationsLoading: false });
    } catch {
      set({ reservationsLoading: false, reservationsError: true });
    }
  },

  updateReservationStatus: async (id, status) => {
    const { reservations } = get();
    const previous = reservations;
    set({
      isUpdatingReservationStatus: true,
      reservations: reservations ? reservations.map((r) => (r.id === id ? { ...r, status } : r)) : reservations,
    });
    try {
      const updated = await reservationsService.updateReservationStatus(id, status);
      set((state) => ({
        isUpdatingReservationStatus: false,
        reservations: state.reservations
          ? state.reservations.map((r) => (r.id === id ? { ...r, ...updated } : r))
          : state.reservations,
      }));
      toast.success('Reservation updated.');
      return true;
    } catch (error) {
      set({ isUpdatingReservationStatus: false, reservations: previous });
      toast.error(extractErrorMessage(error, 'Could not update reservation status.'));
      return false;
    }
  },

  // ── Waitlist (speculative) ─────────────────────────────────────────

  fetchWaitlist: async () => {
    set({ waitlistLoading: true, waitlistError: false });
    try {
      const waitlist = await reservationsService.getWaitlist();
      set({ waitlist, waitlistLoading: false });
    } catch {
      set({ waitlistLoading: false, waitlistError: true });
    }
  },

  notifyWaitlistEntry: async (id) => {
    const { waitlist } = get();
    const entry = waitlist?.find((w) => w.id === id);
    try {
      await reservationsService.notifyWaitlistEntry(id);
      toast.success(entry ? `${entry.name} has been notified` : 'Notified', {
        description: entry ? `SMS sent to ${entry.phone}` : undefined,
        duration: 4000,
      });
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Could not send notification.'));
    }
  },

  seatWaitlistEntry: async (id) => {
    const { waitlist } = get();
    const entry = waitlist?.find((w) => w.id === id);
    try {
      await reservationsService.seatWaitlistEntry(id);
      set((state) => ({
        waitlist: state.waitlist ? state.waitlist.filter((w) => w.id !== id) : state.waitlist,
      }));
      toast.success(entry ? `${entry.name} has been seated` : 'Seated', {
        description: entry ? `Party of ${entry.party} — ${entry.branch}` : undefined,
        duration: 4000,
      });
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Could not seat this party.'));
    }
  },

  // ── Reminders (speculative) ────────────────────────────────────────

  fetchReminders: async () => {
    set({ remindersLoading: true, remindersError: false });
    try {
      const reminders = await reservationsService.getReminders();
      set({ reminders, remindersLoading: false });
    } catch {
      set({ remindersLoading: false, remindersError: true });
    }
  },

  toggleReminder: (id) => {
    set((state) => ({
      reminders: state.reminders
        ? state.reminders.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
        : state.reminders,
    }));
  },

  saveReminders: async () => {
    const { reminders } = get();
    if (!reminders) return;
    set({ isSavingReminders: true });
    try {
      const updated = await reservationsService.updateReminders(
        reminders.map((r) => ({ id: r.id, enabled: r.enabled })),
      );
      set({ reminders: updated, isSavingReminders: false });
      toast.success('Reminder settings saved');
    } catch (error) {
      set({ isSavingReminders: false });
      toast.error(extractErrorMessage(error, 'Could not save reminder settings.'));
    }
  },
}));