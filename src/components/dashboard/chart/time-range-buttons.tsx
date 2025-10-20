"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TimeRange } from "@/contexts/chart-context";

const TIME_RANGES: { value: TimeRange; label: string; fullLabel: string }[] = [
  { value: "1d", label: "1D", fullLabel: "1 Day" },
  { value: "1w", label: "1W", fullLabel: "1 Week" },
  { value: "1m", label: "1M", fullLabel: "1 Month" },
  { value: "3m", label: "3M", fullLabel: "3 Months" },
  { value: "1y", label: "1Y", fullLabel: "1 Year" },
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
    <>
      {/* Mobile Dropdown */}
      <div className="sm:hidden">
        <Select
          value={activeTimeRange || "1m"}
          onValueChange={(value) => onTimeRangeChange(value as TimeRange)}
        >
          <SelectTrigger className="h-8 w-full">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            {TIME_RANGES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.fullLabel}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Buttons */}
      <div className="hidden sm:block">
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
      </div>
    </>
  );
}
