import { currencyService } from "@/lib/modules/currency/currency.service";
import { ApiResponse } from "@/lib/utils/response";
import { logger } from "@/lib/utils/logger";

export async function GET() {
  try {
    const currencies = await currencyService.getAllCurrencies();

    logger.success(`Fetched ${currencies.length} currencies`);

    return ApiResponse.success(currencies);
  } catch (error: unknown) {
    logger.error("Failed to fetch currencies", error);

    return ApiResponse.serverError(
      error instanceof Error ? error.message : "Failed to fetch currencies"
    );
  }
}
