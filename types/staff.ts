export type StaffStatus = "ACTIVE" | "OFFLINE";

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: StaffStatus;
  lastSeenAt: string | null; 
  branches: string[];
  
  invPermissions: string[];
  permissions: string[];
}

export interface CreateStaffPayload {
  name: string;
  email: string;
  phone: string;
  role: string;
  branches: string[];
  invPermissions: string[];
  permissions: string[];
  sendWelcomeEmail: boolean;
}

export interface UpdateStaffPayload {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  branches?: string[];
  invPermissions?: string[];
  permissions?: string[];
}

export interface StaffFilters {
  
  status?: StaffStatus;
}


export interface PermissionsResponse {
  permissions: string[];
  invPermissions: string[];
}

export interface RoleDefaultEntry {
  permissions: string[];
  invPermissions: string[];
}


export interface RoleDefaultsResponse {
  roles: string[];
  defaults: Record<string, RoleDefaultEntry>;
}