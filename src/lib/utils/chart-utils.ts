import moment from "moment";

import type { PriceData } from "@/lib/api/types";

export interface ChartDataPoint {
  date: string;
  [key: string]: number | string; // Dynamic keys for different coin/currency combinations
}

/**
 * Transform API price data into chart-friendly format
 */
export function transformPriceDataForChart(
  data: PriceData[],
  _granularity: "daily" | "hourly",
  singleCurrency: boolean = false
): ChartDataPoint[] {
  const grouped = new Map<string, Record<string, number>>();

  data.forEach((item) => {
    const dateKey = item.date || "";

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, {});
    }

    const group = grouped.get(dateKey)!;

    const seriesKey =
      singleCurrency && item.coin
        ? item.coin.toUpperCase()
        : [item.coin, item.currency]
            .filter(Boolean)
            .map((v) => v?.toUpperCase())
            .join("-") || "Price";

    group[seriesKey] = item.price;
  });

  const result: ChartDataPoint[] = Array.from(grouped.entries()).map(
    ([date, values]) => ({
      date,
      ...values,
    })
  );

  result.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return result;
}

/**
 * Format date for chart display based on granularity
 */
export function formatChartDate(
  dateString: string,
  granularity: "daily" | "hourly"
): string {
  if (granularity === "hourly") {
    return moment(dateString).format("MMM D, HH:mm");
  }
  return moment(dateString).format("MMM D");
}

/**
 * Get unique series keys from chart data (for legend)
 */
export function getSeriesKeys(data: ChartDataPoint[]): string[] {
  if (data.length === 0) return [];

  const keys = Object.keys(data[0]).filter((key) => key !== "date");
  return keys;
}

/**
 * Generate color for a series (coin-currency combination)
 */
export function getSeriesColor(index: number): string {
  const colors = [
    "#3b82f6", // blue-500
    "#10b981", // emerald-500
    "#f59e0b", // amber-500
    "#ef4444", // red-500
    "#8b5cf6", // violet-500
    "#ec4899", // pink-500
  ];

  return colors[index % colors.length];
}

/**
 * Format price with comma separators and appropriate decimals
 */
export function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  if (price >= 1) {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  }

  return price.toLocaleString("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 8,
  });
}
