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
  CreateWaitlistEntryPayload,
  ReminderRule,
} from '@/types/reservations.types';

function extractErrorMessage(error: unknown, fallback: string) {
  const anyErr = error as any;
  return anyErr?.response?.data?.message ?? anyErr?.message ?? fallback;
}

interface ReservationsState {
  policies: ReservationPolicies | null;
  policiesLoading: boolean;
  policiesError: boolean;
  isSavingPolicies: boolean;
  isSavingSpecialDate: boolean;

  tables: DiningTable[] | null;
  tablesLoading: boolean;
  tablesError: boolean;
  isCreatingTable: boolean;

  reservations: AdminReservation[] | null;
  reservationsLoading: boolean;
  reservationsError: boolean;
  isUpdatingReservationStatus: boolean;

  waitlist: WaitlistEntry[] | null;
  waitlistLoading: boolean;
  waitlistError: boolean;
  isAddingWaitlistEntry: boolean;
  isSeatingWaitlistEntry: boolean;

  reminders: ReminderRule[] | null;
  remindersLoading: boolean;
  remindersError: boolean;
  isSavingReminders: boolean;

  fetchPolicies: (branchId?: string) => Promise<void>;
  savePolicies: (branchId: string | undefined, payload: UpdateReservationPoliciesPayload) => Promise<boolean>;
  addSpecialDate: (payload: AddSpecialDatePayload) => Promise<boolean>;
  removeSpecialDate: (id: string) => Promise<void>;

  fetchTables: (branchId: string) => Promise<void>;
  createTable: (branchId: string, payload: CreateTablePayload) => Promise<boolean>;

  fetchReservations: (branchId?: string, status?: ReservationStatus) => Promise<void>;
  updateReservationStatus: (id: string, status: ReservationStatus) => Promise<boolean>;

  fetchWaitlist: (branchId?: string) => Promise<void>;
  addWaitlistEntry: (payload: CreateWaitlistEntryPayload) => Promise<boolean>;
  notifyWaitlistEntry: (id: string) => Promise<void>;
  seatWaitlistEntry: (id: string, tableId: string) => Promise<void>;
  removeWaitlistEntry: (id: string) => Promise<void>;

  fetchReminders: (branchId?: string) => Promise<void>;
  toggleReminder: (id: string) => void;
  saveReminders: (branchId?: string) => Promise<void>;
}

// Defensive dedupe for reminder rules. The backend has occasionally
// returned duplicate rows for a branch — same label/description, two
// different UUIDs (root cause looks like a non-idempotent seed step,
// same bug class as the find-then-create races found elsewhere this
// session; flagged to backend separately). Keeping the first occurrence
// of each label means staff never see two toggles for "24-Hour SMS
// Reminder" that could silently disagree with each other. This is a
// stopgap, not a fix — the real fix is the backend cleaning up the
// duplicate rows and making the seed step idempotent.
function dedupeReminders(rules: ReminderRule[]): ReminderRule[] {
  const seen = new Set<string>();
  return rules.filter((r) => {
    if (seen.has(r.label)) return false;
    seen.add(r.label);
    return true;
  });
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
  isAddingWaitlistEntry: false,
  isSeatingWaitlistEntry: false,

  reminders: null,
  remindersLoading: false,
  remindersError: false,
  isSavingReminders: false,

  fetchPolicies: async (branchId) => {
    set({ policiesLoading: true, policiesError: false });
    try {
      const policies = await reservationsService.getPolicies(branchId);
      set({ policies, policiesLoading: false });
    } catch {
      set({ policiesLoading: false, policiesError: true });
    }
  },

  savePolicies: async (branchId, payload) => {
    set({ isSavingPolicies: true });
    try {
      const policies = await reservationsService.updatePolicies(branchId, payload);
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

  fetchWaitlist: async (branchId) => {
    set({ waitlistLoading: true, waitlistError: false });
    try {
      const waitlist = await reservationsService.getWaitlist(branchId);
      set({ waitlist, waitlistLoading: false });
    } catch {
      set({ waitlistLoading: false, waitlistError: true });
    }
  },

  addWaitlistEntry: async (payload) => {
    set({ isAddingWaitlistEntry: true });
    try {
      const entry = await reservationsService.createWaitlistEntry(payload);
      set((state) => ({
        isAddingWaitlistEntry: false,
        waitlist: state.waitlist ? [...state.waitlist, entry] : [entry],
      }));
      toast.success(`${entry.name} added to the waitlist.`);
      return true;
    } catch (error) {
      set({ isAddingWaitlistEntry: false });
      toast.error(extractErrorMessage(error, 'Could not add to waitlist.'));
      return false;
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

  seatWaitlistEntry: async (id, tableId) => {
    const { waitlist } = get();
    const entry = waitlist?.find((w) => w.id === id);
    set({ isSeatingWaitlistEntry: true });
    try {
      await reservationsService.seatWaitlistEntry(id, { tableId });
      set((state) => ({
        isSeatingWaitlistEntry: false,
        waitlist: state.waitlist ? state.waitlist.filter((w) => w.id !== id) : state.waitlist,
      }));
      toast.success(entry ? `${entry.name} has been seated` : 'Seated', {
        description: entry ? `Party of ${entry.party} — ${entry.branch}` : undefined,
        duration: 4000,
      });
    } catch (error) {
      set({ isSeatingWaitlistEntry: false });
      toast.error(extractErrorMessage(error, 'Could not seat this party.'));
    }
  },

  removeWaitlistEntry: async (id) => {
    const { waitlist } = get();
    const previous = waitlist;
    set({ waitlist: waitlist ? waitlist.filter((w) => w.id !== id) : waitlist });
    try {
      await reservationsService.removeWaitlistEntry(id);
      toast.success('Removed from waitlist.');
    } catch (error) {
      set({ waitlist: previous });
      toast.error(extractErrorMessage(error, 'Could not remove from waitlist.'));
    }
  },

  fetchReminders: async (branchId) => {
    set({ remindersLoading: true, remindersError: false });
    try {
      const raw = await reservationsService.getReminders(branchId);
      // See dedupeReminders() above — backend has occasionally sent
      // duplicate rows (same label/description, different id) for a
      // branch. Only the first occurrence of each label is kept for
      // display; the hidden duplicate's id is intentionally left out of
      // whatever gets saved (see saveReminders below), since there's no
      // reliable way to know which of the two duplicate ids the
      // backend actually treats as canonical.
      set({ reminders: dedupeReminders(raw), remindersLoading: false });
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

  saveReminders: async (branchId) => {
    const { reminders } = get();
    if (!reminders) return;
    set({ isSavingReminders: true });
    try {
      // `reminders` here is already deduped (see fetchReminders), so
      // this only ever sends ids for the rules actually shown to staff
      // — a hidden duplicate row's id is never included, and its
      // enabled state on the backend is left untouched by Save. That's
      // a known gap until the backend cleans up the duplicate rows;
      // flagged to backend separately.
      const enabledIds = reminders.filter((r) => r.enabled).map((r) => r.id);
      const updated = await reservationsService.updateReminders(branchId, enabledIds);
      set({ reminders: dedupeReminders(updated), isSavingReminders: false });
      toast.success('Reminder settings saved');
    } catch (error) {
      set({ isSavingReminders: false });
      toast.error(extractErrorMessage(error, 'Could not save reminder settings.'));
    }
  },
}));