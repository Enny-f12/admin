// types/reservations.types.ts

/**
 * PENDING / CANCELLED / NO_SHOW confirmed directly from ReservationService
 * source. CONFIRMED and SEATED are near-certain given the admin status
 * endpoint's summary ("Update reservation status (Confirm, Seat, No-show)").
 * COMPLETED is a guess. Paste schema.prisma's ReservationStatus enum to
 * lock this down exactly — until then, treat this union as provisional.
 */
export type ReservationStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'SEATED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

/** Matches Prisma's DiningTable model exactly — confirmed via real API response. */
export interface DiningTable {
  id: string;
  branchId: string;
  name: string;
  seats: number;
  section: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReservationTableLink {
  table: DiningTable;
}

export interface ReservationCustomer {
  fullName: string;
  phone: string;
}

export interface ReservationBranch {
  name: string;
}

/** Matches AdminReservationController's GET /admin/reservations response. */
export interface AdminReservation {
  id: string;
  reference: string;
  branchId: string;
  branch?: ReservationBranch;
  customer?: ReservationCustomer | null;
  guestName: string | null;
  guestPhone: string | null;
  guestEmail: string | null;
  partySize: number;
  occasion: string | null;
  specialRequests: string | null;
  startsAt: string;
  endsAt: string;
  status: ReservationStatus;
  cancelledAt: string | null;
  tableLinks: ReservationTableLink[];
}

export interface CreateTablePayload {
  name: string;
  seats: number;
  section?: string;
}

/* ─────────────────────────────────────────────────────────────
   Everything below is still SPECULATIVE — no matching backend
   controller/service has been shared for any of it. Kept so the
   Policies/Waitlist/Reminders tabs still compile against a real
   shape, but none of these endpoints are confirmed to exist.
   ───────────────────────────────────────────────────────────── */

export interface TableType {
  seats: number;
  count: number;
}

export interface SpecialDate {
  id: string;
  date: string;
  label: string;
  type: string;
  note: string | null;
  openTime: string | null;
  closeTime: string | null;
  slot1: string | null;
  slot2: string | null;
}

export interface ReservationPolicies {
  branchId: string;
  reservationsEnabled: boolean;
  tableTypes: TableType[];
  timeSlotIncrementMinutes: number;
  bookingDurationMinutes: number;
  advanceBookingWindowDays: number;
  minimumLeadTimeMinutes: number;
  cancellationWindowHours: number;
  gracePeriodMinutes: number;
  requireDeposit: boolean;
  depositAmount: number;
  operatingHours: { open: string; close: string };
  specialDates: SpecialDate[];
}

export type UpdateReservationPoliciesPayload = Omit<ReservationPolicies, 'branchId' | 'specialDates'>;

export interface AddSpecialDatePayload {
  date: string;
  type: string;
  note: string | null;
  openTime: string | null;
  closeTime: string | null;
  slot1: string | null;
  slot2: string | null;
}

export interface WaitlistEntry {
  id: string;
  name: string;
  party: number;
  phone: string;
  branch: string;
  time: string;
  addedAt: string; // ISO — frontend derives "Added X min ago"
}

export interface ReminderRule {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export type UpdateRemindersPayload = { id: string; enabled: boolean }[];