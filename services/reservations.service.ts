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

  // ── STILL SPECULATIVE — no matching backend controller found yet ──────

  getPolicies: (branchId?: string) =>
    apiClient
      .get<ReservationPolicies>('/admin/reservations/policies', { params: { branchId } })
      .then((r) => r.data),

  updatePolicies: (payload: UpdateReservationPoliciesPayload) =>
    apiClient.put<ReservationPolicies>('/admin/reservations/policies', payload).then((r) => r.data),

  addSpecialDate: (payload: AddSpecialDatePayload) =>
    apiClient.post<SpecialDate>('/admin/reservations/special-dates', payload).then((r) => r.data),

  removeSpecialDate: (id: string) =>
    apiClient
      .delete<{ success: boolean }>(`/admin/reservations/special-dates/${id}`)
      .then((r) => r.data),

  getWaitlist: () => apiClient.get<WaitlistEntry[]>('/admin/reservations/waitlist').then((r) => r.data),

  notifyWaitlistEntry: (id: string) =>
    apiClient
      .post<{ success: boolean }>(`/admin/reservations/waitlist/${id}/notify`)
      .then((r) => r.data),

  seatWaitlistEntry: (id: string) =>
    apiClient
      .post<{ success: boolean }>(`/admin/reservations/waitlist/${id}/seat`)
      .then((r) => r.data),

  getReminders: () => apiClient.get<ReminderRule[]>('/admin/reservations/reminders').then((r) => r.data),

  updateReminders: (payload: UpdateRemindersPayload) =>
    apiClient.put<ReminderRule[]>('/admin/reservations/reminders', payload).then((r) => r.data),
};