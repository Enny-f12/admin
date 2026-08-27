// types/reservations.types.ts


export type ReservationStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'SEATED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';


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
  addedAt: string; 
}


export interface CreateWaitlistEntryPayload {
  branchId: string;
  name: string;
  phone: string;
  partySize: number;
}


export interface SeatWaitlistPayload {
  tableId: string;
}

export interface ReminderRule {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}


export type UpdateRemindersPayload = string[];