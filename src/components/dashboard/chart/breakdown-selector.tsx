"use client";

import { Button } from "@/components/ui/button";
import type { BreakdownDimension } from "@/contexts/chart-context";

interface BreakdownSelectorProps {
  selectedBreakdown: BreakdownDimension[];
  onBreakdownChange: (breakdown: BreakdownDimension[]) => void;
}

const BREAKDOWN_OPTIONS: {
  value: BreakdownDimension;
  label: string;
}[] = [
  { value: "date", label: "Date" },
  { value: "coin", label: "Coin" },
  { value: "currency", label: "Currency" },
];

export function BreakdownSelector({
  selectedBreakdown,
  onBreakdownChange,
}: BreakdownSelectorProps) {
  const handleToggle = (dimension: BreakdownDimension) => {
    if (selectedBreakdown.includes(dimension)) {
      // Remove if already selected
      const updated = selectedBreakdown.filter((d) => d !== dimension);
      // Don't allow empty selection
      if (updated.length > 0) {
        onBreakdownChange(updated);
      }
    } else {
      // Add to selection
      onBreakdownChange([...selectedBreakdown, dimension]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <div className="flex flex-wrap gap-1 rounded-md border p-1">
        {BREAKDOWN_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={
              selectedBreakdown.includes(option.value) ? "outline" : "ghost"
            }
            size="sm"
            onClick={() => handleToggle(option.value)}
            className="h-8 px-3"
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
