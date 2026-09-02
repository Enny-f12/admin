// types/accounting.types.ts

export type MarginItemType = 'Food' | 'Drink';

export interface MetricWithChange {
  amount: number;
  changePercent: number;
}

export interface CogsCategoryBreakdown {
  revenue: number;
  cogs: number;
  marginPercent: number;
}

export interface StockMovement {
  openingStock: number;
  purchases: number;
  cogs: number;
  wastage: number;
  closingStock: number;
}

export interface VatReport {
  totalSales: number;
  vatRate: number;
  vatAmount: number;
  remittanceDueDate: string;
}

export interface PaymentMethodBreakdown {
  mobileApp: number;
  pos: number;
  cash: number;
  bankTransfer: number;
}

export interface WastageCategory {
  amount: number;
  percent: number;
}

export interface WastageBreakdown {
  spoiledExpired: WastageCategory;
  damaged: WastageCategory;
  other: WastageCategory;
}

export interface AccountingSummary {
  totalSales: MetricWithChange;
  cogs: MetricWithChange;
  grossProfit: MetricWithChange;
  wastage: MetricWithChange;
  cogsBreakdown: {
    food: CogsCategoryBreakdown;
    drinks: CogsCategoryBreakdown;
  };
  stockMovement: StockMovement;
  vat: VatReport;
  paymentMethodBreakdown: PaymentMethodBreakdown;
  wastageBreakdown: WastageBreakdown;
}

export interface MarginItem {
  id: string;
  menuItemId: string;   // NEW — joins back to the same MenuItem/StockItem row everywhere else in the app reads. Without this, cost price here and cost price in Stock have no way to be recognized as "the same value."
  itemName: string;
  type: MarginItemType;
  sellingPrice: number;
  costPrice: number;
  marginPercent: number;
}

export interface MarginItemsResponse {
  items: MarginItem[];
  total: number;
}

/*
 * ── REMOVED: UpdateItemCostPricePayload ──
 * Cost price editing no longer has its own accounting-specific payload
 * or endpoint. It now goes through the exact same write as the Stock
 * Inventory page — stockService.updateCostPrice({ itemId, costPerUnit })
 * — so there is exactly one place `costPerUnit` ever gets set, no matter
 * which screen the edit started from. See useAccountingStore.ts.
 */

export interface RecentSale {
  id: string;
  time: string;
  source: string;
  items: string;
  total: number;
  recordedBy: string;
}

export interface RecentSalesResponse {
  items: RecentSale[];
  total: number;
}

export interface AccountingFilters {
  branchId?: string;
  startDate?: string;
  endDate?: string;
}

export type AnalyticsRange = 'today' | 'week' | 'month' | 'year';
export type AnalyticsMetric = 'revenue' | 'orders';

export interface AnalyticsDataPoint {
  label: string;
  revenue: number;
  orders: number;
}

export interface AnalyticsMetricSummary {
  amount: number;
  changePercent: number;
}

export interface AnalyticsOrdersSummary {
  count: number;
  changePercent: number;
}

export interface AnalyticsSummary {
  totalRevenue: AnalyticsMetricSummary;
  totalOrders: AnalyticsOrdersSummary;
  avgOrderValue: AnalyticsMetricSummary;
}

export interface TopItem {
  rank: number;
  menuItemId: string;   // NEW — same joinability fix as MarginItem above
  name: string;
  orders: number;
  revenue: number;
}

export interface AnalyticsFilters {
  branchId?: string;
  range: AnalyticsRange;
}

export interface ExportReportFilters extends AnalyticsFilters {
  format?: 'csv' | 'xlsx';
}