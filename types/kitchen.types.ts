export type OrderSource = 'Mobile App' | 'POS' | 'Walk-In' | 'Phone' | 'Delivery' | 'Dine-In' | 'Takeaway';

export interface KitchenOrderItem {
  name: string;
  qty: number;
}

export interface KitchenOrder {
  id: string;
  orderNumber: string;
  source: OrderSource;
  createdAt: string; // ISO
  dueAt: string;      // ISO
  items: KitchenOrderItem[];
  special: string | null;
}

export interface CompletedKitchenOrder {
  id: string;
  orderNumber: string;
  completedAt: string; // ISO
  source: OrderSource;
}

export interface StationRouting {
  grillTvUrl: string;
  pastryTvUrl: string;
  expoTvUrl: string;
  grillAssignment: string;
  pastryAssignment: string;
}

export interface PrinterBackupSettings {
  enabled: boolean;
  printerIp: string;
  fallbackAfterMinutes: number;
}

export interface KitchenDisplaySettings {
  tvDisplayUrl: string;
  showOrderSource: boolean;
  showPrepTime: boolean;
  urgentThresholdMinutes: number;
  completedForMinutes: number;
  refreshIntervalSeconds: number;
  audioAlertVolumePercent: number;
  stations: StationRouting;
  printerBackup: PrinterBackupSettings;
}

export type UpdateKitchenSettingsPayload = KitchenDisplaySettings;