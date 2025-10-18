import { currencyRepository } from "./currency.repository";
import { CreateCurrencyDto, CurrencyEntity } from "./currency.types";
import { logger } from "@/lib/utils/logger";

class CurrencyService {
  /**
   * Get all currencies
   */
  async getAllCurrencies(): Promise<CurrencyEntity[]> {
    try {
      return await currencyRepository.findAll();
    } catch (error) {
      logger.error("Service: Failed to get all currencies", error);
      throw error;
    }
  }

  /**
   * Get currency by code
   */
  async getCurrencyByCode(code: string): Promise<CurrencyEntity | null> {
    try {
      return await currencyRepository.findByCode(code);
    } catch (error) {
      logger.error(`Service: Failed to get currency ${code}`, error);
      throw error;
    }
  }

  /**
   * Create a new currency
   */
  async createCurrency(data: CreateCurrencyDto): Promise<CurrencyEntity> {
    try {
      return await currencyRepository.create(data);
    } catch (error) {
      logger.error("Service: Failed to create currency", error);
      throw error;
    }
  }

  /**
   * Bulk insert currencies
   */
  async bulkInsertCurrencies(currencies: CreateCurrencyDto[]): Promise<number> {
    try {
      logger.info(`Bulk inserting ${currencies.length} currencies`);
      return await currencyRepository.createMany(currencies);
    } catch (error) {
      logger.error("Service: Failed to bulk insert currencies", error);
      throw error;
    }
  }
}

export const currencyService = new CurrencyService();
