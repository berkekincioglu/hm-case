import { NextRequest } from "next/server";
import { priceService } from "@/lib/modules/price/price.service";
import { ApiResponse } from "@/lib/utils/response";
import { logger } from "@/lib/utils/logger";
import {
  Granularity,
  BreakdownDimension,
} from "@/lib/modules/price/price.types";
import moment from "moment";

/**
 * GET /api/prices
 *
 * Fetches and aggregates cryptocurrency price data based on filters and breakdown dimensions.
 *
 * Query Parameters:
 * @param coinIds - Comma-separated coin IDs (e.g., "bitcoin,ethereum,solana")
 * @param currencyCodes - Comma-separated currency codes (e.g., "usd,eur,try")
 * @param dateFrom - Start date in ISO format (e.g., "2025-10-01")
 * @param dateTo - End date in ISO format (e.g., "2025-10-19")
 * @param breakdown - Comma-separated dimensions (e.g., "coin,currency,date")
 * @param granularity - Optional: "daily" or "hourly" (auto-detected based on date range if not provided)
 *
 * Response:
 * - 200: Array of aggregated prices
 * - 400: Invalid parameters
 * - 500: Server error
 *
 * Examples:
 * - /api/prices?coinIds=bitcoin&currencyCodes=usd&dateFrom=2025-10-01&dateTo=2025-10-19&breakdown=date
 * - /api/prices?coinIds=bitcoin,ethereum&currencyCodes=usd,try&breakdown=coin,currency,date
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const coinIdsParam = searchParams.get("coinIds");
    const currencyCodesParam = searchParams.get("currencyCodes");
    const dateFromParam = searchParams.get("dateFrom");
    const dateToParam = searchParams.get("dateTo");
    const breakdownParam = searchParams.get("breakdown");
    const granularityParam = searchParams.get("granularity");

    // Validate required parameters
    if (!dateFromParam || !dateToParam) {
      return ApiResponse.badRequest("dateFrom and dateTo are required");
    }

    // Parse arrays from comma-separated strings
    const coinIds = coinIdsParam
      ? coinIdsParam.split(",").map((id) => id.trim())
      : undefined;
    const currencyCodes = currencyCodesParam
      ? currencyCodesParam.split(",").map((code) => code.trim().toLowerCase())
      : undefined;
    const breakdown = breakdownParam
      ? (breakdownParam
          .split(",")
          .map((dim) => dim.trim()) as BreakdownDimension[])
      : undefined;

    // Parse dates
    const dateFrom = moment(dateFromParam).startOf("day").toDate();
    const dateTo = moment(dateToParam).endOf("day").toDate();

    // Validate dates
    if (!moment(dateFrom).isValid() || !moment(dateTo).isValid()) {
      return ApiResponse.badRequest(
        "Invalid date format. Use ISO format (YYYY-MM-DD)"
      );
    }

    if (dateFrom > dateTo) {
      return ApiResponse.badRequest(
        "dateFrom must be before or equal to dateTo"
      );
    }

    // Determine granularity
    // Auto-switch to hourly if date range is 2 days or less
    let granularity: Granularity;
    if (granularityParam) {
      granularity = granularityParam as Granularity;
    } else {
      const daysDiff = moment(dateTo).diff(moment(dateFrom), "days");
      granularity = daysDiff <= 2 ? "hourly" : "daily";
    }

    logger.info("Fetching prices", {
      coinIds,
      currencyCodes,
      dateFrom: moment(dateFrom).format("YYYY-MM-DD"),
      dateTo: moment(dateTo).format("YYYY-MM-DD"),
      granularity,
      breakdown,
    });

    // Fetch and aggregate prices using service
    const prices = await priceService.getPrices({
      coinIds,
      currencyCodes,
      dateFrom,
      dateTo,
      granularity,
      breakdown,
    });

    logger.success(`Fetched ${prices.length} price records`);

    return ApiResponse.success({
      data: prices,
      meta: {
        count: prices.length,
        granularity,
        dateFrom: moment(dateFrom).format("YYYY-MM-DD"),
        dateTo: moment(dateTo).format("YYYY-MM-DD"),
        breakdown: breakdown || [],
        filters: {
          coinIds: coinIds || [],
          currencyCodes: currencyCodes || [],
        },
      },
    });
  } catch (error) {
    logger.error("Failed to fetch prices", error);
    return ApiResponse.error("Failed to fetch prices", 500, error);
  }
}
