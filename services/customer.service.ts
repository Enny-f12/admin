// services/customer.service.ts
import { apiClient } from '@/lib/api-client';
import { AdminCustomer, AdminCustomersFilters, AdminCustomersResponse } from '@/types/customer';

export const customerService = {
  getCustomers: (filters: AdminCustomersFilters = {}) =>
    apiClient
      .get<AdminCustomersResponse>('/admin/customers', { params: filters })
      .then((r) => r.data),

  // Not wired into the UI yet — kept here so it's ready once the endpoint exists.
  getCustomerById: (id: string) =>
    apiClient.get<AdminCustomer>(`/admin/customers/${id}`).then((r) => r.data),
};