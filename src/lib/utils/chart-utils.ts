import moment from "moment";

import type { PriceData } from "@/lib/api/types";

export interface ChartDataPoint {
  date: string;
  [key: string]: number | string; // Dynamic keys for different coin/currency combinations
}

/**
 * Transform API price data into chart-friendly format
 * Handles different breakdown combinations dynamically
 */
export function transformPriceDataForChart(
  data: PriceData[],
  _granularity: "daily" | "hourly",
  breakdown: string[] = ["date", "coin"]
): ChartDataPoint[] {
  const grouped = new Map<string, Record<string, number>>();

  // Determine if we need to show coin, currency, or both in series keys
  const showCoin = breakdown.includes("coin");
  const showCurrency = breakdown.includes("currency");
  const showDate = breakdown.includes("date");

  data.forEach((item) => {
    // Use date as grouping key if date is in breakdown, otherwise use a constant
    const dateKey = showDate ? item.date || "" : "all";

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, {});
    }

    const group = grouped.get(dateKey)!;

    // Build series key based on breakdown dimensions
    const keyParts: string[] = [];
    if (showCoin && item.coin) {
      keyParts.push(item.coin.toUpperCase());
    }
    if (showCurrency && item.currency) {
      keyParts.push(item.currency.toUpperCase());
    }

    // If only date is selected, show as "Average Price"
    const seriesKey =
      keyParts.length > 0 ? keyParts.join("-") : "Average Price";

    // If multiple data points map to same series (e.g., only date breakdown with multiple coins)
    // we average them (already aggregated by backend, but handle edge cases)
    if (group[seriesKey]) {
      group[seriesKey] = (group[seriesKey] + item.price) / 2;
    } else {
      group[seriesKey] = item.price;
    }
  });

  const result: ChartDataPoint[] = Array.from(grouped.entries()).map(
    ([date, values]) => ({
      date,
      ...values,
    })
  );

  // Sort by date if date is in breakdown
  if (showDate) {
    result.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

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
  if (price === 0) return "0";

  // For very large numbers (over 1M), use compact notation
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(2)}M`;
  }

  // For large numbers (over 100K), use K notation
  if (price >= 100000) {
    return `${(price / 1000).toFixed(1)}K`;
  }

  // For numbers over 1000, show with commas and 2 decimals
  if (price >= 1000) {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  // For numbers >= 1, show 2-4 decimals
  if (price >= 1) {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  }

  // For small numbers < 1, show significant digits
  if (price >= 0.01) {
    return price.toFixed(4);
  }

  if (price >= 0.0001) {
    return price.toFixed(6);
  }

  // For very small numbers, use exponential notation
  return price.toExponential(2);
}

/**
 * Format price for tooltip with full precision
 */
export function formatPriceTooltip(price: number): string {
  if (price === 0) return "0";

  // For large numbers, show full value with commas
  if (price >= 1000) {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  // For numbers >= 1, show up to 4 decimals
  if (price >= 1) {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  }

  // For small numbers < 1, show up to 8 decimals
  if (price >= 0.00000001) {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    });
  }

  // For extremely small numbers, use exponential
  return price.toExponential(4);
}
