import { useQuery } from "@tanstack/react-query";
import moment from "moment";

import type { BreakdownDimension } from "@/contexts/dashboard-context";
import { api } from "@/lib/api/endpoints";

interface UsePricesOptions {
  coinIds: string[];
  currencyCodes: string[];
  dateFrom: Date;
  dateTo: Date;
  breakdown: BreakdownDimension[];
  enabled?: boolean;
}

export function usePrices(params: UsePricesOptions) {
  const { coinIds, currencyCodes, dateFrom, dateTo, breakdown, enabled } =
    params;

  const dateFromStr = moment(dateFrom).format("YYYY-MM-DD");
  const dateToStr = moment(dateTo).format("YYYY-MM-DD");

  // Only fetch prices when all required filters are valid:
  // - Hook is explicitly enabled
  // - At least one coin is selected
  // - At least one currency is selected
  // - Both date range values are provided
  const hasValidFiltersToFetchPrices =
    enabled &&
    coinIds.length > 0 &&
    currencyCodes.length > 0 &&
    !!dateFrom &&
    !!dateTo;

  return useQuery({
    queryKey: [
      "prices",
      coinIds,
      currencyCodes,
      dateFromStr,
      dateToStr,
      breakdown,
    ],
    queryFn: () =>
      api.prices.getPrices({
        coinIds,
        currencyCodes,
        dateFrom: dateFromStr,
        dateTo: dateToStr,
        breakdown,
      }),
    enabled: hasValidFiltersToFetchPrices,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
