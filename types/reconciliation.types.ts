export interface ReconciliationItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  system: number;
  physical: number;
  variance: number;
}

export interface StaffMember {
  id: string;
  name: string;
}

export interface AdjustReconciliationPayload {
  newValue: number;
  reason: string;
  notes: string;
}

export interface SyncReconciliationPayload {
  date: string;
  conductedBy: string;
  reasonForVariance: string;
}

export interface SyncReconciliationResponse {
  syncedCount: number;
  syncedAt: string;
}