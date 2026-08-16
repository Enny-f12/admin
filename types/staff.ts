export type StaffStatus = "ACTIVE" | "OFFLINE";

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: StaffStatus;
  lastSeenAt: string | null; // ISO date string; null if never logged in
  // CONFIRMED via live response: these are branch NAMES ("Victoria
  // Island"), not IDs, despite what the old comment here said. The
  // create/update DTO wants IDs instead — see staff/page.tsx for the
  // name<->id mapping this requires.
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
  // NOT confirmed via Swagger — added defensively, same pattern used for
  // customers' branchId filter. Confirm the backend actually applies this
  // before relying on it; if it's ignored, the client-side fallback in
  // the page still hides OFFLINE (deactivated) staff either way.
  status?: StaffStatus;
}