import moment from "moment";
import type { NextRequest } from "next/server";

import { priceService } from "@/lib/modules/price/price.service";
import type {
  BreakdownDimension,
  Granularity,
} from "@/lib/modules/price/price.types";
import { logger } from "@/lib/utils/logger";
import { ApiResponse } from "@/lib/utils/response";

/**
 * GET /api/prices
 *
 * Fetches cryptocurrency price data with appropriate granularity.
 *
 * Query Parameters:
 * @param coinIds - Comma-separated coin IDs
 * @param currencyCodes - Comma-separated currency codes
 * @param dateFrom - Start date (YYYY-MM-DD)
 * @param dateTo - End date (YYYY-MM-DD)
 * @param breakdown - Comma-separated dimensions (coin, currency, date)
 * @param granularity - "daily" or "hourly" (defaults based on range)
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

    // Determine granularity: hourly for short ranges, daily for longer
    let granularity: Granularity;
    if (granularityParam) {
      granularity = granularityParam as Granularity;
    } else {
      const daysDiff = moment(dateTo).diff(moment(dateFrom), "days");
      granularity = daysDiff <= 7 ? "hourly" : "daily";
    }

    logger.info("Fetching prices", {
      coinIds,
      currencyCodes,
      dateFrom: moment(dateFrom).format("YYYY-MM-DD"),
      dateTo: moment(dateTo).format("YYYY-MM-DD"),
      granularity,
      breakdown,
    });

    // Fetch and aggregate prices
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
