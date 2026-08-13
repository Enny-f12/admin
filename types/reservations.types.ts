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
   Everything below is still SPECULATIVE — endpoints are confirmed
   to exist in Swagger, but full response shapes haven't been hit
   live. Request shapes below ARE confirmed against real Swagger
   examples (see reservations.service.ts comments for which).
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

/**
 * CONFIRMED — matches the real POST /admin/reservations/special-dates
 * request body exactly (branchId lives in the BODY here, not a query
 * param — unlike most other reservations endpoints). Previously missing
 * branchId entirely, which would have 400'd or silently failed.
 */
export interface AddSpecialDatePayload {
  branchId: string;
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

/**
 * CONFIRMED — matches POST /admin/reservations/waitlist request body
 * exactly. There was previously no service method for this endpoint at
 * all — the Waitlist tab could only read/notify/seat, never add anyone.
 */
export interface CreateWaitlistEntryPayload {
  branchId: string;
  name: string;
  phone: string;
  partySize: number;
}

/**
 * CONFIRMED — matches PATCH /admin/reservations/waitlist/:id/seat's
 * request body exactly. Seating someone requires picking which table
 * they're being seated at — the previous implementation sent no body at
 * all, which the backend requires (see Swagger: Request body required).
 */
export interface SeatWaitlistPayload {
  tableId: string;
}

export interface ReminderRule {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

/**
 * CORRECTED — the real PUT /admin/reservations/reminders body is a bare
 * array of strings (Swagger example: ["string"]), NOT {id, enabled}[]
 * like the previous guess assumed. Semantics of what the strings
 * represent (ids of enabled rules? rule type keys?) are NOT confirmed —
 * see the comment on saveReminders() in the store for the current
 * best-guess interpretation pending backend confirmation.
 */
export type UpdateRemindersPayload = string[];