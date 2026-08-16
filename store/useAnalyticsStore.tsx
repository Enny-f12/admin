// store/useAnalyticsStore.ts
import { create } from 'zustand';
import { toast } from 'sonner';
import { analyticsService } from '@/services/analytics.service';
import {
  AnalyticsDataPoint,
  AnalyticsSummary,
  TopItem,
  AnalyticsFilters,
  ExportReportFilters,
} from '@/types/analytics.types';

function extractErrorMessage(error: unknown, fallback: string) {
  const anyErr = error as any;
  return anyErr?.response?.data?.message ?? anyErr?.message ?? fallback;
}

interface AnalyticsState {
  timeseries: AnalyticsDataPoint[] | null;
  timeseriesLoading: boolean;
  timeseriesError: boolean;

  summary: AnalyticsSummary | null;
  summaryLoading: boolean;
  summaryError: boolean;

  topItems: TopItem[] | null;
  topItemsLoading: boolean;
  topItemsError: boolean;

  isExporting: boolean;

  fetchTimeseries: (filters: AnalyticsFilters) => Promise<void>;
  fetchSummary: (filters: AnalyticsFilters) => Promise<void>;
  fetchTopItems: (filters: AnalyticsFilters & { limit?: number }) => Promise<void>;
  exportReport: (filters: ExportReportFilters) => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  timeseries: null,
  timeseriesLoading: false,
  timeseriesError: false,

  summary: null,
  summaryLoading: false,
  summaryError: false,

  topItems: null,
  topItemsLoading: false,
  topItemsError: false,

  isExporting: false,

  fetchTimeseries: async (filters) => {
    set({ timeseriesLoading: true, timeseriesError: false });
    try {
      const timeseries = await analyticsService.getTimeseries(filters);
      set({ timeseries, timeseriesLoading: false });
    } catch {
      set({ timeseriesLoading: false, timeseriesError: true });
    }
  },

  fetchSummary: async (filters) => {
    set({ summaryLoading: true, summaryError: false });
    try {
      const summary = await analyticsService.getSummary(filters);
      set({ summary, summaryLoading: false });
    } catch {
      set({ summaryLoading: false, summaryError: true });
    }
  },

  fetchTopItems: async (filters) => {
    set({ topItemsLoading: true, topItemsError: false });
    try {
      const topItems = await analyticsService.getTopItems(filters);
      set({ topItems, topItemsLoading: false });
    } catch {
      set({ topItemsLoading: false, topItemsError: true });
    }
  },

  exportReport: async (filters) => {
    set({ isExporting: true });
    try {
      const blob = await analyticsService.exportReport(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${filters.range}.${filters.format ?? 'csv'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      set({ isExporting: false });
      toast.success('Report exported.');
    } catch (error) {
      set({ isExporting: false });
      toast.error(extractErrorMessage(error, 'Could not export report.'));
    }
  },
}));