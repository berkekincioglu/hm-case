"use client";

import moment from "moment";
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

export type TimeRange = "1h" | "1d" | "1w" | "1m" | "3m" | "1y";
export type BreakdownDimension = "coin" | "currency" | "date";

interface ChartFilters {
  selectedCurrencies: string[]; // Changed from single to array
  selectedCoins: string[];
  breakdown: BreakdownDimension[]; // New: breakdown dimensions
  timeRange: TimeRange;
  dateFrom: Date;
  dateTo: Date;
  isZoomed: boolean;
  lastTimeRange: TimeRange; // Keep track of the last selected button
}

interface ChartContextType {
  filters: ChartFilters;
  updateCurrencies: (currencies: string[]) => void; // Changed from updateCurrency
  updateCoins: (coins: string[]) => void;
  updateBreakdown: (breakdown: BreakdownDimension[]) => void; // New
  setTimeRange: (range: TimeRange) => void;
  setZoomRange: (from: Date, to: Date) => void;
  resetZoom: () => void;
}

const ChartContext = createContext<ChartContextType | undefined>(undefined);

export function ChartProvider({ children }: { children: ReactNode }) {
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([
    "usd",
    "try",
  ]); // Default: USD, TRY
  const [selectedCoins, setSelectedCoins] = useState<string[]>([
    "bitcoin",
    "ethereum",
    "dogecoin",
  ]);
  const [breakdown, setBreakdown] = useState<BreakdownDimension[]>([
    "date",
    "coin",
    "currency",
  ]); // Default breakdown
  const [timeRange, setTimeRangeState] = useState<TimeRange>("1m"); // Default to 1 month
  const [isZoomed, setIsZoomed] = useState(false);

  // Default date range: Last 30 days from today
  const [dateFrom, setDateFrom] = useState<Date>(
    moment().subtract(30, "days").startOf("day").toDate()
  );
  const [dateTo, setDateTo] = useState<Date>(moment().endOf("day").toDate());

  const calculateDatesFromTimeRange = (
    range: TimeRange
  ): { from: Date; to: Date } => {
    const to = moment().toDate();
    let from: Date;

    switch (range) {
      case "1h":
        // Keep for backwards compatibility but not shown in UI
        from = moment().subtract(12, "hours").startOf("hour").toDate();
        break;
      case "1d":
        // 1D view: last 1 day (will show hourly view since ≤2 days)
        from = moment().subtract(1, "day").startOf("day").toDate();
        break;
      case "1w":
        from = moment().subtract(7, "days").startOf("day").toDate();
        break;
      case "1m":
        from = moment().subtract(30, "days").startOf("day").toDate();
        break;
      case "3m":
        from = moment().subtract(90, "days").startOf("day").toDate();
        break;
      case "1y":
        from = moment().subtract(365, "days").startOf("day").toDate();
        break;
      default:
        from = moment().subtract(30, "days").startOf("day").toDate();
    }

    return { from, to };
  };

  const updateCurrencies = (currencies: string[]) => {
    setSelectedCurrencies(currencies);
  };

  const updateCoins = (coins: string[]) => {
    setSelectedCoins(coins);
  };

  const updateBreakdown = (newBreakdown: BreakdownDimension[]) => {
    setBreakdown(newBreakdown);
  };

  const setTimeRange = (range: TimeRange) => {
    setTimeRangeState(range);
    const { from, to } = calculateDatesFromTimeRange(range);
    setDateFrom(from);
    setDateTo(to);
    setIsZoomed(false);
  };

  const setZoomRange = (from: Date, to: Date) => {
    // Ensure dates are properly formatted
    // For daily data, ensure we capture the full day range
    const fromDate = moment(from).startOf("day").toDate();
    const toDate = moment(to).endOf("day").toDate();

    setDateFrom(fromDate);
    setDateTo(toDate);
    setIsZoomed(true);
    // Keep timeRange as-is, but isZoomed=true will deselect buttons visually
  };

  const resetZoom = () => {
    const { from, to } = calculateDatesFromTimeRange(timeRange);
    setDateFrom(from);
    setDateTo(to);
    setIsZoomed(false);
  };

  const filters: ChartFilters = {
    selectedCurrencies,
    selectedCoins,
    breakdown,
    timeRange,
    dateFrom,
    dateTo,
    isZoomed,
    lastTimeRange: timeRange, // Track last selected time range button
  };

  return (
    <ChartContext.Provider
      value={{
        filters,
        updateCurrencies,
        updateCoins,
        updateBreakdown,
        setTimeRange,
        setZoomRange,
        resetZoom,
      }}
    >
      {children}
    </ChartContext.Provider>
  );
}

export function useChart() {
  const context = useContext(ChartContext);
  if (context === undefined) {
    throw new Error("useChart must be used within a ChartProvider");
  }
  return context;
}
