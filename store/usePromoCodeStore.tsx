// store/usePromoCodeStore.ts
// ─────────────────────────────────────────────────────────────
// BRANCH: F2 — Store (Promo Codes)
// ─────────────────────────────────────────────────────────────
import { create } from 'zustand';
import { toast } from 'sonner';
import { promoCodeService } from '@/services/promo-code.service';
import {
  PromoCode,
  CreatePromoCodePayload,
  UpdatePromoCodePayload,
} from '@/types/promo.types';

function extractErrorMessage(error: unknown, fallback: string) {
  const anyErr = error as any;
  return anyErr?.response?.data?.message ?? anyErr?.message ?? fallback;
}

interface PromoCodeState {
  promoCodes: PromoCode[] | null;
  promoCodesLoading: boolean;
  promoCodesError: boolean;

  isSavingPromoCode: boolean;
  deletingPromoCodeId: string | null;

  // branchId is now required — GET /admin/promo-codes needs it.
  fetchPromoCodes: (branchId: string) => Promise<void>;
  createPromoCode: (payload: CreatePromoCodePayload) => Promise<boolean>;
  updatePromoCode: (id: string, payload: UpdatePromoCodePayload) => Promise<boolean>;
  deletePromoCode: (id: string) => Promise<void>;
}

export const usePromoCodeStore = create<PromoCodeState>((set, get) => ({
  promoCodes: null,
  promoCodesLoading: false,
  promoCodesError: false,

  isSavingPromoCode: false,
  deletingPromoCodeId: null,

  fetchPromoCodes: async (branchId) => {
    set({ promoCodesLoading: true, promoCodesError: false });
    try {
      const promoCodes = await promoCodeService.getPromoCodes(branchId);
      set({ promoCodes, promoCodesLoading: false });
    } catch {
      set({ promoCodesLoading: false, promoCodesError: true });
    }
  },

  createPromoCode: async (payload) => {
    set({ isSavingPromoCode: true });
    try {
      const promoCode = await promoCodeService.createPromoCode(payload);
      set((state) => ({
        isSavingPromoCode: false,
        promoCodes: state.promoCodes ? [...state.promoCodes, promoCode] : [promoCode],
      }));
      toast.success('Promo code created.');
      return true;
    } catch (error) {
      set({ isSavingPromoCode: false });
      toast.error(extractErrorMessage(error, 'Could not create promo code.'));
      return false;
    }
  },

  updatePromoCode: async (id, payload) => {
    set({ isSavingPromoCode: true });
    try {
      const updated = await promoCodeService.updatePromoCode(id, payload);
      set((state) => ({
        isSavingPromoCode: false,
        promoCodes: state.promoCodes
          ? state.promoCodes.map((p) => (p.id === id ? updated : p))
          : state.promoCodes,
      }));
      toast.success('Promo code updated.');
      return true;
    } catch (error) {
      set({ isSavingPromoCode: false });
      toast.error(extractErrorMessage(error, 'Could not update promo code.'));
      return false;
    }
  },

  deletePromoCode: async (id) => {
    const { promoCodes } = get();
    const previous = promoCodes;
    set({
      deletingPromoCodeId: id,
      promoCodes: promoCodes ? promoCodes.filter((p) => p.id !== id) : promoCodes,
    });
    try {
      await promoCodeService.deletePromoCode(id);
      set({ deletingPromoCodeId: null });
      toast.success('Promo code deleted.');
    } catch (error) {
      set({ promoCodes: previous, deletingPromoCodeId: null });
      toast.error(extractErrorMessage(error, 'Could not delete promo code.'));
    }
  },
}));