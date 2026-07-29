import { create } from 'zustand';
import { toast } from 'sonner';
import { paymentsAdminService } from '@/services/payments-admin.service';
import { AdminOrder } from '@/types/orders';
import {
  RecordPaymentPayload,
  POSIntegrationStatus,
  POSOrder,
  CreateManualSalePayload,
} from '@/types/payment-admin.types';

function extractErrorMessage(error: unknown, fallback: string) {
  const anyErr = error as any;
  return anyErr?.response?.data?.message ?? anyErr?.message ?? fallback;
}

interface PaymentsAdminState {
  loadedOrder: AdminOrder | null;
  orderLookupLoading: boolean;
  orderLookupError: boolean;
  isRecordingPayment: boolean;

  posStatus: POSIntegrationStatus | null;
  posStatusLoading: boolean;
  posStatusError: boolean;

  posOrders: POSOrder[] | null;
  posOrdersLoading: boolean;
  posOrdersError: boolean;
  isTestingConnection: boolean;

  isCreatingSale: boolean;
  lastSaleId: string | null;
  isEmailingReceipt: boolean;

  lookupOrder: (orderNumber: string) => Promise<void>;
  recordPayment: (payload: RecordPaymentPayload) => Promise<boolean>;

  fetchPOSStatus: () => Promise<void>;
  fetchPOSOrders: () => Promise<void>;
  toggleVerified: (id: string, verified: boolean) => Promise<void>;
  testConnection: () => Promise<void>;

  createManualSale: (payload: CreateManualSalePayload) => Promise<boolean>;
  emailReceipt: () => Promise<void>;
}

export const usePaymentsAdminStore = create<PaymentsAdminState>((set, get) => ({
  loadedOrder: null,
  orderLookupLoading: false,
  orderLookupError: false,
  isRecordingPayment: false,

  posStatus: null,
  posStatusLoading: false,
  posStatusError: false,

  posOrders: null,
  posOrdersLoading: false,
  posOrdersError: false,
  isTestingConnection: false,

  isCreatingSale: false,
  lastSaleId: null,
  isEmailingReceipt: false,

  lookupOrder: async (orderNumber) => {
    set({ orderLookupLoading: true, orderLookupError: false, loadedOrder: null });
    try {
      const matches = await paymentsAdminService.lookupOrder(orderNumber);
      const order = matches.find((o) => o.orderNumber === orderNumber) ?? matches[0] ?? null;
      set({ loadedOrder: order, orderLookupLoading: false });
      if (!order) toast.error('No order found with that number.');
    } catch (error) {
      set({ orderLookupLoading: false, orderLookupError: true });
      toast.error(extractErrorMessage(error, 'Could not look up order.'));
    }
  },

  recordPayment: async (payload) => {
    set({ isRecordingPayment: true });
    try {
      await paymentsAdminService.recordPayment(payload);
      set({ isRecordingPayment: false, loadedOrder: null });
      toast.success('Payment recorded — order closed.');
      return true;
    } catch (error) {
      set({ isRecordingPayment: false });
      toast.error(extractErrorMessage(error, 'Could not record payment.'));
      return false;
    }
  },

  fetchPOSStatus: async () => {
    set({ posStatusLoading: true, posStatusError: false });
    try {
      const posStatus = await paymentsAdminService.getPOSStatus();
      set({ posStatus, posStatusLoading: false });
    } catch {
      set({ posStatusLoading: false, posStatusError: true });
    }
  },

  fetchPOSOrders: async () => {
    set({ posOrdersLoading: true, posOrdersError: false });
    try {
      const posOrders = await paymentsAdminService.getPOSOrders();
      set({ posOrders, posOrdersLoading: false });
    } catch {
      set({ posOrdersLoading: false, posOrdersError: true });
    }
  },

  toggleVerified: async (id, verified) => {
    const { posOrders } = get();
    const previous = posOrders;
    set({
      posOrders: posOrders ? posOrders.map((o) => (o.id === id ? { ...o, verified } : o)) : posOrders,
    });
    try {
      await paymentsAdminService.verifyPOSOrder(id, verified);
    } catch (error) {
      set({ posOrders: previous });
      toast.error(extractErrorMessage(error, 'Could not update verification.'));
    }
  },

  testConnection: async () => {
    set({ isTestingConnection: true });
    try {
      const { success, message } = await paymentsAdminService.testPOSConnection();
      set({ isTestingConnection: false });
      success ? toast.success(message) : toast.error(message);
    } catch (error) {
      set({ isTestingConnection: false });
      toast.error(extractErrorMessage(error, 'Connection test failed.'));
    }
  },

  createManualSale: async (payload) => {
    set({ isCreatingSale: true });
    try {
      const { id } = await paymentsAdminService.createManualSale(payload);
      set({ isCreatingSale: false, lastSaleId: id });
      toast.success('Sale recorded.');
      return true;
    } catch (error) {
      set({ isCreatingSale: false });
      toast.error(extractErrorMessage(error, 'Could not record sale.'));
      return false;
    }
  },

  emailReceipt: async () => {
    const { lastSaleId } = get();
    if (!lastSaleId) return;
    set({ isEmailingReceipt: true });
    try {
      await paymentsAdminService.emailReceipt(lastSaleId);
      set({ isEmailingReceipt: false });
      toast.success('Receipt emailed.');
    } catch (error) {
      set({ isEmailingReceipt: false });
      toast.error(extractErrorMessage(error, 'Could not email receipt.'));
    }
  },
}));