import { prisma } from "@/lib/db/prisma";
import { ApiResponse } from "@/lib/utils/response";
import { logger } from "@/lib/utils/logger";

export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    // Get database stats
    const [coinCount, currencyCount, dailyPriceCount, hourlyPriceCount] =
      await Promise.all([
        prisma.coin.count(),
        prisma.currency.count(),
        prisma.priceDaily.count(),
        prisma.priceHourly.count(),
      ]);

    const healthData = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "Cryptocurrency Price Dashboard API",
      database: {
        status: "connected",
        type: "PostgreSQL",
        stats: {
          coins: coinCount,
          currencies: currencyCount,
          dailyPrices: dailyPriceCount,
          hourlyPrices: hourlyPriceCount,
        },
      },
      environment: process.env.NODE_ENV,
      version: "1.0.0",
    };

    logger.success("Health check passed", healthData);

    return ApiResponse.success(healthData, "System is healthy");
  } catch (error: unknown) {
    logger.error("Health check failed", error);

    return ApiResponse.error("Health check failed", 503, {
      database: "disconnected",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
