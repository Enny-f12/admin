// types/staff.ts
export type StaffStatus = "ACTIVE" | "OFFLINE";

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: StaffStatus;
  lastSeenAt: string | null; // ISO date string; null if never logged in
  branches: string[];        // branch IDs
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