import { coinService } from "@/lib/modules/coin/coin.service";
import { ApiResponse } from "@/lib/utils/response";
import { logger } from "@/lib/utils/logger";

export async function GET() {
  try {
    const coins = await coinService.getAllCoins();

    logger.success(`Fetched ${coins.length} coins`);

    return ApiResponse.success(coins);
  } catch (error: unknown) {
    logger.error("Failed to fetch coins", error);

    return ApiResponse.serverError(
      error instanceof Error ? error.message : "Failed to fetch coins"
    );
  }
}
