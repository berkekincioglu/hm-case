"use client";

import { Button } from "@/components/ui/button";
import type { BreakdownDimension, TimeRange } from "@/contexts/chart-context";

import { BreakdownSelector } from "./breakdown-selector";
import { TimeRangeButtons } from "./time-range-buttons";

interface TimeAndBreakdownControlsProps {
  activeTimeRange: TimeRange | null;
  selectedBreakdown: BreakdownDimension[];
  isZoomed: boolean;
  onTimeRangeChange: (range: TimeRange) => void;
  onBreakdownChange: (breakdown: BreakdownDimension[]) => void;
  onResetZoom: () => void;
}

export function TimeAndBreakdownControls({
  activeTimeRange,
  selectedBreakdown,
  isZoomed,
  onTimeRangeChange,
  onBreakdownChange,
  onResetZoom,
}: TimeAndBreakdownControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
      {/* Time Range */}
      <div className="flex-shrink-0 w-full sm:w-auto">
        <TimeRangeButtons
          activeTimeRange={activeTimeRange}
          onTimeRangeChange={onTimeRangeChange}
        />
      </div>

      {/* Breakdown Selector */}
      <div className="flex-shrink-0 w-full sm:w-auto">
        <BreakdownSelector
          selectedBreakdown={selectedBreakdown}
          onBreakdownChange={onBreakdownChange}
        />
      </div>

      {/* Reset Zoom Button */}
      {isZoomed && (
        <Button
          variant="outline"
          size="sm"
          onClick={onResetZoom}
          className="h-8 w-full sm:w-auto"
        >
          Reset zoom
        </Button>
      )}
    </div>
  );
}
