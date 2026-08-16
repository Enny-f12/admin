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

  isUpdatingStatus: boolean;

  fetchOrders: (filters?: AdminOrderFilters) => Promise<void>;
  getOrderById: (id: string) => AdminOrder | null;
  updateOrderStatus: (id: string, payload: UpdateOrderStatusPayload) => Promise<boolean>;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: null,
  ordersLoading: false,
  ordersError: false,

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

  // No network call — the list response already has everything the
  // detail modal renders (customer, items, totals, delivery address).
  // See backend request doc, Orders #4.
  getOrderById: (id) => {
    const { orders } = get();
    return orders?.find((o) => o.id === id) ?? null;
  },

  updateOrderStatus: async (id, payload) => {
    const { orders } = get();
    const previousOrders = orders;

    // Optimistic update — apply immediately, before the request resolves
    set({
      isUpdatingStatus: true,
      orders: orders ? orders.map((o) => (o.id === id ? { ...o, status: payload.status } : o)) : orders,
    });

    try {
      const updated = await orderService.updateStatus(id, payload);
      set((state) => ({
        isUpdatingStatus: false,
        orders: state.orders ? state.orders.map((o) => (o.id === id ? { ...o, ...updated } : o)) : state.orders,
      }));
      toast.success('Order status updated');
      return true;
    } catch (error) {
      set({ isUpdatingStatus: false, orders: previousOrders });
      toast.error(extractErrorMessage(error, 'Could not update order status'));
      return false;
    }
  },
}));