export interface DashboardCategoryCount {
  categoryId: string | null;
  name: string;
  nameAr: string;
  count: number;
}

export interface DashboardActivity {
  productId: string;
  productName: string;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  userName: string | null;
  createdOnUtc: string;
}

export interface DashboardSummary {
  totalProducts: number;
  publishedProducts: number;
  draftProducts: number;
  inactiveProducts: number;
  archivedProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  lowStockThreshold: number;
  totalCategories: number;
  totalBrands: number;
  productsByCategory: DashboardCategoryCount[];
  recentActivities: DashboardActivity[];
}
