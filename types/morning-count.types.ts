// types/morning-count.types.ts

export type ItemStatus = 'Updated' | 'Pending' | 'Out of stock';

export interface MorningCountItem {
  id: string;
  menuItemId: string; 
  name: string;
  unit: string;
  packSize: string;
  previous: number;
  current: number | null;
  status: ItemStatus | null;
  hidden?: boolean; // menu item became unavailable/deleted after a resync — kept, read-only
}

export interface MorningCountCategory {
  id: string;
  name: string;
  // FIX — backend sends `isSubmitted`, not `submitted` (confirmed from the
  // live /morning-count/sheet response). Renamed to match reality.
  isSubmitted: boolean;
  submittedAt: string | null;
  submittedBy: string | null;
  items: MorningCountItem[];
}

export interface MorningCountSummary {
  totalUpdated: number;
  totalPending: number;
  totalOutOfStock: number;
}

export interface MorningCountSheet {
  outletId: string;
  id: string;
  
  branchId: string;
  date: string;
  categories: MorningCountCategory[];
  OutletId?: string; 
  outletName?: string;
  counterStaffId?: string;
  counterStaffName?: string;
  time?: string;
  summary?: MorningCountSummary;
  draftSavedAt?: string | null;
}

export interface UpdateItemCurrentPayload {
  current: number | null;
}

export interface UpdateItemUomPayload {
  unit: string;
  packSize: string;
}

export interface PendingCategorySummary {
  id: string;
  name: string;
}

// ── B. Morning Count alerts ──

export type MorningCountBranchStatus = 'NOT_STARTED' | 'INCOMPLETE' | 'COMPLETE';

export interface MorningCountAlertResponse {
  branchId: string;
  branchName: string;
  date: string;
  status: MorningCountBranchStatus;
  categoriesTotal: number;
  categoriesSubmitted: number;
  cutoffTime: string;
  isOverdue: boolean;
  minutesOverdue: number;
  lastActivityAt: string | null;
}

export interface MorningCountAlertsFilters {
  vendorId: string;
  date: string;
  cutoffTime?: string; // defaults server-side to "09:00" if omitted
}

// ── C. Audit log ──

export interface MorningCountAuditEntryResponse {
  id: string;
  staffId: string;
  staffName: string;
  staffEmail: string;
  branchId: string;
  branchName: string;
  date: string;
  time: string;
  categoryName: string;
  itemsUpdated: string[];
  totalItemsUpdated: number;
  submittedAt: string;
}

export interface MorningCountAuditLogsResponse {
  items: MorningCountAuditEntryResponse[];
  total: number;
}

export interface AuditLogFilters {
  branchId?: string;
  staffId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}