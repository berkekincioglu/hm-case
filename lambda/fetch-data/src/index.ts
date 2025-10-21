import type { Handler } from "aws-lambda";

import { dataFetcherService } from "./services/data-fetcher.service";
import { logger } from "./utils/logger";

interface LambdaResponse {
  statusCode: number;
  body: string;
}

/**
 * Lambda handler for daily cryptocurrency data fetch
 * Directly fetches from CoinGecko API and writes to PostgreSQL database
 */
export const handler: Handler = async (): Promise<LambdaResponse> => {
  const startTime = Date.now();

  try {
    logger.info("Cron job started");

    // Run the full data fetch
    await dataFetcherService.runFullDataFetch();

    const duration = Date.now() - startTime;
    logger.info(`Cron job completed successfully in ${duration}ms`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Data fetch completed successfully",
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Cron job failed", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: "Data fetch failed",
        message: error instanceof Error ? error.message : "Unknown error",
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};
