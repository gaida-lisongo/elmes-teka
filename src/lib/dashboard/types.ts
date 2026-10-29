export interface CurrencyTotal {
  currency: string;
  amount: number;
}
export interface ExerciseOption {
  id: string;
  slug: string;
  label: string;
  startDate: string;
  endDate: string;
  status: string;
}
export interface DashboardChartSeries {
  name: string;
  currency: string;
  data: number[];
}
export interface ExerciseBalance {
  anneeId: string;
  slug: string;
  label: string;
  currencies: Array<{
    currency: string;
    revenue: number;
    expenses: number;
    result: number;
  }>;
  transactionCount: number;
  expenseCount: number;
}
export interface ProductRankingItem {
  productId: string;
  rank: number;
  designation: string;
  code: string;
  category: string;
  photo: string | null;
  quantitySold: number;
  orderCount: number;
  revenue: number;
  currency: string;
}
export interface TodayMetrics {
  revenue: { totals: CurrencyTotal[]; transactionCount: number };
  expenses: { totals: CurrencyTotal[]; expenseCount: number };
}
export interface StoreMetric {
  storeId: string;
  designation: string;
  todayRevenue: CurrencyTotal[];
  todayOrderCount: number;
  activeSalersToday: number;
}
export interface DashboardAlert {
  type: "pending_orders" | "supply_requests";
  message: string;
  count: number;
}
export interface TopClientItem {
  clientId: string;
  name: string;
  phone: string;
  totalRevenue: number;
  currency: string;
  orderCount: number;
}
export interface DashboardData {
  scope: "TENANT" | "SALER";
  metrics: {
    revenue: { totals: CurrencyTotal[]; transactionCount: number };
    expenses: { totals: CurrencyTotal[]; expenseCount: number };
  };
  today: TodayMetrics;
  stores: StoreMetric[];
  alerts: DashboardAlert[];
  topClients: TopClientItem[];
  exercises: ExerciseOption[];
  selectedChartExercise: string | null;
  selectedTargetExercise: string | null;
  selectedRankingExercise: string | null;
  chart: DashboardChartSeries[];
  balances: ExerciseBalance[];
  ranking: {
    items: ProductRankingItem[];
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    search: string;
  };
}
