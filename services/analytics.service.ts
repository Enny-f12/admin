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
  // NOT YET BUILT — backend request doc #1
  getTimeseries: (filters: AnalyticsFilters) =>
    apiClient.get<AnalyticsDataPoint[]>('/admin/analytics/timeseries', { params: filters }).then((r) => r.data),

  // NOT YET BUILT — backend request doc #2
  getSummary: (filters: AnalyticsFilters) =>
    apiClient.get<AnalyticsSummary>('/admin/analytics/summary', { params: filters }).then((r) => r.data),

  // NOT YET BUILT — backend request doc #3
  getTopItems: (filters: AnalyticsFilters & { limit?: number }) =>
    apiClient.get<TopItem[]>('/admin/analytics/top-items', { params: filters }).then((r) => r.data),

  // NOT YET BUILT — backend request doc #4
  exportReport: (filters: ExportReportFilters) =>
    apiClient
      .get('/admin/analytics/export', { params: filters, responseType: 'blob' })
      .then((r) => r.data as Blob),
};