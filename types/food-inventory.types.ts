export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export interface FoodInventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  pack: number;
  stock: number;
  threshold: number;
  status: StockStatus;
}

export interface InventoryStats {
  totalItems: number;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
}

export interface FoodInventoryResponse {
  items: FoodInventoryItem[];
  total: number;
  stats: InventoryStats;
}

export interface StatusBanner {
  lastUpdatedAt: string;
  lastUpdatedByName: string;
  nextCountDueAt: string;
}