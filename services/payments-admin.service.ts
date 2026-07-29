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
  // Reuses GET /admin/orders?search, once the `search` param ships — see Orders request doc #2
  lookupOrder: (orderNumber: string) =>
    apiClient
      .get<AdminOrder[]>('/admin/orders', { params: { search: orderNumber, searchBy: 'orderId' } })
      .then((r) => r.data),

  // NOT YET BUILT — backend request doc, Payments #1
  recordPayment: (payload: RecordPaymentPayload) =>
    apiClient.post<RecordPaymentResponse>('/admin/payments/record', payload).then((r) => r.data),

  // NOT YET BUILT — backend request doc, Payments #2
  getPOSStatus: () => apiClient.get<POSIntegrationStatus>('/admin/pos-integration/status').then((r) => r.data),

  // NOT YET BUILT — backend request doc, Payments #3
  getPOSOrders: () => apiClient.get<POSOrder[]>('/admin/pos-integration/orders').then((r) => r.data),

  // NOT YET BUILT — backend request doc, Payments #4
  verifyPOSOrder: (id: string, verified: boolean) =>
    apiClient.patch<POSOrder>(`/admin/pos-integration/orders/${id}/verify`, { verified }).then((r) => r.data),

  // NOT YET BUILT — backend request doc, Payments #5
  testPOSConnection: () =>
    apiClient.post<{ success: boolean; message: string }>('/admin/pos-integration/test-connection').then((r) => r.data),

  // NOT YET BUILT — backend request doc, Payments #6
  createManualSale: (payload: CreateManualSalePayload) =>
    apiClient.post<CreateManualSaleResponse>('/admin/sales/manual', payload).then((r) => r.data),

  // NOT YET BUILT — backend request doc, Payments #7
  emailReceipt: (saleId: string) =>
    apiClient.post<{ success: boolean }>(`/admin/sales/${saleId}/email-receipt`).then((r) => r.data),
};