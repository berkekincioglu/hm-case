import axios from "axios";

import { logger } from "../utils/logger";

interface MarketChartResponse {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

export class CoinGeckoService {
  private readonly apiKey: string;
  private readonly baseUrl = "https://api.coingecko.com/api/v3";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Fetch market chart data for a specific coin and currency
   */
  async fetchMarketChart(
    coinId: string,
    currency: string,
    days: number
  ): Promise<[number, number][]> {
    try {
      const response = await axios.get<MarketChartResponse>(
        `${this.baseUrl}/coins/${coinId}/market_chart`,
        {
          params: {
            vs_currency: currency,
            days,
            x_cg_demo_api_key: this.apiKey,
          },
          timeout: 30000, // 30 second timeout
        }
      );

      return response.data.prices;
    } catch (error) {
      logger.error(
        `Failed to fetch ${coinId} data for ${currency.toUpperCase()}`,
        error
      );
      throw error;
    }
  }

  /**
   * Batch fetch market data for multiple coins using days parameter
   * Returns data in plain object format (same as Next.js backend)
   */
  async batchFetchMarketDataByDays(
    coinIds: string[],
    currencies: string[],
    days: number
  ): Promise<Record<string, Record<string, { prices: [number, number][] }>>> {
    const results: Record<
      string,
      Record<string, { prices: [number, number][] }>
    > = {};

    for (const coinId of coinIds) {
      results[coinId] = {};

      for (const currency of currencies) {
        try {
          const prices = await this.fetchMarketChart(coinId, currency, days);
          results[coinId][currency] = { prices };

          // Small delay to avoid rate limiting (2 seconds = 30 requests/min)
          await new Promise((resolve) => setTimeout(resolve, 2000));

          logger.success(`Fetched ${coinId}/${currency.toUpperCase()}`);
        } catch (error) {
          logger.warn(
            `Skipping ${coinId}/${currency} due to error`,
            error instanceof Error ? error.message : "Unknown error"
          );
        }
      }
    }

    return results;
  }
}
