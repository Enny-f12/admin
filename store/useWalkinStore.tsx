import { create } from 'zustand';
import { toast } from 'sonner';
import { walkInService } from '@/services/walk-in.service';
import {
  WalkInCustomer,
  MenuItem,
  CreateWalkInOrderPayload,
  CreateWalkInCustomerPayload,
  BlacklistEntry,
  AddToBlacklistPayload,
} from '@/types/walk-in.types';

function extractErrorMessage(error: unknown, fallback: string) {
  const anyErr = error as any;
  return anyErr?.response?.data?.message ?? anyErr?.message ?? fallback;
}

interface WalkInState {
  customers: WalkInCustomer[] | null;
  customersLoading: boolean;
  customersError: boolean;

  menuItems: MenuItem[] | null;
  menuItemsLoading: boolean;
  menuItemsError: boolean;

  blacklist: BlacklistEntry[] | null;
  blacklistLoading: boolean;
  blacklistError: boolean;

  isCreatingCustomer: boolean;
  isCreatingOrder: boolean;
  isSubmittingBlacklist: boolean;

  searchCustomers: (search: string) => Promise<void>;
  createCustomer: (payload: CreateWalkInCustomerPayload) => Promise<WalkInCustomer | null>;
  searchMenuItems: (search: string) => Promise<void>;
  createOrder: (payload: CreateWalkInOrderPayload) => Promise<{ id: string; orderNumber: string } | null>;
  fetchBlacklist: () => Promise<void>;
  addToBlacklist: (payload: AddToBlacklistPayload) => Promise<boolean>;
  removeFromBlacklist: (id: string) => Promise<boolean>;
}

export const useWalkInStore = create<WalkInState>((set) => ({
  customers: null,
  customersLoading: false,
  customersError: false,

  menuItems: null,
  menuItemsLoading: false,
  menuItemsError: false,

  blacklist: null,
  blacklistLoading: false,
  blacklistError: false,

  isCreatingCustomer: false,
  isCreatingOrder: false,
  isSubmittingBlacklist: false,

  searchCustomers: async (search) => {
    set({ customersLoading: true, customersError: false });
    try {
      const customers = await walkInService.searchCustomers(search);
      set({ customers, customersLoading: false });
    } catch {
      set({ customersLoading: false, customersError: true });
    }
  },

  createCustomer: async (payload) => {
    set({ isCreatingCustomer: true });
    try {
      const customer = await walkInService.createCustomer(payload);
      set((state) => ({
        isCreatingCustomer: false,
        customers: state.customers ? [...state.customers, customer] : [customer],
      }));
      return customer;
    } catch (error) {
      set({ isCreatingCustomer: false });
      toast.error(extractErrorMessage(error, 'Could not create customer.'));
      return null;
    }
  },

  searchMenuItems: async (search) => {
    set({ menuItemsLoading: true, menuItemsError: false });
    try {
      const menuItems = await walkInService.searchMenuItems(search);
      set({ menuItems, menuItemsLoading: false });
    } catch {
      set({ menuItemsLoading: false, menuItemsError: true });
    }
  },

  createOrder: async (payload) => {
    set({ isCreatingOrder: true });
    try {
      const result = await walkInService.createOrder(payload);
      set({ isCreatingOrder: false });
      return result;
    } catch (error) {
      set({ isCreatingOrder: false });
      toast.error(extractErrorMessage(error, 'Could not create order.'));
      return null;
    }
  },

  // NOTE: backend currently returns 500 here — request payload has been verified
  // against Swagger (no params) so this is a server-side bug. Surfacing the
  // real error message via toast (instead of failing silently) until the
  // response schema/fix is confirmed.
  fetchBlacklist: async () => {
    set({ blacklistLoading: true, blacklistError: false });
    try {
      const blacklist = await walkInService.getBlacklist();
      set({ blacklist, blacklistLoading: false });
    } catch (error) {
      set({ blacklistLoading: false, blacklistError: true });
      toast.error(extractErrorMessage(error, 'Could not load blacklist.'));
    }
  },

  addToBlacklist: async (payload) => {
    set({ isSubmittingBlacklist: true });
    try {
      const entry = await walkInService.addToBlacklist(payload);
      set((state) => ({
        isSubmittingBlacklist: false,
        blacklist: state.blacklist ? [...state.blacklist, entry] : [entry],
      }));
      toast.success('Customer blacklisted.');
      return true;
    } catch (error) {
      set({ isSubmittingBlacklist: false });
      toast.error(extractErrorMessage(error, 'Could not blacklist customer.'));
      return false;
    }
  },

  removeFromBlacklist: async (id) => {
    try {
      await walkInService.removeFromBlacklist(id);
      set((state) => ({
        blacklist: state.blacklist ? state.blacklist.filter((b) => b.id !== id) : state.blacklist,
      }));
      toast.success('Customer unblocked.');
      return true;
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Could not unblock customer.'));
      return false;
    }
  },
}));