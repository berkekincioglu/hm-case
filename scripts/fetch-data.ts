#!/usr/bin/env tsx

/**
 * Data initialization script
 * Fetches historical cryptocurrency price data from CoinGecko
 * and populates the database
 *
 * Run with: npm run fetch-data
 */

// For scripts running outside Next.js, we need to load .env manually
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env file from project root
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { dataFetcherService } from "../src/lib/modules/data-fetcher/data-fetcher.service";
import { logger } from "../src/lib/utils/logger";

async function main() {
  try {
    logger.info("🚀 Starting data initialization script...");

    await dataFetcherService.runFullDataFetch();

    logger.success("✅ Data initialization completed successfully!");
    process.exit(0);
  } catch (error) {
    logger.error("❌ Data initialization failed:", error);
    process.exit(1);
  }
}

main();
