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

export interface UpdateItemCostPricePayload {
  costPrice: number;
}

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