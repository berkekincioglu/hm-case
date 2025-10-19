import type { Decimal } from "@prisma/client/runtime/library";

// Daily price entity - aggregated daily averages
export interface PriceDailyEntity {
  id: number;
  coinId: string;
  currencyCode: string;
  date: Date;
  price: Decimal;
  createdAt: Date;
}

// Hourly price entity - raw granular data
export interface PriceHourlyEntity {
  id: number;
  coinId: string;
  currencyCode: string;
  timestamp: Date;
  price: Decimal;
  createdAt: Date;
}

// DTOs for creating price records
export interface CreatePriceDailyDto {
  coinId: string;
  currencyCode: string;
  date: Date;
  price: Decimal | number;
}

export interface CreatePriceHourlyDto {
  coinId: string;
  currencyCode: string;
  timestamp: Date;
  price: Decimal | number;
}

// Breakdown dimension types
export type BreakdownDimension = "coin" | "currency" | "date";
export type Granularity = "daily" | "hourly";

// Query parameters for fetching prices
export interface PriceQueryParams {
  coinIds?: string[];
  currencyCodes?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  granularity: Granularity;
  breakdown?: BreakdownDimension[];
}

// Aggregated price result with optional dimensions
export interface AggregatedPrice {
  coin?: string; // Present if 'coin' is in breakdown
  currency?: string; // Present if 'currency' is in breakdown
  date?: string; // Present if 'date' is in breakdown
  price: number; // Average price for the group
}

// Internal type for price data processing
export interface PriceDataPoint {
  coinId: string;
  currencyCode: string;
  dateTime: Date;
  price: number;
}

// Grouping metadata for aggregation
export interface GroupMetadata {
  coin?: string;
  currency?: string;
  date?: string;
}

// Internal aggregation group
export interface AggregationGroup {
  sum: number;
  count: number;
  metadata: GroupMetadata;
}
