import { create } from 'zustand';
import { toast } from 'sonner';
import { suppliersService } from '@/services/suppliers.service';
import { Supplier, SupplierDetail, AddSupplierPayload } from '@/types/suppliers.types';

function extractErrorMessage(error: unknown, fallback: string) {
  const anyErr = error as any;
  return anyErr?.response?.data?.message ?? anyErr?.message ?? fallback;
}

interface SuppliersState {
  suppliers: Supplier[] | null;
  suppliersLoading: boolean;
  suppliersError: boolean;

  detail: SupplierDetail | null;
  detailLoading: boolean;
  detailError: boolean;

  isSaving: boolean;

  fetchSuppliers: (branchId?: string) => Promise<void>;
  fetchSupplierDetail: (id: string, branchId?: string) => Promise<void>;
  clearDetail: () => void;
  addSupplier: (payload: AddSupplierPayload, branchId?: string) => Promise<Supplier | null>;
}

export const useSuppliersStore = create<SuppliersState>((set) => ({
  suppliers: null,
  suppliersLoading: false,
  suppliersError: false,

  detail: null,
  detailLoading: false,
  detailError: false,

  isSaving: false,

  fetchSuppliers: async (branchId) => {
    set({ suppliersLoading: true, suppliersError: false });
    try {
      const suppliers = await suppliersService.getSuppliers(branchId);
      set({ suppliers, suppliersLoading: false });
    } catch {
      set({ suppliersLoading: false, suppliersError: true });
    }
  },

  fetchSupplierDetail: async (id, branchId) => {
    set({ detailLoading: true, detailError: false, detail: null });
    try {
      const detail = await suppliersService.getSupplierDetail(id, branchId);
      set({ detail, detailLoading: false });
    } catch {
      set({ detailLoading: false, detailError: true });
    }
  },

  clearDetail: () => set({ detail: null, detailError: false }),

  addSupplier: async (payload, branchId) => {
    set({ isSaving: true });
    try {
      const supplier = await suppliersService.addSupplier({ ...payload, branchId });
      set((state) => ({
        suppliers: state.suppliers ? [...state.suppliers, supplier] : [supplier],
        isSaving: false,
      }));
      toast.success('Supplier added.');
      return supplier;
    } catch (error) {
      set({ isSaving: false });
      toast.error(extractErrorMessage(error, 'Could not add supplier.'));
      return null;
    }
  },
}));