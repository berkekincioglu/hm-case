import { prisma } from "@/lib/db/prisma";
import { CreateCurrencyDto, CurrencyEntity } from "./currency.types";
import { logger } from "@/lib/utils/logger";

class CurrencyRepository {
  /**
   * Create a new currency
   */
  async create(data: CreateCurrencyDto): Promise<CurrencyEntity> {
    try {
      const currency = await prisma.currency.create({
        data,
      });
      logger.info(`Created currency: ${currency.code}`);
      return currency;
    } catch (error) {
      logger.error(`Failed to create currency: ${data.code}`, error);
      throw error;
    }
  }

  /**
   * Create multiple currencies
   */
  async createMany(currencies: CreateCurrencyDto[]): Promise<number> {
    try {
      const result = await prisma.currency.createMany({
        data: currencies,
        skipDuplicates: true,
      });
      logger.info(`Created ${result.count} currencies`);
      return result.count;
    } catch (error) {
      logger.error("Failed to create multiple currencies", error);
      throw error;
    }
  }

  /**
   * Find a currency by code
   */
  async findByCode(code: string): Promise<CurrencyEntity | null> {
    try {
      return await prisma.currency.findUnique({
        where: { code },
      });
    } catch (error) {
      logger.error(`Failed to find currency: ${code}`, error);
      throw error;
    }
  }

  /**
   * Find all currencies
   */
  async findAll(): Promise<CurrencyEntity[]> {
    try {
      return await prisma.currency.findMany({
        orderBy: { code: "asc" },
      });
    } catch (error) {
      logger.error("Failed to find all currencies", error);
      throw error;
    }
  }

  /**
   * Check if currency exists
   */
  async exists(code: string): Promise<boolean> {
    try {
      const count = await prisma.currency.count({
        where: { code },
      });
      return count > 0;
    } catch (error) {
      logger.error(`Failed to check if currency exists: ${code}`, error);
      throw error;
    }
  }

  /**
   * Delete a currency
   */
  async delete(code: string): Promise<void> {
    try {
      await prisma.currency.delete({
        where: { code },
      });
      logger.info(`Deleted currency: ${code}`);
    } catch (error) {
      logger.error(`Failed to delete currency: ${code}`, error);
      throw error;
    }
  }
}

export const currencyRepository = new CurrencyRepository();
