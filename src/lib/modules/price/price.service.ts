import { priceRepository } from "./price.repository";
import {
  PriceQueryParams,
  AggregatedPrice,
  PriceDailyEntity,
  PriceHourlyEntity,
  BreakdownDimension,
  Granularity,
  PriceDataPoint,
  GroupMetadata,
  AggregationGroup,
} from "./price.types";
import { logger } from "@/lib/utils/logger";
import moment from "moment";

class PriceService {
  /**
   * Main entry point: Get prices with optional aggregation
   *
   * Business Logic:
   * 1. Fetches raw price data from repository based on filters (coins, currencies, dates)
   * 2. Aggregates data according to breakdown dimensions
   * 3. Returns averaged prices grouped by selected dimensions
   *
   * @param params - Query parameters including filters and breakdown options
   * @returns Array of aggregated prices with requested dimensions
   */
  async getPrices(params: PriceQueryParams): Promise<AggregatedPrice[]> {
    try {
      const { breakdown = [] } = params;

      // Fetch appropriate data based on granularity (daily or hourly)
      const rawPrices = await this.fetchRawPrices(params);

      // Convert to normalized format for processing
      const normalizedPrices = this.normalizePrices(
        rawPrices,
        params.granularity
      );

      // Aggregate based on breakdown dimensions
      return this.aggregateData(
        normalizedPrices,
        breakdown,
        params.granularity
      );
    } catch (error) {
      logger.error("Service: Failed to get prices", error);
      throw error;
    }
  }

  /**
   * Fetch raw price data from repository based on granularity
   *
   * Purpose: Abstraction layer to handle different price tables (daily vs hourly)
   */
  private async fetchRawPrices(
    params: PriceQueryParams
  ): Promise<PriceDailyEntity[] | PriceHourlyEntity[]> {
    const { granularity, coinIds, currencyCodes, dateFrom, dateTo } = params;

    if (granularity === "daily") {
      // Fetch from daily prices table
      return await priceRepository.findDaily({
        coinIds,
        currencyCodes,
        dateFrom,
        dateTo,
      });
    } else {
      // Fetch from hourly prices table
      return await priceRepository.findHourly({
        coinIds,
        currencyCodes,
        timestampFrom: dateFrom,
        timestampTo: dateTo,
      });
    }
  }

  /**
   * Normalize different price entity types into a common format
   *
   * Purpose: Create a uniform data structure for aggregation logic
   * This follows the Single Responsibility Principle - one function, one purpose
   */
  private normalizePrices(
    prices: PriceDailyEntity[] | PriceHourlyEntity[],
    granularity: Granularity
  ): PriceDataPoint[] {
    return prices.map((price) => ({
      coinId: price.coinId,
      currencyCode: price.currencyCode,
      // Handle different date fields (date for daily, timestamp for hourly)
      dateTime:
        granularity === "daily"
          ? (price as PriceDailyEntity).date
          : (price as PriceHourlyEntity).timestamp,
      // Convert Decimal to number for calculations
      price: Number(price.price),
    }));
  }

  /**
   * Aggregate price data based on breakdown dimensions
   *
   * Business Logic Explained:
   * ========================
   *
   * Breakdown dimensions determine HOW data is grouped:
   *
   * - No breakdown: Average all prices per date (simplest case)
   *   Example: Show overall market average per day
   *
   * - breakdown=['coin']: Group by coin only
   *   Example: BTC average across all currencies/dates
   *
   * - breakdown=['currency']: Group by currency only
   *   Example: USD average across all coins/dates
   *
   * - breakdown=['date']: Group by date only
   *   Example: Average price per day across all coins/currencies
   *
   * - breakdown=['coin', 'currency']: Group by coin AND currency
   *   Example: BTC/USD, BTC/EUR, ETH/USD, ETH/EUR (separate lines)
   *
   * - breakdown=['coin', 'currency', 'date']: Most granular
   *   Example: BTC/USD on 2025-07-01, BTC/USD on 2025-07-02, etc.
   *
   * @param prices - Normalized price data points
   * @param breakdown - Dimensions to group by (coin, currency, date)
   * @param granularity - Time granularity (daily or hourly)
   * @returns Array of aggregated prices
   */
  private aggregateData(
    prices: PriceDataPoint[],
    breakdown: BreakdownDimension[],
    granularity: Granularity
  ): AggregatedPrice[] {
    // Early return for empty data
    if (prices.length === 0) return [];

    // Special case: No breakdown means aggregate everything by date only
    if (breakdown.length === 0) {
      return this.aggregateByDateOnly(prices, granularity);
    }

    // General case: Group by specified dimensions
    return this.aggregateByDimensions(prices, breakdown, granularity);
  }

