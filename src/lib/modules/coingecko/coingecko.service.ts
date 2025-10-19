import type { AxiosInstance } from "axios";
import axios from "axios";

import { logger } from "@/lib/utils/logger";

import type {
  CoinListItem,
  MarketChartRange,
  CoinDetail,
  FetchPriceParams,
} from "./coingecko.types";

class CoinGeckoService {
  private client: AxiosInstance | null = null;
  // CoinGecko free tier: 30 requests per minute
  // Safe rate: 2 seconds between requests (30 requests per 60 seconds)
  private rateLimitDelay: number = 2000;

  /**
   * Lazy initialization of axios client
   * This ensures environment variables are loaded before creating the client
   */
  private getClient(): AxiosInstance {
    if (this.client) {
      return this.client;
    }

    const apiKey = process.env.COINGECKO_API_KEY;
    const baseUrl =
      process.env.COINGECKO_BASE_URL || "https://api.coingecko.com/api/v3";

    if (!apiKey) {
      throw new Error(
        "COINGECKO_API_KEY is not defined in environment variables"
      );
    }

    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        "x-cg-demo-api-key": apiKey,
      },
      timeout: 30000,
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.info(
          `CoinGecko API Request: ${config.method?.toUpperCase()} ${config.url}`
        );
        return config;
      },
      (error) => {
        logger.error("CoinGecko API Request Error", error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.success(`CoinGecko API Response: ${response.config.url}`, {
          status: response.status,
        });
        return response;
      },
      (error) => {
        logger.error("CoinGecko API Response Error", {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );

    return this.client;
  }

  /**
   * Add delay to respect rate limits 30 seconds/minute
   */
  private async delay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, this.rateLimitDelay));
  }

  /**
   * Get list of all coins
   */
  async getCoinsList(): Promise<CoinListItem[]> {
    try {
      const client = this.getClient();
      const response = await client.get<CoinListItem[]>("/coins/list");
      logger.info(`Fetched ${response.data.length} coins from CoinGecko`);
      return response.data;
    } catch (error) {
      logger.error("Failed to fetch coins list", error);
      throw error;
    }
  }

  /**
   * Get historical market data for a coin within a date range
   */
  async getMarketChartRange(
    params: FetchPriceParams
  ): Promise<MarketChartRange> {
    try {
      await this.delay(); // Rate limiting

      const client = this.getClient();
      const response = await client.get<MarketChartRange>(
        `/coins/${params.coinId}/market_chart/range`,
        {
          params: {
            vs_currency: params.currency,
            from: params.from,
            to: params.to,
          },
        }
      );

      logger.info(
        `Fetched ${response.data.prices.length} price points for ${params.coinId}`
      );
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch market chart for ${params.coinId}`, error);
      throw error;
    }
  }

  /**
   * Get historical market data using days parameter (auto-adjusts granularity)
   * - days=1-90: Returns ~5min intervals (fine-grained data)
   * - days=90+: Returns daily intervals
   */
  async getMarketChart(params: {
    coinId: string;
    currency: string;
    days: number;
  }): Promise<MarketChartRange> {
    try {
      await this.delay(); // Rate limiting

      const client = this.getClient();
      const response = await client.get<MarketChartRange>(
        `/coins/${params.coinId}/market_chart`,
        {
          params: {
            vs_currency: params.currency,
            days: params.days,
          },
        }
      );

      logger.info(
        `Fetched ${response.data.prices.length} price points for ${params.coinId} (${params.days} days)`
      );
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch market chart for ${params.coinId}`, error);
      throw error;
    }
  }

  /**
   * Get detailed information about a specific coin (for metadata)
   */
  async getCoinDetail(coinId: string): Promise<CoinDetail> {
    try {
      await this.delay(); // Rate limiting

      const client = this.getClient();
      const response = await client.get<CoinDetail>(`/coins/${coinId}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: false,
          community_data: false,
          developer_data: false,
          sparkline: false,
        },
      });

      logger.info(`Fetched metadata for ${coinId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch coin detail for ${coinId}`, error);
      throw error;
    }
  }

  /**
   * Batch fetch market data for multiple coins (using days parameter)
   */
  async batchFetchMarketDataByDays(
    coinIds: string[],
    currencies: string[],
    days: number
  ): Promise<Map<string, Map<string, MarketChartRange>>> {
    const results = new Map<string, Map<string, MarketChartRange>>();

    for (const coinId of coinIds) {
      const coinResults = new Map<string, MarketChartRange>();

      for (const currency of currencies) {
        try {
          const data = await this.getMarketChart({
            coinId,
            currency,
            days,
          });
          coinResults.set(currency, data);
          logger.success(`Fetched ${coinId}/${currency.toUpperCase()}`);
        } catch (error) {
          logger.error(
            `Failed to fetch ${coinId}/${currency.toUpperCase()}`,
            error
          );
        }
      }

      results.set(coinId, coinResults);
    }

    return results;
  }

  /**
   * Batch fetch market data for multiple coins
   */
  async batchFetchMarketData(
    coinIds: string[],
    currencies: string[],
    from: number,
    to: number
  ): Promise<Map<string, Map<string, MarketChartRange>>> {
    const results = new Map<string, Map<string, MarketChartRange>>();

    for (const coinId of coinIds) {
      const coinResults = new Map<string, MarketChartRange>();

      for (const currency of currencies) {
        try {
          const data = await this.getMarketChartRange({
            coinId,
            currency,
            from,
            to,
          });
          coinResults.set(currency, data);
          logger.success(`Fetched ${coinId}/${currency.toUpperCase()}`);
        } catch (error) {
          logger.error(
            `Failed to fetch ${coinId}/${currency.toUpperCase()}`,
            error
          );
          // Continue with other combinations even if one fails
        }
      }

      results.set(coinId, coinResults);
    }

    return results;
  }
}

// Singleton instance
export const coinGeckoService = new CoinGeckoService();
