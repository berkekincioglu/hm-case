import { coinGeckoService } from "../coingecko/coingecko.service";
import { coinService } from "../coin/coin.service";
import { currencyService } from "../currency/currency.service";
import { priceRepository } from "../price/price.repository";
import { MarketChartRange } from "../coingecko/coingecko.types";
import { logger } from "@/lib/utils/logger";
import moment from "moment";
import {
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
   * Prevents duplicate data on re-runs
   */
  async cleanExistingData(): Promise<void> {
    try {
      logger.info("Cleaning existing price data...");

      const { prisma } = await import("@/lib/db/prisma");

      // Delete all price data (cascading will handle relations)
      const [dailyCount, hourlyCount] = await Promise.all([
        prisma.priceDaily.deleteMany({}),
        prisma.priceHourly.deleteMany({}),
      ]);

      logger.success(
        `Cleaned ${dailyCount.count} daily and ${hourlyCount.count} hourly price records`
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
   * Date range: July 1, 2025 - August 31, 2025
   */
  async fetchHistoricalPrices(): Promise<void> {
    try {
      const from = moment("2025-07-01").unix(); // Unix timestamp
      const to = moment("2025-08-31").endOf("day").unix();

      logger.info("Starting historical price data fetch...", {
        from: moment.unix(from).format("YYYY-MM-DD"),
        to: moment.unix(to).format("YYYY-MM-DD"),
        coins: MAJOR_COINS.length,
        currencies: CURRENCIES.length,
      });

      const coinIds = MAJOR_COINS.map((c) => c.id);
      const currencyCodes = CURRENCIES.map((c) => c.code);

      // Fetch data from CoinGecko
      const marketData = await coinGeckoService.batchFetchMarketData(
        coinIds,
        currencyCodes,
        from,
        to
      );

      // Process and store data
      await this.processAndStoreData(marketData);

      logger.success("Historical price data fetch completed");
    } catch (error) {
      logger.error("Failed to fetch historical prices", error);
      throw error;
    }
  }

  /**
   * Process market data and store in database
   */
  private async processAndStoreData(
    marketData: Map<string, Map<string, MarketChartRange>>
  ): Promise<void> {
    const dailyPrices: CreatePriceDailyDto[] = [];
    const hourlyPrices: CreatePriceHourlyDto[] = [];

    marketData.forEach((currencyMap, coinId) => {
      currencyMap.forEach((data, currencyCode) => {
        if (!data || !data.prices) return;

        // Group prices by day for daily averages
        const dailyGroups = new Map<string, number[]>();

        data.prices.forEach(([timestamp, price]: [number, number]) => {
          const date = moment(timestamp);
          const dayKey = date.format("YYYY-MM-DD");

          // Store for hourly data
          hourlyPrices.push({
            coinId,
            currencyCode: currencyCode.toLowerCase(),
            timestamp: date.toDate(),
            price,
          });

          // Group for daily averages
          if (!dailyGroups.has(dayKey)) {
            dailyGroups.set(dayKey, []);
          }
          dailyGroups.get(dayKey)!.push(price);
        });

        // Calculate daily averages
        dailyGroups.forEach((prices, dayKey) => {
          const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
          dailyPrices.push({
            coinId,
            currencyCode: currencyCode.toLowerCase(),
            date: moment(dayKey).toDate(),
            price: avgPrice,
          });
        });
      });
    });

    // Store in database in batches
    const BATCH_SIZE = 500;

    logger.info(
      `Storing ${dailyPrices.length} daily prices and ${hourlyPrices.length} hourly prices`
    );

    // Store daily prices in batches
    for (let i = 0; i < dailyPrices.length; i += BATCH_SIZE) {
      const batch = dailyPrices.slice(i, i + BATCH_SIZE);
      await priceRepository.createManyDaily(batch);
      logger.info(
        `Stored daily batch ${i / BATCH_SIZE + 1}/${Math.ceil(
          dailyPrices.length / BATCH_SIZE
        )}`
      );
    }

    // Store hourly prices in batches
    for (let i = 0; i < hourlyPrices.length; i += BATCH_SIZE) {
      const batch = hourlyPrices.slice(i, i + BATCH_SIZE);
      await priceRepository.createManyHourly(batch);
      logger.info(
        `Stored hourly batch ${i / BATCH_SIZE + 1}/${Math.ceil(
          hourlyPrices.length / BATCH_SIZE
        )}`
      );
    }

    logger.success("All price data stored successfully");
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
