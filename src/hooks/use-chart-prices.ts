import { useQuery } from "@tanstack/react-query";
import moment from "moment";

import { useChart } from "@/contexts/chart-context";
import { api } from "@/lib/api/endpoints";
import { formatDateForAPI } from "@/lib/utils/date-utils";

/**
 * Hook to fetch price data for the chart component
 * Automatically selects granularity based on date range and supports breakdown dimensions
 */
export function useChartPrices() {
  const { filters } = useChart();
  const { selectedCurrencies, selectedCoins, breakdown, dateFrom, dateTo } =
    filters;

  const hasValidFilters =
    selectedCoins.length > 0 && selectedCurrencies.length > 0;

  // Determine granularity based on date range: ≤2 days = hourly, >2 days = daily
  const daysDiff = moment(dateTo).diff(moment(dateFrom), "days", true);
  const granularity = daysDiff <= 2 ? "hourly" : "daily";

  return useQuery({
    queryKey: [
      "chart-prices",
      selectedCoins,
      selectedCurrencies,
      formatDateForAPI(dateFrom),
      formatDateForAPI(dateTo),
      breakdown,
      granularity,
    ],
    queryFn: () =>
      api.prices.getPrices({
        coinIds: selectedCoins,
        currencyCodes: selectedCurrencies,
        dateFrom: formatDateForAPI(dateFrom),
        dateTo: formatDateForAPI(dateTo),
        breakdown,
        granularity,
      }),
    enabled: hasValidFilters,
    staleTime: 2 * 60 * 1000,
  });
}
