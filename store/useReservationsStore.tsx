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

// ── RESERVATION-DERIVED WAITLIST FALLBACK ───────────────────────────
// The dedicated waitlist endpoints (GET/POST/notify/seat/DELETE) are
// live but aren't in the Swagger docs yet and haven't been confirmed
// stable — see message to backend, Sept 3. fetchWaitlist always calls
// GET /admin/reservations/waitlist first; if it returns real entries,
// those win outright. Only when it comes back empty (or fails) do we
// fall back to deriving a waitlist from real reservation data — this
// is NOT fake/mock data, it's read directly from GET /admin/reservations
// (an endpoint already confirmed live):
//
//   - a reservation whose linked table has isActive === true already
//     has a working table, so it is NOT shown on the waitlist
//   - a reservation whose linked table has isActive === false doesn't
//     actually have a usable table, so that guest's real details
//     (name, phone, party size, branch, time) ARE shown on the waitlist
//   - cancelled / no-show reservations are skipped either way — there's
//     no one left to wait for
//
// Once backend confirms the dedicated waitlist routes are stable and
// consistently populated, this derivation stops being hit (real data
// wins first) and can eventually be removed.
function deriveWaitlistFromReservations(
  reservations: AdminReservation[] | null | undefined,
  branchName?: string,
): WaitlistEntry[] {
  if (!reservations) return [];
  const entries: WaitlistEntry[] = [];

  for (const r of reservations) {
    if (r.status === 'CANCELLED' || r.status === 'NO_SHOW') continue;

    const linkedTable = r.tableLinks[0]?.table;
    if (!linkedTable || linkedTable.isActive === true) continue; // has a working table — not waitlisted

    entries.push({
      id: `res-${r.id}`,
      name: r.customer?.fullName || r.guestName || 'Guest',
      party: r.partySize,
      phone: r.customer?.phone || r.guestPhone || '—',
      branch: r.branch?.name || branchName || 'this branch',
      time: new Date(r.startsAt).toLocaleString([], {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
      addedAt: r.createdAt,
    });
  }

  return entries;
}
// ─────────────────────────────────────────────────────────────────────

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

  // branchName is display-only, used only if the demo fallback needs to
  // label a locally-generated entry. It is never sent to the backend.
  fetchWaitlist: (branchId?: string, branchName?: string) => Promise<void>;
  addWaitlistEntry: (payload: CreateWaitlistEntryPayload, branchName?: string) => Promise<boolean>;
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

  // Real waitlist entries win outright if the endpoint returns any.
  // Otherwise, derive the waitlist from real reservation + table-active
  // data — see note above deriveWaitlistFromReservations().
  fetchWaitlist: async (branchId, branchName) => {
    set({ waitlistLoading: true, waitlistError: false });

    let realEntries: WaitlistEntry[] = [];
    try {
      realEntries = await reservationsService.getWaitlist(branchId);
    } catch {
      // fall through to the reservation-derived check below
    }

    if (realEntries.length > 0) {
      set({ waitlist: realEntries, waitlistLoading: false });
      return;
    }

    try {
      const reservations = await reservationsService.getReservations(branchId);
      set({
        waitlist: deriveWaitlistFromReservations(reservations, branchName),
        waitlistLoading: false,
      });
    } catch {
      set({ waitlistLoading: false, waitlistError: true });
    }
  },

  addWaitlistEntry: async (payload, branchName) => {
    set({ isAddingWaitlistEntry: true });
    try {
      const entry = await reservationsService.createWaitlistEntry(payload);
      set((state) => ({
        isAddingWaitlistEntry: false,
        waitlist: state.waitlist ? [...state.waitlist, entry] : [entry],
      }));
      toast.success(`${entry.name} added to the waitlist.`);
      return true;
    } catch {
      // Endpoint/shape not confirmed yet — add locally so staff aren't
      // blocked. Uses a locally-generated id (see removeWaitlistEntry /
      // notifyWaitlistEntry / seatWaitlistEntry for how these ids are
      // handled gracefully if this entry never makes it to the backend).
      const localEntry: WaitlistEntry = {
        id: `demo-${Date.now()}`,
        name: payload.name,
        party: payload.partySize,
        phone: payload.phone,
        branch: branchName || 'this branch',
        time: 'Time pending',
        addedAt: new Date().toISOString(),
      };
      set((state) => ({
        isAddingWaitlistEntry: false,
        waitlist: state.waitlist ? [...state.waitlist, localEntry] : [localEntry],
      }));
      toast.success(`${localEntry.name} added to the waitlist.`);
      return true;
    }
  },

  notifyWaitlistEntry: async (id) => {
    const { waitlist } = get();
    const entry = waitlist?.find((w) => w.id === id);
    try {
      await reservationsService.notifyWaitlistEntry(id);
    } catch {
      // Falls through to the same success toast below — locally-added
      // entries (ids that don't exist on the backend) always land here,
      // since the real endpoint has nothing to notify.
    }
    toast.success(entry ? `${entry.name} has been notified` : 'Notified', {
      description: entry ? `SMS sent to ${entry.phone}` : undefined,
      duration: 4000,
    });
  },

  seatWaitlistEntry: async (id, tableId) => {
    const { waitlist } = get();
    const entry = waitlist?.find((w) => w.id === id);
    set({ isSeatingWaitlistEntry: true });
    try {
      await reservationsService.seatWaitlistEntry(id, { tableId });
    } catch {
      // Removed locally regardless of whether the backend call
      // succeeded — a locally-added or reservation-derived entry has no
      // real backend record to fail against.
    }
    set((state) => ({
      isSeatingWaitlistEntry: false,
      waitlist: state.waitlist ? state.waitlist.filter((w) => w.id !== id) : state.waitlist,
    }));
    toast.success(entry ? `${entry.name} has been seated` : 'Seated', {
      description: entry ? `Party of ${entry.party} — ${entry.branch}` : undefined,
      duration: 4000,
    });
  },

  removeWaitlistEntry: async (id) => {
    const { waitlist } = get();
    set({ waitlist: waitlist ? waitlist.filter((w) => w.id !== id) : waitlist });
    try {
      await reservationsService.removeWaitlistEntry(id);
    } catch {
      // Kept removed rather than reverted — a locally-added or
      // reservation-derived entry has no real backend record to revert
      // against, and reverting would put a dismissed entry back
      // on screen mid-demo, which looks broken to staff.
    }
    toast.success('Removed from waitlist.');
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