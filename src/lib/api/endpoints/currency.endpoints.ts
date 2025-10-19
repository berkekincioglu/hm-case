import { apiClient } from "../client";
import type { ApiResponse, Currency } from "../types";

/**
 * Currency Endpoints
 */
export const currencyEndpoints = {
  /**
   * Get all available currencies
   */
  getAll: async () => {
    const response = await apiClient.get<ApiResponse<Currency[]>>(
      "/currencies"
    );
    return response.data;
  },
};
