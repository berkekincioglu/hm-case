import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

import { CoinGeckoService } from "./coingecko.service";
import { DatabaseService } from "./database.service";
import { MAJOR_COINS, CURRENCIES } from "../config/constants";
import { logger } from "../utils/logger";

interface MarketChartData {
  prices: [number, number][];
  market_caps?: [number, number][];
  total_volumes?: [number, number][];
}

interface MarketDataCollection {
  [coinId: string]: {
    [currency: string]: MarketChartData;
  };
}

export class DataFetcherService {
  private secretsClient: SecretsManagerClient;

  constructor() {
    this.secretsClient = new SecretsManagerClient({});
  }

  /**
   * Get CoinGecko API key from Secrets Manager
   */
  private async getCoinGeckoApiKey(): Promise<string> {
    const secretArn = process.env.COINGECKO_SECRET_ARN;
    if (!secretArn) {
      throw new Error("COINGECKO_SECRET_ARN environment variable not set");
    }

    const response = await this.secretsClient.send(
      new GetSecretValueCommand({
        SecretId: secretArn,
      })
    );

    if (!response.SecretString) {
      throw new Error("CoinGecko API key is empty");
    }

    return response.SecretString;
  }

  /**
   * Run full data fetch process
   */
  async runFullDataFetch(): Promise<void> {
    const db = new DatabaseService();

    try {
      // Step 1: Get API key
      logger.info("Fetching CoinGecko API key from Secrets Manager");
      const apiKey = await this.getCoinGeckoApiKey();
      const coinGecko = new CoinGeckoService(apiKey);

      // Step 2: Initialize coins and currencies
      logger.info("Initializing coins and currencies");
      await db.upsertCoins(MAJOR_COINS);
      await db.upsertCurrencies(CURRENCIES);

      // Step 3: Fetch and store hourly data (30 days)
      logger.info("Fetching hourly price data (30 days)");
      const hourlyData = await coinGecko.batchFetchMarketDataByDays(
        MAJOR_COINS.map((c) => c.id),
        CURRENCIES.map((c) => c.code),
        30
      );

      const hourlyPrices = this.storeHourlyData(hourlyData);
      logger.info(`Storing ${hourlyPrices.length} hourly prices`);
      await db.insertHourlyPrices(hourlyPrices);

      // Step 4: Fetch and store daily data (365 days)
      logger.info("Fetching daily price data (365 days)");
      const dailyData = await coinGecko.batchFetchMarketDataByDays(
        MAJOR_COINS.map((c) => c.id),
        CURRENCIES.map((c) => c.code),
        365
      );

      const dailyPrices = this.storeDailyData(dailyData);
      logger.info(`Storing ${dailyPrices.length} daily prices`);
      await db.insertDailyPrices(dailyPrices);

      logger.success("Data fetch completed successfully");
    } finally {
      await db.disconnect();
    }
  }

  /**
   * Store raw hourly/fine-grained data
   */
  private storeHourlyData(marketData: MarketDataCollection): Array<{
    coinId: string;
    currencyCode: string;
    timestamp: Date;
    price: number;
  }> {
    const hourlyPrices: Array<{
      coinId: string;
      currencyCode: string;
      timestamp: Date;
      price: number;
    }> = [];

    // Iterate through coins
    for (const [coinId, currencyMap] of Object.entries(marketData)) {
      // Iterate through currencies for this coin
      for (const [currencyCode, data] of Object.entries(currencyMap)) {
        if (!data || !data.prices) continue;

        data.prices.forEach(([timestamp, price]: [number, number]) => {
          hourlyPrices.push({
            coinId,
            currencyCode: currencyCode.toLowerCase(),
            timestamp: new Date(timestamp),
            price,
          });
        });
      }
    }

    return hourlyPrices;
  }

  /**
   * Store daily aggregated data
   */
  private storeDailyData(marketData: MarketDataCollection): Array<{
    coinId: string;
    currencyCode: string;
    date: Date;
    price: number;
  }> {
    const dailyPrices: Array<{
      coinId: string;
      currencyCode: string;
      date: Date;
      price: number;
    }> = [];

    // Iterate through coins
    for (const [coinId, currencyMap] of Object.entries(marketData)) {
      // Iterate through currencies for this coin
      for (const [currencyCode, data] of Object.entries(currencyMap)) {
        if (!data || !data.prices) continue;

        data.prices.forEach(([timestamp, price]: [number, number]) => {
          const date = new Date(timestamp);
          date.setHours(0, 0, 0, 0); // Normalize to start of day

          dailyPrices.push({
            coinId,
            currencyCode: currencyCode.toLowerCase(),
            date,
            price,
          });
        });
      }
    }

    return dailyPrices;
  }
}

export const dataFetcherService = new DataFetcherService();
