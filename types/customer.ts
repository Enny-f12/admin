// types/customer.ts
export interface AdminCustomer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: string | null; // ISO date string, null if customer has never ordered
  createdAt: string;          // ISO date string — used as "Joined"
}

export interface AdminCustomersFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminCustomersResponse {
  data: AdminCustomer[];
  total: number;
  page: number;
  limit: number;
}