// types/morning-count.types.ts

export type ItemStatus = 'Updated' | 'Pending' | 'Out of stock';

export interface MorningCountItem {
  id: string;
  name: string;
  unit: string;
  packSize: string;
  previous: number;
  current: number | null;
  status: ItemStatus | null;
}

export interface MorningCountCategory {
  id: string;
  name: string;
  submitted: boolean;
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
  id: string;
  outletId: string;
  outletName: string;
  date: string;
  counterStaffId: string;
  counterStaffName: string;
  time: string;
  categories: MorningCountCategory[];
  summary: MorningCountSummary;
  draftSavedAt: string | null;
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