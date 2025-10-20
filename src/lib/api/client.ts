import axios from "axios";

/**
 * Axios client for API requests
 * Configured with base URL and default headers
 */
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds
});
