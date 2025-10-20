import moment from "moment";

/**
 * Format date for API (YYYY-MM-DD)
 */
export function formatDateForAPI(date: Date): string {
  return moment(date).format("YYYY-MM-DD");
}

/**
 * Format date for API with time (YYYY-MM-DD HH:mm:ss)
 * Use this for hourly granularity queries
 */
export function formatDateTimeForAPI(date: Date): string {
  return moment(date).format("YYYY-MM-DD HH:mm:ss");
}
