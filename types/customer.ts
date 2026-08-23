export interface AdminCustomer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: string | null; 
  createdAt: string;          
}

export interface AdminCustomersFilters {
  search?: string;
  page?: number;
  limit?: number;
  branchId?: string;
}

export interface AdminCustomersResponse {
  data: AdminCustomer[];
  total: number;
  page: number;
  limit: number;
}