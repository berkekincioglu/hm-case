"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useChart } from "@/contexts/chart-context";
import type { TimeRange } from "@/contexts/chart-context";
import { calculateActiveTimeRange } from "@/lib/utils/time-range-utils";

import { BreakdownSelector } from "./breakdown-selector";
import { CoinSelector } from "./coin-selector";
import { CurrencySelector } from "./currency-selector";
import { SelectedCoinCards } from "./selected-coin-cards";
import { TimeRangeButtons } from "./time-range-buttons";

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "1d", label: "1 Day" },
  { value: "1w", label: "1 Week" },
  { value: "1m", label: "1 Month" },
  { value: "3m", label: "3 Months" },
  { value: "1y", label: "1 Year" },
];

export function ChartControls() {
  const {
    filters,
    updateCurrencies,
    updateCoins,
    updateBreakdown,
    setTimeRange,
    resetZoom,
  } = useChart();

  // Calculate which button should be active based on actual date range
  const activeTimeRange = calculateActiveTimeRange(
    filters.dateFrom,
    filters.dateTo
  );

  const handleRemoveCoin = (coinId: string) => {
    updateCoins(filters.selectedCoins.filter((id) => id !== coinId));
  };

  return (
    <div className="space-y-3">
      {/* First Row: All Controls with justify-between */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 justify-between">
        {/* Left Group: Currency and Coin Selectors */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <CurrencySelector
            selectedCurrencies={filters.selectedCurrencies}
            onCurrenciesChange={updateCurrencies}
          />
          <CoinSelector
            selectedCoins={filters.selectedCoins}
            onCoinsChange={updateCoins}
          />
        </div>

        {/* Right Group: Time Range and Breakdown */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
          {/* Time Range - Buttons on Desktop, Dropdown on Mobile */}
          <div className="flex-shrink-0 w-full sm:w-auto">
            {/* Mobile Dropdown */}
            <div className="sm:hidden">
              <Select
                value={activeTimeRange || "1m"}
                onValueChange={(value) => setTimeRange(value as TimeRange)}
              >
                <SelectTrigger className="h-8 w-full">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_RANGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Desktop Buttons */}
            <div className="hidden sm:block">
              <TimeRangeButtons
                activeTimeRange={activeTimeRange}
                onTimeRangeChange={setTimeRange}
              />
            </div>
          </div>

          {/* Breakdown Selector */}
          <div className="flex-shrink-0 w-full sm:w-auto">
            <BreakdownSelector
              selectedBreakdown={filters.breakdown}
              onBreakdownChange={updateBreakdown}
            />
          </div>

          {/* Reset Zoom Button */}
          {filters.isZoomed && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetZoom}
              className="h-8 w-full sm:w-auto"
            >
              Reset zoom
            </Button>
          )}
        </div>
      </div>

      {/* Second Row: Selected Coins Cards */}
      {filters.selectedCoins.length > 0 && (
        <SelectedCoinCards
          selectedCoins={filters.selectedCoins}
          onRemoveCoin={handleRemoveCoin}
        />
      )}
    </div>
  );
}
