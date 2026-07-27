import { apiClient } from '@/lib/api-client';
import { Supplier, SupplierDetail, AddSupplierPayload } from '@/types/suppliers.types';

export const suppliersService = {
  // NOT YET BUILT (extension) — backend request doc A1
  getSuppliers: () => apiClient.get<Supplier[]>('/admin/suppliers').then((r) => r.data),

  // NOT YET BUILT — backend request doc A2
  getSupplierDetail: (id: string) =>
    apiClient.get<SupplierDetail>(`/admin/suppliers/${id}`).then((r) => r.data),

  // LIVE — backend request doc A3 (central endpoint, already built)
  addSupplier: (payload: AddSupplierPayload) =>
    apiClient.post<Supplier>('/admin/suppliers', payload).then((r) => r.data),
};