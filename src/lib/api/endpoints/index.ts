/**
 * API Endpoints Index
 *
 * Centralized export for all API endpoints organized by module.
 * This structure makes it easy to:
 * - Find endpoints by domain (coins, prices, currencies, etc.)
 * - Scale to hundreds of endpoints without a messy single file
 * - Maintain clear separation of concerns
 *
 * Usage:
 * import { api } from '@/lib/api/endpoints';
 * await api.coins.getAll();
 * await api.prices.getPrices({ ... });
 */

import { coinEndpoints } from "./coin.endpoints";
import { currencyEndpoints } from "./currency.endpoints";
import { healthEndpoints } from "./health.endpoints";
import { priceEndpoints } from "./price.endpoints";

export const api = {
  health: healthEndpoints,
  coins: coinEndpoints,
  currencies: currencyEndpoints,
  prices: priceEndpoints,
};

// Re-export types for convenience
export type { GetPricesParams } from "./price.endpoints";
export type { GetCoinMetadataParams } from "./coin.endpoints";