  /**
   * Aggregate by date only (no dimension breakdown)
   *
   * Purpose: Calculate average price per date across ALL coins and currencies
   * Used when user wants to see overall market trend
   *
   * Steps:
   * 1. Group all prices by date
   * 2. Calculate average for each date
   * 3. Return date + average price
   */
  private aggregateByDateOnly(
    prices: PriceDataPoint[],
    granularity: Granularity
  ): AggregatedPrice[] {
    // Map to store prices grouped by date
    // Key: date string, Value: array of all prices for that date
    const groupedByDate = new Map<string, number[]>();

    prices.forEach((price) => {
      // Format date based on granularity
      // Daily: "2025-07-01"
      // Hourly: "2025-07-01 14:00:00"
      const dateKey = this.formatDate(price.dateTime, granularity);

      // Initialize array if date key doesn't exist
      if (!groupedByDate.has(dateKey)) {
        groupedByDate.set(dateKey, []);
      }

      // Add price to this date's array
      groupedByDate.get(dateKey)!.push(price.price);
    });

    // Convert grouped data to final format
    return Array.from(groupedByDate.entries()).map(([date, priceArray]) => ({
      date,
      // Calculate average: sum all prices / count
      price: this.calculateAverage(priceArray),
    }));
  }

  /**
   * Aggregate by multiple dimensions (coin, currency, date)
   *
   * Purpose: Group prices by selected dimensions and calculate averages
   *
   * Example: breakdown=['coin', 'currency']
   * Input: 100 hourly prices for BTC/USD over 5 days
   * Output: 1 record with BTC/USD average price
   *
   * Example: breakdown=['coin', 'currency', 'date']
   * Input: 100 hourly prices for BTC/USD over 5 days
   * Output: 5 records, one for each day with daily average
   *
   * Steps:
   * 1. For each price record, generate a grouping key based on breakdown
   * 2. Accumulate sum and count for each group
   * 3. Calculate average (sum/count) for each group
   * 4. Return formatted results
   */
  private aggregateByDimensions(
    prices: PriceDataPoint[],
    breakdown: BreakdownDimension[],
    granularity: Granularity
  ): AggregatedPrice[] {
    // Map to store aggregation groups
    // Key: composite key from dimensions (e.g., "bitcoin|usd|2025-07-01")
    // Value: aggregation data (sum, count, metadata)
    const grouped = new Map<string, AggregationGroup>();

    prices.forEach((price) => {
      // Build grouping key and metadata based on selected breakdown
      const { key, metadata } = this.buildGroupKey(
        price,
        breakdown,
        granularity
      );

      // Initialize group if it doesn't exist
      if (!grouped.has(key)) {
        grouped.set(key, {
          sum: 0, // Running sum of prices
          count: 0, // Number of prices in this group
          metadata, // Dimension values (coin, currency, date)
        });
      }

      // Accumulate price data for this group
      const group = grouped.get(key)!;
      group.sum += price.price;
      group.count += 1;
    });

    // Convert accumulated groups to final format
    return Array.from(grouped.values()).map((group) => ({
      ...group.metadata, // Spread dimension values (coin?, currency?, date?)
      price: group.sum / group.count, // Calculate average
    }));
  }

  /**
   * Build composite key and metadata for grouping
   *
   * Purpose: Create unique identifier for each group combination
   *
   * Example: breakdown=['coin', 'currency']
   * Input: { coinId: 'bitcoin', currencyCode: 'usd', ... }
   * Output: {
   *   key: "bitcoin|usd",
   *   metadata: { coin: 'bitcoin', currency: 'USD' }
   * }
   *
   * @returns Object with unique key and metadata for the group
   */
  private buildGroupKey(
    price: PriceDataPoint,
    breakdown: BreakdownDimension[],
    granularity: Granularity
  ): { key: string; metadata: GroupMetadata } {
    const keyParts: string[] = []; // Array to build composite key
    const metadata: GroupMetadata = {}; // Metadata to return in result

    // Include coin in key if it's in breakdown
    if (breakdown.includes("coin")) {
      keyParts.push(price.coinId);
      metadata.coin = price.coinId;
    }

    // Include currency in key if it's in breakdown
    if (breakdown.includes("currency")) {
      const currencyUpper = price.currencyCode.toUpperCase();
      keyParts.push(currencyUpper);
      metadata.currency = currencyUpper;
    }

    // Include date in key if it's in breakdown
    if (breakdown.includes("date")) {
      const dateKey = this.formatDate(price.dateTime, granularity);
      keyParts.push(dateKey);
      metadata.date = dateKey;
    }

    // Join parts with delimiter to create unique key
    // Example: "bitcoin|USD|2025-07-01"
    return {
      key: keyParts.join("|"),
      metadata,
    };
  }

  /**
   * Format date based on granularity
   *
   * Purpose: Consistent date formatting for grouping
   * - Daily: "2025-07-01"
   * - Hourly: "2025-07-01 14:00:00"
   */
  private formatDate(date: Date, granularity: Granularity): string {
    return granularity === "daily"
      ? moment(date).format("YYYY-MM-DD")
      : moment(date).format("YYYY-MM-DD HH:00:00");
  }

  /**
   * Calculate average of number array
   *
   * Purpose: Simple utility for average calculation
   * Formula: sum of all values / count of values
   */
  private calculateAverage(numbers: number[]): number {
    const sum = numbers.reduce((acc, val) => acc + val, 0);
    return sum / numbers.length;
  }
}

export const priceService = new PriceService();
