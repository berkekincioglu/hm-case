"use client";

import { cn } from "@/lib/utils";
import { formatChartDate, formatPrice } from "@/lib/utils/chart-utils";

interface CustomChartTooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
  dataKey: string;
}

interface CustomChartTooltipProps {
  active?: boolean;
  payload?: Array<CustomChartTooltipPayloadEntry>;
  label?: string;
  granularity: "daily" | "hourly";
}

export function CustomChartTooltip({
  active,
  payload,
  label,
  granularity,
}: CustomChartTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-zinc-900 p-3 shadow-lg">
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        {formatChartDate(label as string, granularity)}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`h-2.5 w-2.5 rounded-full`}
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs font-medium">{entry.name}</span>
            </div>
            <span className="text-xs font-semibold tabular-nums">
              {formatPrice(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
