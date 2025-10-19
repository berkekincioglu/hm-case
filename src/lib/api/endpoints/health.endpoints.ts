import { apiClient } from "../client";
import type { ApiResponse, HealthResponse } from "../types";

/**
 * Health Check Endpoints
 */
export const healthEndpoints = {
  /**
   * Check API and database health status
   */
  checkHealth: async () => {
    const response = await apiClient.get<ApiResponse<HealthResponse>>(
      "/health"
    );
    return response.data;
  },
};
