import type { NextRequest } from "next/server";

import { dataFetcherService } from "@/lib/modules/data-fetcher/data-fetcher.service";
import { logger } from "@/lib/utils/logger";
import { ApiResponse } from "@/lib/utils/response";

/**
 * POST /api/cron/fetch-data
 *
 * Scheduled endpoint for fetching cryptocurrency price data from CoinGecko API.
 * This endpoint is designed to be triggered by AWS EventBridge or any external cron service.
 *
 * Security:
 * - Requires CRON_SECRET environment variable to prevent unauthorized access
 * - Should only be called by trusted services (AWS EventBridge, CloudWatch, etc.)
 *
 * Usage:
 * - Local testing: curl -X POST http://localhost:3000/api/cron/fetch-data -H "Authorization: Bearer YOUR_CRON_SECRET"
 * - Production: Triggered automatically by AWS EventBridge every 24 hours
 *
 * @returns 200 - Data fetched successfully
 * @returns 401 - Unauthorized (missing or invalid secret)
 * @returns 500 - Server error during data fetch
 */
export async function POST(request: NextRequest) {
  try {
    // Security: Verify cron secret
    const authHeader = request.headers.get("authorization");
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
      logger.error("CRON_SECRET environment variable not configured");
      return ApiResponse.error("Cron job not configured", 500);
    }

    // Extract token from "Bearer <token>" format
    const providedSecret = authHeader?.replace("Bearer ", "");

    if (providedSecret !== expectedSecret) {
      logger.warn("Unauthorized cron job attempt", {
        providedSecret: `${providedSecret?.substring(0, 8)}...`,
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });
      return ApiResponse.error("Unauthorized", 401);
    }

    logger.info("Cron job triggered - starting data fetch");

    // Run the data fetch asynchronously to avoid timeout
    // cleanFirst=false: Don't delete existing data, just add new/update existing
    // This prevents data loss if cron runs while users are viewing the dashboard
    dataFetcherService
      .runFullDataFetch(false)
      .then(() => {
        logger.success("Cron job completed successfully");
      })
      .catch((error) => {
        logger.error("Cron job failed during async execution", error);
      });

    // Return 202 (Accepted) immediately - processing will continue in background
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          message: "Data fetch started successfully",
          timestamp: new Date().toISOString(),
          status: "processing",
        },
      }),
      {
        status: 202,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    logger.error("Cron job failed", error);
    return ApiResponse.error("Failed to fetch data", 500, error);
  }
}

/**
 * GET /api/cron/fetch-data
 *
 * Health check endpoint for the cron job.
 * Used by monitoring services to verify the endpoint is accessible.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;
  const providedSecret = authHeader?.replace("Bearer ", "");

  if (providedSecret !== expectedSecret) {
    return ApiResponse.error("Unauthorized", 401);
  }

  return ApiResponse.success({
    status: "ready",
    endpoint: "/api/cron/fetch-data",
    method: "POST",
    description: "Scheduled data fetch endpoint for CoinGecko API",
  });
}
