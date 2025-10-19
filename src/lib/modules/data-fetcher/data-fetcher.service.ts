import moment from "moment";

import { logger } from "@/lib/utils/logger";

import { coinService } from "../coin/coin.service";
import { coinGeckoService } from "../coingecko/coingecko.service";
import type { MarketChartRange } from "../coingecko/coingecko.types";
import { currencyService } from "../currency/currency.service";
import { priceRepository } from "../price/price.repository";
import type {
  CreatePriceDailyDto,
  CreatePriceHourlyDto,
} from "../price/price.types";

// Major cryptocurrencies to fetch (10+ coins as per requirement)
const MAJOR_COINS = [
  { id: "bitcoin", symbol: "btc", name: "Bitcoin" },
  { id: "ethereum", symbol: "eth", name: "Ethereum" },
  { id: "solana", symbol: "sol", name: "Solana" },
  { id: "cardano", symbol: "ada", name: "Cardano" },
  { id: "ripple", symbol: "xrp", name: "XRP" },
  { id: "polkadot", symbol: "dot", name: "Polkadot" },
  { id: "dogecoin", symbol: "doge", name: "Dogecoin" },
  { id: "avalanche-2", symbol: "avax", name: "Avalanche" },
  { id: "chainlink", symbol: "link", name: "Chainlink" },
  { id: "uniswap", symbol: "uni", name: "Uniswap" },
  { id: "litecoin", symbol: "ltc", name: "Litecoin" },
  // Removed polygon (matic) - returns 404 from CoinGecko
];

// Currencies to fetch (as per requirement)
const CURRENCIES = [
  { code: "usd", name: "US Dollar" },
  { code: "try", name: "Turkish Lira" },
  { code: "eur", name: "Euro" },
  { code: "gbp", name: "British Pound" },
];

class DataFetcherService {
  /**
   * Clean existing price data from database
   */
  async cleanExistingData(): Promise<void> {
    try {
      logger.info("Cleaning existing price data...");

      const result = await priceRepository.deleteAll();

      logger.success(
        `Cleaned ${result.daily} daily and ${result.hourly} hourly price records`
      );
    } catch (error) {
      logger.error("Failed to clean existing data", error);
      throw error;
    }
  }

  /**
   * Initialize coins and currencies in database
   */
  async initializeCoinsAndCurrencies(): Promise<void> {
    try {
      logger.info("Initializing coins and currencies...");

      // Insert coins
      await coinService.bulkInsertCoins(MAJOR_COINS);

      // Insert currencies
      await currencyService.bulkInsertCurrencies(CURRENCIES);

      logger.success("Coins and currencies initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize coins and currencies", error);
      throw error;
    }
  }

  /**
   * Fetch and store historical price data
   * - Hourly data: Last 30 days (CoinGecko provides ~5min intervals)
   * - Daily data: Last 365 days (CoinGecko provides daily aggregates)
   */
  async fetchHistoricalPrices(): Promise<void> {
    try {
      logger.info("Starting historical price data fetch...");

      const coinIds = MAJOR_COINS.map((c) => c.id);
      const currencyCodes = CURRENCIES.map((c) => c.code);

      // Fetch hourly data (last 30 days - CoinGecko returns ~5min intervals)
      await this.fetchHourlyPrices(coinIds, currencyCodes);

      // Fetch daily data (last 365 days - CoinGecko returns daily aggregates)
      await this.fetchDailyPrices(coinIds, currencyCodes);

      logger.success("Historical price data fetch completed");
    } catch (error) {
      logger.error("Failed to fetch historical prices", error);
      throw error;
    }
  }

  /**
   * Fetch hourly/fine-grained price data for recent period
   * Uses /market_chart endpoint with days=30 for ~5min interval data
   */
  private async fetchHourlyPrices(
    coinIds: string[],
    currencyCodes: string[]
  ): Promise<void> {
    logger.info("Fetching hourly prices (last 30 days)...");

    const marketData = await coinGeckoService.batchFetchMarketDataByDays(
      coinIds,
      currencyCodes,
      30 // Last 30 days - CoinGecko returns ~5min intervals
    );

    await this.storeHourlyData(marketData);
  }

