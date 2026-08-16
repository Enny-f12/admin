// store/useCustomerStore.ts
import { create } from 'zustand';
import { toast } from 'sonner';
import { customerService } from '@/services/customer.service';
import { AdminCustomersFilters, AdminCustomer } from '@/types/customer';

function extractErrorMessage(error: unknown, fallback: string) {
  const anyErr = error as any;
  return anyErr?.response?.data?.message ?? anyErr?.message ?? fallback;
}

interface CustomerState {
  customers: AdminCustomer[] | null;
  total: number;
  page: number;
  limit: number;
  isLoading: boolean;
  isError: boolean;

  fetchCustomers: (filters?: AdminCustomersFilters) => Promise<void>;
}

export const useCustomerStore = create<CustomerState>((set) => ({
  customers: null,
  total: 0,
  page: 1,
  limit: 10,
  isLoading: false,
  isError: false,

  fetchCustomers: async (filters = {}) => {
    set({ isLoading: true, isError: false });
    try {
      const res = await customerService.getCustomers(filters);
      set({
        customers: res.data,
        total: res.total,
        page: res.page,
        limit: res.limit,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false, isError: true });
      toast.error(extractErrorMessage(error, 'Could not load customers'));
    }
  },
}));