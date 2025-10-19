import moment from "moment";

import { apiClient } from "../client";
import type { ApiResponse, PricesResponse } from "../types";

/**
 * Price Endpoints
 */

export interface GetPricesParams {
  coinIds?: string[];
  currencyCodes?: string[];
  dateFrom: string | Date;
  dateTo: string | Date;
  breakdown?: string[];
  granularity?: "daily" | "hourly";
}

export const priceEndpoints = {
  /**
   * Get price data with filters and breakdown dimensions
   * Supports multiple coins, currencies, date ranges, and aggregation options
   */
  getPrices: async (params: GetPricesParams) => {
    const { coinIds, currencyCodes, dateFrom, dateTo, breakdown, granularity } =
      params;

    const queryParams = new URLSearchParams();

    if (coinIds && coinIds.length > 0) {
      queryParams.append("coinIds", coinIds.join(","));
    }
    if (currencyCodes && currencyCodes.length > 0) {
      queryParams.append("currencyCodes", currencyCodes.join(","));
    }
    queryParams.append(
      "dateFrom",
      typeof dateFrom === "string"
        ? dateFrom
        : moment(dateFrom).format("YYYY-MM-DD")
    );
    queryParams.append(
      "dateTo",
      typeof dateTo === "string" ? dateTo : moment(dateTo).format("YYYY-MM-DD")
    );
    if (breakdown && breakdown.length > 0) {
      queryParams.append("breakdown", breakdown.join(","));
    }
    if (granularity) {
      queryParams.append("granularity", granularity);
    }

    const response = await apiClient.get<ApiResponse<PricesResponse>>(
      `/prices?${queryParams.toString()}`
    );
    return response.data;
  },
};
