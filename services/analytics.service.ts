// services/analytics.service.ts
import { apiClient } from '@/lib/api-client';
import {
  AnalyticsDataPoint,
  AnalyticsSummary,
  TopItem,
  AnalyticsFilters,
  ExportReportFilters,
} from '@/types/analytics.types';

export const analyticsService = {
  // ── CONFIRMED LIVE — GET /admin/analytics/timeseries ──
  getTimeseries: (filters: AnalyticsFilters) =>
    apiClient.get<AnalyticsDataPoint[]>('/admin/analytics/timeseries', { params: filters }).then((r) => r.data),

  // ── CONFIRMED LIVE — GET /admin/analytics/summary ──
  getSummary: (filters: AnalyticsFilters) =>
    apiClient.get<AnalyticsSummary>('/admin/analytics/summary', { params: filters }).then((r) => r.data),

  // ── CONFIRMED LIVE — GET /admin/analytics/top-items ──
  getTopItems: (filters: AnalyticsFilters & { limit?: number }) =>
    apiClient.get<TopItem[]>('/admin/analytics/top-items', { params: filters }).then((r) => r.data),

  // ── CONFIRMED LIVE — GET /admin/analytics/export ──
  exportReport: (filters: ExportReportFilters) =>
    apiClient
      .get('/admin/analytics/export', { params: filters, responseType: 'blob' })
      .then((r) => r.data as Blob),
};