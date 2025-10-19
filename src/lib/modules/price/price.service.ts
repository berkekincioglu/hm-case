import moment from "moment";

import { logger } from "@/lib/utils/logger";

import { priceRepository } from "./price.repository";
import type {
  AggregatedPrice,
  AggregationGroup,
  BreakdownDimension,
  Granularity,
  GroupMetadata,
  PriceDailyEntity,
  PriceDataPoint,
  PriceHourlyEntity,
  PriceQueryParams,
} from "./price.types";

class PriceService {
  /**
   * Main entry point: Get prices with optional aggregation
   */
  async getPrices(params: PriceQueryParams): Promise<AggregatedPrice[]> {
    try {
      const { breakdown = [] } = params;

      // Fetch appropriate data based on granularity
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
   * Fetch raw price data based on granularity
   */
  private async fetchRawPrices(
    params: PriceQueryParams
  ): Promise<PriceDailyEntity[] | PriceHourlyEntity[]> {
    const { granularity, coinIds, currencyCodes, dateFrom, dateTo } = params;

    if (granularity === "daily") {
      return await priceRepository.findDaily({
        coinIds,
        currencyCodes,
        dateFrom,
        dateTo,
      });
    } else {
      return await priceRepository.findHourly({
        coinIds,
        currencyCodes,
        timestampFrom: dateFrom,
        timestampTo: dateTo,
      });
    }
  }

  /**
   * Normalize price entities
   */
  private normalizePrices(
    prices: PriceDailyEntity[] | PriceHourlyEntity[],
    granularity: Granularity
  ): PriceDataPoint[] {
    return prices.map((price) => ({
      coinId: price.coinId,
      currencyCode: price.currencyCode,
      dateTime:
        granularity === "daily"
          ? (price as PriceDailyEntity).date
          : (price as PriceHourlyEntity).timestamp,
      price: Number(price.price),
    }));
  }

  /**
   * Aggregate price data based on breakdown dimensions
   */
  private aggregateData(
    prices: PriceDataPoint[],
    breakdown: BreakdownDimension[],
    granularity: Granularity
  ): AggregatedPrice[] {
    if (prices.length === 0) return [];

    if (breakdown.length === 0) {
      return this.aggregateByDateOnly(prices, granularity);
    }

    return this.aggregateByDimensions(prices, breakdown, granularity);
  }

  /**
   * Aggregate by date only
   */
  private aggregateByDateOnly(
    prices: PriceDataPoint[],
    granularity: Granularity
  ): AggregatedPrice[] {
    const groupedByDate = new Map<string, number[]>();

    prices.forEach((price) => {
      const dateKey = this.formatDate(price.dateTime, granularity);

      if (!groupedByDate.has(dateKey)) {
        groupedByDate.set(dateKey, []);
      }

      groupedByDate.get(dateKey)!.push(price.price);
    });

    return Array.from(groupedByDate.entries()).map(([date, priceArray]) => ({
      date,
      price: this.calculateAverage(priceArray),
    }));
  }

  /**
   * Aggregate by multiple dimensions
   */
  private aggregateByDimensions(
    prices: PriceDataPoint[],
    breakdown: BreakdownDimension[],
    granularity: Granularity
  ): AggregatedPrice[] {
    const grouped = new Map<string, AggregationGroup>();

    prices.forEach((price) => {
      const { key, metadata } = this.buildGroupKey(
        price,
        breakdown,
        granularity
      );

      if (!grouped.has(key)) {
        grouped.set(key, {
          sum: 0,
          count: 0,
          metadata,
        });
      }

      const group = grouped.get(key)!;
      group.sum += price.price;
      group.count += 1;
    });

    return Array.from(grouped.values()).map((group) => ({
      ...group.metadata,
      price: group.sum / group.count,
    }));
  }

  /**
   * Build composite key and metadata for grouping
   */
  private buildGroupKey(
    price: PriceDataPoint,
    breakdown: BreakdownDimension[],
    granularity: Granularity
  ): { key: string; metadata: GroupMetadata } {
    const keyParts: string[] = [];
    const metadata: GroupMetadata = {};

    if (breakdown.includes("coin")) {
      keyParts.push(price.coinId);
      metadata.coin = price.coinId;
    }

    if (breakdown.includes("currency")) {
      const currencyUpper = price.currencyCode.toUpperCase();
      keyParts.push(currencyUpper);
      metadata.currency = currencyUpper;
    }

    if (breakdown.includes("date")) {
      const dateKey = this.formatDate(price.dateTime, granularity);
      keyParts.push(dateKey);
      metadata.date = dateKey;
    }

    return {
      key: keyParts.join("|"),
      metadata,
    };
  }

  /**
   * Format date based on granularity
   */
  private formatDate(date: Date, granularity: Granularity): string {
    return granularity === "daily"
      ? moment(date).format("YYYY-MM-DD")
      : moment(date).format("YYYY-MM-DD HH:00:00");
  }

  /**
   * Calculate average
   */
  private calculateAverage(numbers: number[]): number {
    const sum = numbers.reduce((acc, val) => acc + val, 0);
    return sum / numbers.length;
  }
}

export const priceService = new PriceService();
