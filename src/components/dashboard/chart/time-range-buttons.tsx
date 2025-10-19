"use client";

import { Button } from "@/components/ui/button";
import type { TimeRange } from "@/contexts/chart-context";

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "1d", label: "1D" },
  { value: "1w", label: "1W" },
  { value: "1m", label: "1M" },
  { value: "3m", label: "3M" },
  { value: "1y", label: "1Y" },
];

interface TimeRangeButtonsProps {
  activeTimeRange: TimeRange | null;
  onTimeRangeChange: (range: TimeRange) => void;
}

export function TimeRangeButtons({
  activeTimeRange,
  onTimeRangeChange,
}: TimeRangeButtonsProps) {
  return (
    <div className="flex gap-1 rounded-md border p-1">
      {TIME_RANGES.map((range) => (
        <Button
          key={range.value}
          variant={activeTimeRange === range.value ? "default" : "ghost"}
          size="sm"
          onClick={() => onTimeRangeChange(range.value)}
          className="h-8 px-3"
        >
          {range.label}
        </Button>
      ))}
    </div>
  );
}
