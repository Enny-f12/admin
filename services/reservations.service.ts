// services/reservations.service.ts
import { apiClient } from '@/lib/api-client';
import {
  ReservationPolicies,
  UpdateReservationPoliciesPayload,
  SpecialDate,
  AddSpecialDatePayload,
  DiningTable,
  CreateTablePayload,
  AdminReservation,
  ReservationStatus,
  WaitlistEntry,
  CreateWaitlistEntryPayload,
  SeatWaitlistPayload,
  ReminderRule,
  UpdateRemindersPayload,
} from '@/types/reservations.types';

export const reservationsService = {
  // ── CONFIRMED LIVE — from AdminReservationController ──────────────────

  /** GET /admin/reservations/tables — branchId is a REQUIRED query param. */
  getTables: (branchId: string) =>
    apiClient
      .get<DiningTable[]>('/admin/reservations/tables', { params: { branchId } })
      .then((r) => r.data),

  /** POST /admin/reservations/tables — body: { branchId, name, seats, section? } */
  createTable: (branchId: string, payload: CreateTablePayload) =>
    apiClient
      .post<DiningTable>('/admin/reservations/tables', { branchId, ...payload })
      .then((r) => r.data),

  /** GET /admin/reservations — both branchId and status are optional query params. */
  getReservations: (branchId?: string, status?: ReservationStatus) =>
    apiClient
      .get<AdminReservation[]>('/admin/reservations', { params: { branchId, status } })
      .then((r) => r.data),

  /** PATCH /admin/reservations/:id/status — covers Confirm, Seat, No-show, Cancel. */
  updateReservationStatus: (id: string, status: ReservationStatus) =>
    apiClient
      .patch<AdminReservation>(`/admin/reservations/${id}/status`, { status })
      .then((r) => r.data),

  // ── SPECULATIVE ENDPOINTS — routes confirmed in Swagger, but response
  // shapes not yet hit live. Request shapes below ARE confirmed against
  // Swagger examples/params, and every branchId gap flagged in the last
  // review is now fixed. ─────────────────────────────────────────────

  /** GET /admin/reservations/policies — branchId optional query param. */
  getPolicies: (branchId?: string) =>
    apiClient
      .get<ReservationPolicies>('/admin/reservations/policies', { params: { branchId } })
      .then((r) => r.data),

  // FIXED — was not sending branchId at all. Swagger confirms it's an
  // optional query param on this route (same as GET), even though it's
  // a PUT with its own body.
  updatePolicies: (branchId: string | undefined, payload: UpdateReservationPoliciesPayload) =>
    apiClient
      .put<ReservationPolicies>('/admin/reservations/policies', payload, { params: { branchId } })
      .then((r) => r.data),

  // FIXED — AddSpecialDatePayload now includes branchId (confirmed to
  // live in the request BODY for this endpoint, not a query param —
  // different pattern from policies/reminders/waitlist GETs).
  addSpecialDate: (payload: AddSpecialDatePayload) =>
    apiClient.post<SpecialDate>('/admin/reservations/special-dates', payload).then((r) => r.data),

  removeSpecialDate: (id: string) =>
    apiClient
      .delete<{ success: boolean }>(`/admin/reservations/special-dates/${id}`)
      .then((r) => r.data),

  // FIXED — was not sending branchId. Confirmed optional query param.
  getWaitlist: (branchId?: string) =>
    apiClient
      .get<WaitlistEntry[]>('/admin/reservations/waitlist', { params: { branchId } })
      .then((r) => r.data),

  // NEW — this endpoint existed in Swagger (POST /admin/reservations/
  // waitlist) but had no corresponding service method at all. The
  // Waitlist tab could read/notify/seat but never actually add anyone.
  createWaitlistEntry: (payload: CreateWaitlistEntryPayload) =>
    apiClient.post<WaitlistEntry>('/admin/reservations/waitlist', payload).then((r) => r.data),

  notifyWaitlistEntry: (id: string) =>
    apiClient
      .post<{ success: boolean }>(`/admin/reservations/waitlist/${id}/notify`)
      .then((r) => r.data),

  // FIXED — this route requires a body ({ tableId }), which was never
  // being sent. Seating someone from the waitlist needs to specify which
  // table they're being seated at.
  seatWaitlistEntry: (id: string, payload: SeatWaitlistPayload) =>
    apiClient
      .post<{ success: boolean }>(`/admin/reservations/waitlist/${id}/seat`, payload)
      .then((r) => r.data),

  // NEW — DELETE /admin/reservations/waitlist/:id existed in Swagger
  // ("Remove a entry from the waitlist") with no service method at all.
  removeWaitlistEntry: (id: string) =>
    apiClient
      .delete<{ success: boolean }>(`/admin/reservations/waitlist/${id}`)
      .then((r) => r.data),

  // FIXED — was not sending branchId. Confirmed optional query param.
  getReminders: (branchId?: string) =>
    apiClient
      .get<ReminderRule[]>('/admin/reservations/reminders', { params: { branchId } })
      .then((r) => r.data),

  // FIXED — two issues: (1) branchId wasn't being sent as a query param,
  // and (2) the request body shape was wrong. The real body is a bare
  // string[] (Swagger example: ["string"]), not {id, enabled}[]. See the
  // comment on UpdateRemindersPayload in reservations.types.ts.
  updateReminders: (branchId: string | undefined, payload: UpdateRemindersPayload) =>
    apiClient
      .put<ReminderRule[]>('/admin/reservations/reminders', payload, { params: { branchId } })
      .then((r) => r.data),
};