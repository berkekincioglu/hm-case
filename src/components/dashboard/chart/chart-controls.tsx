"use client";

import { useChart } from "@/contexts/chart-context";
import { calculateActiveTimeRange } from "@/lib/utils/time-range-utils";

import { CoinSelector } from "./coin-selector";
import { CurrencySelector } from "./currency-selector";
import { SelectedCoinCards } from "./selected-coin-cards";
import { TimeAndBreakdownControls } from "./time-and-breakdown-controls";

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

        {/* Time Range and Breakdown */}
        <TimeAndBreakdownControls
          activeTimeRange={activeTimeRange}
          selectedBreakdown={filters.breakdown}
          isZoomed={filters.isZoomed}
          onTimeRangeChange={setTimeRange}
          onBreakdownChange={updateBreakdown}
          onResetZoom={resetZoom}
        />
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
