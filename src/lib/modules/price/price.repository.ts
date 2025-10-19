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