  /**
   * Fetch daily aggregated price data for longer period
   * Uses /market_chart endpoint with days=365 for daily data
   */
  private async fetchDailyPrices(
    coinIds: string[],
    currencyCodes: string[]
  ): Promise<void> {
    logger.info("Fetching daily prices (last 365 days)...");

    const marketData = await coinGeckoService.batchFetchMarketDataByDays(
      coinIds,
      currencyCodes,
      365 // Last 365 days - CoinGecko returns daily intervals
    );

    await this.storeDailyData(marketData);
  }

  /**
   * Store raw hourly/fine-grained data
   */
  private async storeHourlyData(
    marketData: Map<string, Map<string, MarketChartRange>>
  ): Promise<void> {
    const hourlyPrices: CreatePriceHourlyDto[] = [];

    marketData.forEach((currencyMap, coinId) => {
      currencyMap.forEach((data, currencyCode) => {
        if (!data || !data.prices) return;

        data.prices.forEach(([timestamp, price]: [number, number]) => {
          hourlyPrices.push({
            coinId,
            currencyCode: currencyCode.toLowerCase(),
            timestamp: moment(timestamp).toDate(),
            price,
          });
        });
      });
    });

    const BATCH_SIZE = 500;
    logger.info(`Storing ${hourlyPrices.length} hourly prices`);

    for (let i = 0; i < hourlyPrices.length; i += BATCH_SIZE) {
      const batch = hourlyPrices.slice(i, i + BATCH_SIZE);
      await priceRepository.createManyHourly(batch);
      logger.info(
        `Stored hourly batch ${i / BATCH_SIZE + 1}/${Math.ceil(
          hourlyPrices.length / BATCH_SIZE
        )}`
      );
    }

    logger.success(`Stored ${hourlyPrices.length} hourly prices`);
  }

  /**
   * Store daily aggregated data
   * For 365 days, CoinGecko already returns daily data, so we store it directly
   */
  private async storeDailyData(
    marketData: Map<string, Map<string, MarketChartRange>>
  ): Promise<void> {
    const dailyPrices: CreatePriceDailyDto[] = [];

    marketData.forEach((currencyMap, coinId) => {
      currencyMap.forEach((data, currencyCode) => {
        if (!data || !data.prices) return;

        // For 365 days, CoinGecko returns daily data
        // Each data point represents the average for that day
        data.prices.forEach(([timestamp, price]: [number, number]) => {
          dailyPrices.push({
            coinId,
            currencyCode: currencyCode.toLowerCase(),
            date: moment(timestamp).startOf("day").toDate(),
            price,
          });
        });
      });
    });

    const BATCH_SIZE = 500;
    logger.info(`Storing ${dailyPrices.length} daily prices`);

    for (let i = 0; i < dailyPrices.length; i += BATCH_SIZE) {
      const batch = dailyPrices.slice(i, i + BATCH_SIZE);
      await priceRepository.createManyDaily(batch);
      logger.info(
        `Stored daily batch ${i / BATCH_SIZE + 1}/${Math.ceil(
          dailyPrices.length / BATCH_SIZE
        )}`
      );
    }

    logger.success(`Stored ${dailyPrices.length} daily prices`);
  }

  /**
   * Run complete data initialization
   * @param cleanFirst - Whether to clean existing data before fetching (default: true)
   */
  async runFullDataFetch(cleanFirst: boolean = true): Promise<void> {
    try {
      logger.info("=== Starting Full Data Fetch ===");

      // Step 0: Clean existing data if requested (default: true)
      if (cleanFirst) {
        await this.cleanExistingData();
      }

      // Step 1: Initialize coins and currencies
      await this.initializeCoinsAndCurrencies();

      // Step 2: Fetch historical prices
      await this.fetchHistoricalPrices();

      logger.success("=== Full Data Fetch Completed ===");
    } catch (error) {
      logger.error("=== Full Data Fetch Failed ===", error);
      throw error;
    }
  }
}

export const dataFetcherService = new DataFetcherService();
