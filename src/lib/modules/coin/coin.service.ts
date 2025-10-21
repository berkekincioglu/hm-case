import { logger } from "@/lib/utils/logger";

import { coinRepository } from "./coin.repository";
import type { CreateCoinDto, CoinEntity } from "./coin.types";

class CoinService {
  /**
   * Get all coins
   */
  async getAllCoins(): Promise<CoinEntity[]> {
    try {
      return await coinRepository.findAll();
    } catch (error) {
      logger.error("Service: Failed to get all coins", error);
      throw error;
    }
  }

  /**
   * Get coin by ID
   */
  async getCoinById(id: string): Promise<CoinEntity | null> {
    try {
      return await coinRepository.findById(id);
    } catch (error) {
      logger.error(`Service: Failed to get coin ${id}`, error);
      throw error;
    }
  }

  /**
   * Create a new coin
   */
  async createCoin(data: CreateCoinDto): Promise<CoinEntity> {
    try {
      return await coinRepository.create(data);
    } catch (error) {
      logger.error("Service: Failed to create coin", error);
      throw error;
    }
  }

  /**
   * Bulk insert coins
   */
  async bulkInsertCoins(coins: CreateCoinDto[]): Promise<number> {
    try {
      logger.info(`Bulk inserting ${coins.length} coins`);
      return await coinRepository.createMany(coins);
    } catch (error) {
      logger.error("Service: Failed to bulk insert coins", error);
      throw error;
    }
  }
}

export const coinService = new CoinService();
