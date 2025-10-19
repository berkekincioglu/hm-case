import { useQuery } from "@tanstack/react-query";
import moment from "moment";

import { useChart } from "@/contexts/chart-context";
import { api } from "@/lib/api/endpoints";
import { formatDateForAPI } from "@/lib/utils/date-utils";

/**
 * Hook to fetch price data for the chart component
 * Automatically selects granularity based on date range and time range selection
 */
export function useChartPrices() {
  const { filters } = useChart();
  const { selectedCurrency, selectedCoins, dateFrom, dateTo } = filters;

  const hasValidFilters =
    selectedCoins.length > 0 && selectedCurrency.length > 0;

  // Determine granularity based on date range: ≤2 days = hourly, >2 days = daily
  const daysDiff = moment(dateTo).diff(moment(dateFrom), "days", true);
  const granularity = daysDiff <= 2 ? "hourly" : "daily";

  return useQuery({
    queryKey: [
      "chart-prices",
      selectedCoins,
      selectedCurrency,
      formatDateForAPI(dateFrom),
      formatDateForAPI(dateTo),
      granularity,
    ],
    queryFn: () =>
      api.prices.getPrices({
        coinIds: selectedCoins,
        currencyCodes: [selectedCurrency],
        dateFrom: formatDateForAPI(dateFrom),
        dateTo: formatDateForAPI(dateTo),
        breakdown: ["date", "coin"],
        granularity,
      }),
    enabled: hasValidFilters,
    staleTime: 2 * 60 * 1000,
  });
}
