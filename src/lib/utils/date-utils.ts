import moment from "moment";

/**
 * Format date for API (YYYY-MM-DD)
 */
export function formatDateForAPI(date: Date): string {
  return moment(date).format("YYYY-MM-DD");
}
