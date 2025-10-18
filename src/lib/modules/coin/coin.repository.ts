import { prisma } from "@/lib/db/prisma";
import { CreateCoinDto, CoinEntity, CoinWithMetadata } from "./coin.types";
import { logger } from "@/lib/utils/logger";

class CoinRepository {
  /**
   * Create a new coin
   */
  async create(data: CreateCoinDto): Promise<CoinEntity> {
    try {
      const coin = await prisma.coin.create({
        data,
      });
      logger.info(`Created coin: ${coin.id}`);
      return coin;
    } catch (error) {
      logger.error(`Failed to create coin: ${data.id}`, error);
      throw error;
    }
  }

  /**
   * Create multiple coins
   */
  async createMany(coins: CreateCoinDto[]): Promise<number> {
    try {
      const result = await prisma.coin.createMany({
        data: coins,
        skipDuplicates: true,
      });
      logger.info(`Created ${result.count} coins`);
      return result.count;
    } catch (error) {
      logger.error("Failed to create multiple coins", error);
      throw error;
    }
  }

  /**
   * Find a coin by ID
   */
  async findById(id: string): Promise<CoinEntity | null> {
    try {
      return await prisma.coin.findUnique({
        where: { id },
      });
    } catch (error) {
      logger.error(`Failed to find coin: ${id}`, error);
      throw error;
    }
  }

  /**
   * Find all coins
   */
  async findAll(): Promise<CoinEntity[]> {
    try {
      return await prisma.coin.findMany({
        orderBy: { name: "asc" },
      });
    } catch (error) {
      logger.error("Failed to find all coins", error);
      throw error;
    }
  }

  /**
   * Find coins with metadata
   */
  async findAllWithMetadata(): Promise<CoinWithMetadata[]> {
    try {
      return await prisma.coin.findMany({
        include: {
          metadata: true,
        },
        orderBy: { name: "asc" },
      });
    } catch (error) {
      logger.error("Failed to find coins with metadata", error);
      throw error;
    }
  }

  /**
   * Find coins by IDs
   */
  async findByIds(ids: string[]): Promise<CoinEntity[]> {
    try {
      return await prisma.coin.findMany({
        where: {
          id: { in: ids },
        },
        orderBy: { name: "asc" },
      });
    } catch (error) {
      logger.error("Failed to find coins by IDs", error);
      throw error;
    }
  }

  /**
   * Check if coin exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      const count = await prisma.coin.count({
        where: { id },
      });
      return count > 0;
    } catch (error) {
      logger.error(`Failed to check if coin exists: ${id}`, error);
      throw error;
    }
  }

  /**
   * Delete a coin
   */
  async delete(id: string): Promise<void> {
    try {
      await prisma.coin.delete({
        where: { id },
      });
      logger.info(`Deleted coin: ${id}`);
    } catch (error) {
      logger.error(`Failed to delete coin: ${id}`, error);
      throw error;
    }
  }

  /**
   * Get coin metadata
   */
  async getMetadata(coinId: string) {
    try {
      return await prisma.coinMetadata.findUnique({
        where: { coinId },
      });
    } catch (error) {
      logger.error(`Failed to get metadata for coin: ${coinId}`, error);
      throw error;
    }
  }

  /**
   * Create or update coin metadata
   */
  async upsertMetadata(data: {
    coinId: string;
    description: string | null;
    imageUrl: string | null;
    homepageUrl: string | null;
  }) {
    try {
      return await prisma.coinMetadata.upsert({
        where: { coinId: data.coinId },
        create: data,
        update: {
          description: data.description,
          imageUrl: data.imageUrl,
          homepageUrl: data.homepageUrl,
        },
      });
    } catch (error) {
      logger.error(`Failed to upsert metadata for coin: ${data.coinId}`, error);
      throw error;
    }
  }
}

export const coinRepository = new CoinRepository();
