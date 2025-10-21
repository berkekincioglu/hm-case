import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { PrismaClient } from "@prisma/client";

import { logger } from "../utils/logger";

export class DatabaseService {
  private prisma: PrismaClient | null = null;

  private async initializePrisma(): Promise<PrismaClient> {
    if (this.prisma) {
      return this.prisma;
    }

    // Get database credentials from Secrets Manager
    const secretsClient = new SecretsManagerClient({
      region: process.env.AWS_REGION || "eu-central-1",
    });
    const secretArn = process.env.DB_SECRET_ARN;

    if (!secretArn) {
      throw new Error("DB_SECRET_ARN environment variable not set");
    }

    const secretResponse = await secretsClient.send(
      new GetSecretValueCommand({ SecretId: secretArn })
    );

    const secret = JSON.parse(secretResponse.SecretString!);
    const dbHost = process.env.DB_HOST;
    const dbPort = process.env.DB_PORT || "5432";
    const dbName = process.env.DB_NAME || "crypto_dashboard";

    const databaseUrl = `postgresql://${secret.username}:${secret.password}@${dbHost}:${dbPort}/${dbName}?schema=public`;

    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log: ["error", "warn"],
    });

    return this.prisma;
  }

  /**
   * Upsert coins into database
   */
  async upsertCoins(
    coins: Array<{ id: string; symbol: string; name: string }>
  ): Promise<void> {
    const prisma = await this.initializePrisma();
    for (const coin of coins) {
      await prisma.coin.upsert({
        where: { id: coin.id },
        update: {},
        create: coin,
      });
    }
    logger.info(`Upserted ${coins.length} coins`);
  }

  /**
   * Upsert currencies into database
   */
  async upsertCurrencies(
    currencies: Array<{ code: string; name: string }>
  ): Promise<void> {
    const prisma = await this.initializePrisma();
    for (const currency of currencies) {
      await prisma.currency.upsert({
        where: { code: currency.code },
        update: {},
        create: currency,
      });
    }
    logger.info(`Upserted ${currencies.length} currencies`);
  }

  /**
   * Batch insert daily prices
   */
  async insertDailyPrices(
    prices: Array<{
      coinId: string;
      currencyCode: string;
      date: Date;
      price: number;
    }>
  ): Promise<void> {
    const prisma = await this.initializePrisma();
    const BATCH_SIZE = 500;

    for (let i = 0; i < prices.length; i += BATCH_SIZE) {
      const batch = prices.slice(i, i + BATCH_SIZE);
      await prisma.priceDaily.createMany({
        data: batch,
        skipDuplicates: true,
      });
    }

    logger.info(`Inserted ${prices.length} daily prices`);
  }

  /**
   * Batch insert hourly prices
   */
  async insertHourlyPrices(
    prices: Array<{
      coinId: string;
      currencyCode: string;
      timestamp: Date;
      price: number;
    }>
  ): Promise<void> {
    const prisma = await this.initializePrisma();
    const BATCH_SIZE = 500;

    for (let i = 0; i < prices.length; i += BATCH_SIZE) {
      const batch = prices.slice(i, i + BATCH_SIZE);
      await prisma.priceHourly.createMany({
        data: batch,
        skipDuplicates: true,
      });
    }

    logger.info(`Inserted ${prices.length} hourly prices`);
  }

  /**
   * Disconnect from database
   */
  async disconnect(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect();
    }
  }
}
