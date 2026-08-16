import { apiClient } from '@/lib/api-client';
import { Supplier, SupplierDetail, AddSupplierPayload } from '@/types/suppliers.types';

// getSuppliers / getSupplierDetail corrected from "NOT YET BUILT" --
// both are confirmed live: GET /admin/suppliers already returned real
// data, and /admin/suppliers/{id} is listed in Swagger.
//
// branchId added on all three calls -- each branch has its own supplier
// relationships (deliveries/outstanding scoped per branch). Not yet
// confirmed accepted by the backend -- same open request as the
// stock/drinks branchId asks already sent.
export const suppliersService = {
  getSuppliers: (branchId?: string) =>
    apiClient
      .get<Supplier[]>('/admin/suppliers', { params: { branchId } })
      .then((r) => r.data),

  getSupplierDetail: (id: string, branchId?: string) =>
    apiClient
      .get<SupplierDetail>(`/admin/suppliers/${id}`, { params: { branchId } })
      .then((r) => r.data),

  // LIVE -- backend request doc A3 (central endpoint, already built)
  addSupplier: (payload: AddSupplierPayload & { branchId?: string }) =>
    apiClient.post<Supplier>('/admin/suppliers', payload).then((r) => r.data),
};