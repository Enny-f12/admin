// services/delivery.service.ts
import { apiClient } from '@/lib/api-client';
import {
  Driver,
  DriverStatus,
  DriverLocation,
  CreateDriverPayload,
  AdminDelivery,
  RawDeliveryAssignment,
  AssignDeliveryPayload,
  ChowdeckFeeEstimate,
  DispatchChowdeckPayload,
  ChowdeckDispatchResponse,
  ChowdeckTrackingStatus,
  CancelChowdeckPayload,
  ChowdeckCancelResponse,
  DeliveryZone,
  CreateDeliveryZonePayload,
  UpdateDeliveryZonePayload,
  DeliveryPartner,
  UpdateDeliveryPartnerPayload,
  DeliveryPartnersSummary,
} from '@/types/delivery.types';

export const deliveryService = {
  // ── CONFIRMED LIVE — Admin Drivers ─────────────────────────────────

  createDriver: (payload: CreateDriverPayload) =>
    apiClient.post<Driver>('/admin/drivers', payload).then((r) => r.data),

  getDrivers: (status?: DriverStatus) =>
    apiClient.get<Driver[]>('/admin/drivers', { params: { status } }).then((r) => r.data),

  getDriverByUserId: (userId: string) =>
    apiClient.get<Driver>(`/admin/drivers/${userId}`).then((r) => r.data),

  getDriverLocation: (userId: string) =>
    apiClient.get<DriverLocation>(`/admin/drivers/${userId}/location`).then((r) => r.data),

  // ── CONFIRMED LIVE — Admin Deliveries ──────────────────────────────

  getActiveDeliveries: () =>
    apiClient.get<AdminDelivery[]>('/admin/deliveries/active').then((r) => r.data),

  assignDelivery: (orderId: string, payload: AssignDeliveryPayload) =>
    apiClient
      .post<RawDeliveryAssignment>(`/admin/deliveries/${orderId}/assign`, payload)
      .then((r) => r.data),

  estimateChowdeckFee: (orderId: string) =>
    apiClient
      .post<ChowdeckFeeEstimate>(`/admin/deliveries/${orderId}/chowdeck/estimate`)
      .then((r) => r.data),

  
  dispatchViaChowdeck: (orderId: string, payload: DispatchChowdeckPayload) =>
    apiClient
      .post<ChowdeckDispatchResponse>(`/admin/deliveries/${orderId}/chowdeck/dispatch`, payload)
      .then((r) => r.data),

  trackChowdeckDelivery: (reference: string) =>
    apiClient
      .get<ChowdeckTrackingStatus>(`/admin/deliveries/chowdeck/${reference}`)
      .then((r) => r.data),

  // FIXED — was typed as { success: boolean }, unconfirmed. chowdeckService
  // .cancelDelivery()'s return shape isn't known; don't assume a success flag.
  cancelChowdeckDelivery: (reference: string, payload: CancelChowdeckPayload) =>
    apiClient
      .post<ChowdeckCancelResponse>(`/admin/deliveries/chowdeck/${reference}/cancel`, payload)
      .then((r) => r.data),

 

  getDeliveryZones: (branchId?: string) =>
    apiClient.get<DeliveryZone[]>('/admin/delivery-zones', { params: { branchId } }).then((r) => r.data),

  createDeliveryZone: (payload: CreateDeliveryZonePayload) =>
    apiClient.post<DeliveryZone>('/admin/delivery-zones', payload).then((r) => r.data),

  updateDeliveryZone: (id: string, payload: UpdateDeliveryZonePayload) =>
    apiClient.patch<DeliveryZone>(`/admin/delivery-zones/${id}`, payload).then((r) => r.data),

  deleteDeliveryZone: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/admin/delivery-zones/${id}`).then((r) => r.data),

  // ── CONFIRMED LIVE — Delivery Partners ─────────────────────────────
  // GET list, PATCH settings, and PATCH toggle all verified against
  // Swagger and match exactly.

  getDeliveryPartners: () =>
    apiClient.get<DeliveryPartner[]>('/admin/delivery-partners').then((r) => r.data),

  
  getDeliveryPartnersSummary: () =>
    apiClient.get<DeliveryPartnersSummary>('/admin/delivery-partners/summary').then((r) => r.data),

  updateDeliveryPartner: (id: string, payload: UpdateDeliveryPartnerPayload) =>
    apiClient.patch<DeliveryPartner>(`/admin/delivery-partners/${id}`, payload).then((r) => r.data),

  toggleDeliveryPartner: (id: string) =>
    apiClient.patch<DeliveryPartner>(`/admin/delivery-partners/${id}/toggle`).then((r) => r.data),
};