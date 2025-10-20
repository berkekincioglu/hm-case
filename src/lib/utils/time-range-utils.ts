import moment from "moment";

import type { TimeRange } from "@/contexts/chart-context";

/**
 * Calculate which time range button should be selected based on the actual date range
 * Uses ranges that match what each button actually displays
 */
export function calculateActiveTimeRange(
  dateFrom: Date,
  dateTo: Date
): TimeRange | null {
  const diffInHours = Math.abs(
    (dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60)
  );
  const diffInDays = diffInHours / 24;

  // 1D: <= 2 days (hourly view)
  if (diffInDays <= 2.1) {
    return "1d";
  }
  // 1W: approximately 7 days
  if (diffInDays >= 6 && diffInDays <= 8) {
    return "1w";
  }
  // 1M: approximately 30 days
  if (diffInDays >= 28 && diffInDays <= 32) {
    return "1m";
  }
  // 3M: approximately 90 days
  if (diffInDays >= 85 && diffInDays <= 95) {
    return "3m";
  }
  // 1Y: approximately 365 days
  if (diffInDays >= 360 && diffInDays <= 370) {
    return "1y";
  }

  // If no exact match, find the closest range
  if (diffInDays < 6) return "1d";
  if (diffInDays < 28) return "1w";
  if (diffInDays < 85) return "1m";
  if (diffInDays < 360) return "3m";
  return "1y";
}

export const calculateDatesFromTimeRange = (
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
