// store/useOrderStore.ts
import { create } from 'zustand';
import { toast } from 'sonner';
import { orderService } from '@/services/order.service';
import { AdminOrder, AdminOrderFilters, UpdateOrderStatusPayload } from '@/types/orders';

function extractErrorMessage(error: unknown, fallback: string) {
  const anyErr = error as any;
  return anyErr?.response?.data?.message ?? anyErr?.message ?? fallback;
}

interface OrderState {
  orders: AdminOrder[] | null;
  ordersLoading: boolean;
  ordersError: boolean;

  orderDetail: AdminOrder | null;
  orderDetailLoading: boolean;
  orderDetailError: boolean;

  isUpdatingStatus: boolean;

  fetchOrders: (filters?: AdminOrderFilters) => Promise<void>;
  fetchOrderDetails: (id: string) => Promise<void>;
  clearOrderDetail: () => void;
  updateOrderStatus: (id: string, payload: UpdateOrderStatusPayload) => Promise<boolean>;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: null,
  ordersLoading: false,
  ordersError: false,

  orderDetail: null,
  orderDetailLoading: false,
  orderDetailError: false,

  isUpdatingStatus: false,

  fetchOrders: async (filters = {}) => {
    set({ ordersLoading: true, ordersError: false });
    try {
      const orders = await orderService.getAdminOrders(filters);
      set({ orders, ordersLoading: false });
    } catch (error) {
      set({ ordersLoading: false, ordersError: true });
      toast.error(extractErrorMessage(error, 'Could not load orders'));
    }
  },

  fetchOrderDetails: async (id) => {
    set({ orderDetailLoading: true, orderDetailError: false });
    try {
      const orderDetail = await orderService.getAdminOrderDetails(id);
      set({ orderDetail, orderDetailLoading: false });
    } catch (error) {
      set({ orderDetailLoading: false, orderDetailError: true });
      toast.error(extractErrorMessage(error, 'Could not load order details'));
    }
  },

  clearOrderDetail: () => set({ orderDetail: null, orderDetailError: false }),

  updateOrderStatus: async (id, payload) => {
    const { orders, orderDetail } = get();

    // Snapshot for rollback
    const previousOrders = orders;
    const previousDetail = orderDetail;

    // Optimistic update — apply immediately, before the request resolves
    set({
      isUpdatingStatus: true,
      orders: orders
        ? orders.map((o) => (o.id === id ? { ...o, status: payload.status } : o))
        : orders,
      orderDetail:
        orderDetail && orderDetail.id === id
          ? { ...orderDetail, status: payload.status }
          : orderDetail,
    });

    try {
      const updated = await orderService.updateStatus(id, payload);
      // Reconcile with the server's actual response (in case it includes
      // other server-computed fields we don't know about optimistically)
      set((state) => ({
        isUpdatingStatus: false,
        orders: state.orders
          ? state.orders.map((o) => (o.id === id ? { ...o, ...updated } : o))
          : state.orders,
        orderDetail:
          state.orderDetail && state.orderDetail.id === id
            ? { ...state.orderDetail, ...updated }
            : state.orderDetail,
      }));
      toast.success('Order status updated');
      return true;
    } catch (error) {
      // Roll back to the pre-optimistic snapshot
      set({
        isUpdatingStatus: false,
        orders: previousOrders,
        orderDetail: previousDetail,
      });
      toast.error(extractErrorMessage(error, 'Could not update order status'));
      return false;
    }
  },
}));