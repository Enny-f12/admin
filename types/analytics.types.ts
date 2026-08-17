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