import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";

import type {
  CreatePriceDailyDto,
  CreatePriceHourlyDto,
  PriceDailyEntity,
  PriceHourlyEntity,
} from "./price.types";

class PriceRepository {
  /**
   * Create daily price record
   */
  async createDaily(data: CreatePriceDailyDto): Promise<PriceDailyEntity> {
    try {
      return await prisma.priceDaily.create({
        data,
      });
    } catch (error) {
      logger.error("Failed to create daily price", error);
      throw error;
    }
  }

  /**
   * Create many daily price records
   */
  async createManyDaily(prices: CreatePriceDailyDto[]): Promise<number> {
    try {
      const result = await prisma.priceDaily.createMany({
        data: prices,
        skipDuplicates: true,
      });
      logger.info(`Created ${result.count} daily price records`);
      return result.count;
    } catch (error) {
      logger.error("Failed to create many daily prices", error);
      throw error;
    }
  }

  /**
   * Upsert many daily price records (update if exists, create if not)
   * This is more expensive than createMany but ensures data integrity
   */
  async upsertManyDaily(prices: CreatePriceDailyDto[]): Promise<number> {
    try {
      let upsertedCount = 0;

      // Process in batches to avoid overwhelming the database
      const batchSize = 100;
      for (let i = 0; i < prices.length; i += batchSize) {
        const batch = prices.slice(i, i + batchSize);

        await prisma.$transaction(
          batch.map((price) =>
            prisma.priceDaily.upsert({
              where: {
                coinId_currencyCode_date: {
                  coinId: price.coinId,
                  currencyCode: price.currencyCode,
                  date: price.date,
                },
              },
              update: {
                price: price.price,
              },
              create: price,
            })
          )
        );

        upsertedCount += batch.length;
      }

      logger.info(`Upserted ${upsertedCount} daily price records`);
      return upsertedCount;
    } catch (error) {
      logger.error("Failed to upsert many daily prices", error);
      throw error;
    }
  }

  /**
   * Create hourly price record
   */
  async createHourly(data: CreatePriceHourlyDto): Promise<PriceHourlyEntity> {
    try {
      return await prisma.priceHourly.create({
        data,
      });
    } catch (error) {
      logger.error("Failed to create hourly price", error);
      throw error;
    }
  }

  /**
   * Create many hourly price records
   */
  async createManyHourly(prices: CreatePriceHourlyDto[]): Promise<number> {
    try {
      const result = await prisma.priceHourly.createMany({
        data: prices,
        skipDuplicates: true,
      });
      logger.info(`Created ${result.count} hourly price records`);
      return result.count;
    } catch (error) {
      logger.error("Failed to create many hourly prices", error);
      throw error;
    }
  }

  /**
   * Upsert many hourly price records (update if exists, create if not)
   * This is more expensive than createMany but ensures data integrity
   */
  async upsertManyHourly(prices: CreatePriceHourlyDto[]): Promise<number> {
    try {
      let upsertedCount = 0;

      // Process in batches to avoid overwhelming the database
      const batchSize = 100;
      for (let i = 0; i < prices.length; i += batchSize) {
        const batch = prices.slice(i, i + batchSize);

        await prisma.$transaction(
          batch.map((price) =>
            prisma.priceHourly.upsert({
              where: {
                coinId_currencyCode_timestamp: {
                  coinId: price.coinId,
                  currencyCode: price.currencyCode,
                  timestamp: price.timestamp,
                },
              },
              update: {
                price: price.price,
              },
              create: price,
            })
          )
        );

        upsertedCount += batch.length;
      }

      logger.info(`Upserted ${upsertedCount} hourly price records`);
      return upsertedCount;
    } catch (error) {
      logger.error("Failed to upsert many hourly prices", error);
      throw error;
    }
  }

  /**
   * Get daily prices with filters
   */
  async findDaily(params: {
    coinIds?: string[];
    currencyCodes?: string[];
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<PriceDailyEntity[]> {
    try {
      return await prisma.priceDaily.findMany({
        where: {
          ...(params.coinIds && { coinId: { in: params.coinIds } }),
          ...(params.currencyCodes && {
            currencyCode: { in: params.currencyCodes },
          }),
          ...(params.dateFrom &&
            params.dateTo && {
              date: {
                gte: params.dateFrom,
                lte: params.dateTo,
              },
            }),
        },
        orderBy: [{ date: "asc" }, { coinId: "asc" }],
      });
    } catch (error) {
      logger.error("Failed to find daily prices", error);
      throw error;
    }
  }

  /**
   * Get hourly prices with filters
   */
  async findHourly(params: {
    coinIds?: string[];
    currencyCodes?: string[];
    timestampFrom?: Date;
    timestampTo?: Date;
  }): Promise<PriceHourlyEntity[]> {
    try {
      return await prisma.priceHourly.findMany({
        where: {
          ...(params.coinIds && { coinId: { in: params.coinIds } }),
          ...(params.currencyCodes && {
            currencyCode: { in: params.currencyCodes },
          }),
          ...(params.timestampFrom &&
            params.timestampTo && {
              timestamp: {
                gte: params.timestampFrom,
                lte: params.timestampTo,
              },
            }),
        },
        orderBy: [{ timestamp: "asc" }, { coinId: "asc" }],
      });
    } catch (error) {
      logger.error("Failed to find hourly prices", error);
      throw error;
    }
  }

  /**
   * Delete all prices for a coin
   */
  async deleteByCoin(coinId: string): Promise<void> {
    try {
      await prisma.$transaction([
        prisma.priceDaily.deleteMany({ where: { coinId } }),
        prisma.priceHourly.deleteMany({ where: { coinId } }),
      ]);
      logger.info(`Deleted all prices for coin: ${coinId}`);
    } catch (error) {
      logger.error(`Failed to delete prices for coin: ${coinId}`, error);
      throw error;
    }
  }

  /**
   * Delete all prices
   */
  async deleteAll(): Promise<{ daily: number; hourly: number }> {
    try {
      const [dailyResult, hourlyResult] = await prisma.$transaction([
        prisma.priceDaily.deleteMany({}),
        prisma.priceHourly.deleteMany({}),
      ]);
      logger.info(
        `Deleted ${dailyResult.count} daily and ${hourlyResult.count} hourly records`
      );
      return { daily: dailyResult.count, hourly: hourlyResult.count };
    } catch (error) {
      logger.error("Failed to delete all prices", error);
      throw error;
    }
  }
}

export const priceRepository = new PriceRepository();
