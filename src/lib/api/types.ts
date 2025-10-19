/**
 * API Response Types
 * Matches backend API response structure
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: unknown;
}

export interface Coin {
  id: string;
  symbol: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Currency {
  code: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface PriceData {
  coin?: string;
  currency?: string;
  date?: string;
  price: number;
}

export interface PriceFilters {
  coinIds: string[];
  currencyCodes: string[];
}

export interface PricesMeta {
  count: number;
  granularity: "daily" | "hourly";
  dateFrom: string;
  dateTo: string;
  breakdown: string[];
  filters: PriceFilters;
}

export interface PricesResponse {
  data: PriceData[];
  meta: PricesMeta;
}

export interface CoinMetadata {
  coinId: string;
  name: string;
  symbol: string;
  description: string | null;
  imageUrl: string | null;
  homepageUrl: string | null;
}

export interface DatabaseStats {
  coins: number;
  currencies: number;
  dailyPrices: number;
  hourlyPrices: number;
}

export interface DatabaseHealth {
  status: string;
  type: string;
  stats: DatabaseStats;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  database: DatabaseHealth;
}
