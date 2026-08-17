// services/payments-admin.service.ts
// NOTE: this file wasn't shared earlier in the conversation, so endpoint
// paths below are inferred from your existing naming conventions
// (/admin/orders, /admin/analytics, etc). Please confirm these match
// the actual backend routes before wiring up.
import { apiClient } from '@/lib/api-client';
import { AdminOrder } from '@/types/orders';
import {
  RecordPaymentPayload,
  RecordPaymentResponse,
  POSIntegrationStatus,
  POSOrder,
  CreateManualSalePayload,
  CreateManualSaleResponse,
} from '@/types/payment-admin.types';

export const paymentsAdminService = {
  // Order.branchId is required in the schema, so this is safely
  // branch-scopable — pass it through so staff can't record a payment
  // against another branch's order by guessing/pasting an order number.
  lookupOrder: (orderNumber: string, branchId?: string) =>
    apiClient
      .get<AdminOrder[]>('/admin/orders', { params: { search: orderNumber, branchId } })
      .then((r) => r.data),

  recordPayment: (payload: RecordPaymentPayload) =>
    apiClient.post<RecordPaymentResponse>('/admin/payments/record', payload).then((r) => r.data),

  // PosSyncedOrder.branchId is optional but present — status/orders can
  // be filtered per branch. Unscoped rows (branchId: null, e.g. from a
  // shared/unassigned terminal) will be excluded once a branch filter
  // is applied — confirm with backend whether that's the desired
  // behavior or whether null rows should always show.
  getPOSStatus: (branchId?: string) =>
    apiClient.get<POSIntegrationStatus>('/admin/pos-integration/status', { params: { branchId } }).then((r) => r.data),

  getPOSOrders: (branchId?: string) =>
    apiClient.get<POSOrder[]>('/admin/pos-integration/orders', { params: { branchId } }).then((r) => r.data),

  verifyPOSOrder: (id: string, verified: boolean) =>
    apiClient.patch<POSOrder>(`/admin/pos-integration/orders/${id}/verify`, { verified }).then((r) => r.data),

  testPOSConnection: () =>
    apiClient.post<{ success: boolean; message: string }>('/admin/pos-integration/test-connection').then((r) => r.data),

  // ManualSale has NO branchId column in the schema at all — there is
  // currently no way to scope manual sales to a branch server-side.
  // branchId is still sent here so the backend can start persisting it
  // once ManualSale.branchId is added via migration; until then this
  // param will be silently ignored (or rejected, per the earlier
  // "Unknown argument" Prisma error pattern) if the backend doesn't
  // accept it yet.
  createManualSale: (payload: CreateManualSalePayload & { branchId?: string }) =>
    apiClient.post<CreateManualSaleResponse>('/admin/manual-sales', payload).then((r) => r.data),

  emailReceipt: (saleId: string) =>
    apiClient.post<{ success: boolean }>(`/admin/manual-sales/${saleId}/email-receipt`).then((r) => r.data),
};