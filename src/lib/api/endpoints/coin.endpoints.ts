import { apiClient } from "../client";
import type { ApiResponse, Coin, CoinMetadata } from "../types";

/**
 * Coin Endpoints
 */

export interface GetCoinMetadataParams {
  coinId: string;
}

export const coinEndpoints = {
  /**
   * Get all available coins
   */
  getAll: async () => {
    const response = await apiClient.get<ApiResponse<Coin[]>>("/coins");
    return response.data;
  },

  /**
   * Get coin metadata (description, image, homepage)
   * Used for displaying detailed coin information in tooltips
   */
  getMetadata: async (params: GetCoinMetadataParams) => {
    const { coinId } = params;
    const response = await apiClient.get<ApiResponse<CoinMetadata>>(
      `/coins/${coinId}/metadata`
    );
    return response.data;
  },
};
