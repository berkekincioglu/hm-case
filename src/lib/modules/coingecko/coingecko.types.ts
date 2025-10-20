/**
 * CoinGecko API Type Definitions
 *
 * These types define the structure of data we receive from CoinGecko API
 * and the parameters we send to it.
 *
 * WHY TYPESCRIPT TYPES MATTER:
 * ============================
 * 1. Type Safety: Catch errors at compile time, not runtime
 * 2. IntelliSense: Auto-completion in your IDE
 * 3. Documentation: Types serve as inline documentation
 * 4. Refactoring: Changes propagate automatically
 * 5. API Contract: Clearly defines what we expect from CoinGecko
 */

/**
 * Coin List Item
 *
 * Represents a single cryptocurrency from the /coins/list endpoint
 *
 * ENDPOINT: GET /api/v3/coins/list
 *
 * EXAMPLE:
 * {
 *   "id": "bitcoin",
 *   "symbol": "btc",
 *   "name": "Bitcoin"
 * }
 *
 * FIELDS EXPLAINED:
 * - id: CoinGecko's unique identifier (used in API calls)
 * - symbol: Ticker symbol (lowercase, may differ from exchange symbols)
 * - name: Human-readable name
 *
 * USAGE:
 * We use this to populate our 'coins' database table during initialization.
 */
export interface CoinListItem {
  id: string; // e.g., "bitcoin", "ethereum", "ripple" (NOT "xrp")
  symbol: string; // e.g., "btc", "eth", "xrp"
  name: string; // e.g., "Bitcoin", "Ethereum", "XRP"
}

/**
 * Market Chart Range Response
 *
 * Response structure from /coins/{id}/market_chart/range endpoint
 *
 * ENDPOINT: GET /api/v3/coins/{id}/market_chart/range
 *
 * EXAMPLE:
 * {
 *   "prices": [
 *     [1719792000000, 61234.56],
 *     [1719795600000, 61345.78]
 *   ],
 *   "market_caps": [
 *     [1719792000000, 1234567890123]
 *   ],
 *   "total_volumes": [
 *     [1719792000000, 12345678901]
 *   ]
 * }
 *
 * ARRAY FORMAT:
 * Each sub-array is [timestamp_in_milliseconds, value]
 * - Timestamp: JavaScript-compatible (ms since epoch)
 * - Value: Number (price, market cap, or volume)
 *
 * DATA GRANULARITY:
 * CoinGecko adjusts automatically based on date range:
 * - 1 day: 5-minute intervals
 * - 2-90 days: hourly intervals  ← Our use case (July-August = 62 days)
 * - 90+ days: daily intervals
 *
 * WHY [number, number][] INSTEAD OF OBJECTS:
 * - More compact data format
 * - Faster to parse
 * - CoinGecko's standard format
 * - Easy to convert to our database format
 */
export interface MarketChartRange {
  // Array of [timestamp, price] pairs
  // timestamp: milliseconds since Unix epoch
  // price: cryptocurrency price in the requested fiat currency
  prices: [number, number][];

  // Array of [timestamp, market_cap] pairs
  // market_cap: total market capitalization in fiat currency
  // Calculated as: circulating_supply × current_price
  market_caps: [number, number][];

  // Array of [timestamp, volume] pairs
  // volume: total trading volume in fiat currency over the time period
  total_volumes: [number, number][];
}

/**
 * Coin Detail Response (Bonus Feature)
 *
 * Detailed metadata about a cryptocurrency
 *
 * ENDPOINT: GET /api/v3/coins/{id}
 *
 * PURPOSE:
 * Used for the bonus tooltip feature that shows coin info on hover
 *
 * EXAMPLE:
 * {
 *   "id": "bitcoin",
 *   "symbol": "btc",
 *   "name": "Bitcoin",
 *   "description": {
 *     "en": "Bitcoin is the first successful internet money..."
 *   },
 *   "image": {
 *     "thumb": "https://...",
 *     "small": "https://...",
 *     "large": "https://..."
 *   },
 *   "links": {
 *     "homepage": ["https://bitcoin.org/", "", ""]
 *   }
 * }
 *
 * WHY OPTIONAL FIELDS (?)
 * Not all coins have all fields:
 * - Some coins lack descriptions
 * - Some coins don't have images
 * - Optional makes our code more robust
 */
export interface CoinDetail {
  id: string;
  symbol: string;
  name: string;

  // Description in multiple languages
  // We only fetch English ('en') to save bandwidth
  description?: {
    en?: string; // English description (can be very long)
  };

  // Logo images in multiple sizes
  // thumb: 60x60px, small: 100x100px, large: 200x200px
  image?: {
    thumb?: string; // URL to thumbnail image
    small?: string; // URL to small image
    large?: string; // URL to large image
  };

  // External links (website, blockchain explorer, etc.)
  links?: {
    homepage?: string[]; // Array of official websites (first is primary)
  };
}

/**
 * CoinGecko Service Configuration
 *
 * Configuration object for initializing the CoinGecko service
 *
 * USAGE:
 * Currently loaded from environment variables, but this type
 * allows for future flexibility (e.g., different configs per environment)
 */
export interface CoinGeckoConfig {
  apiKey: string; // Your CoinGecko API key
  baseUrl: string; // API base URL (usually https://api.coingecko.com/api/v3)
  rateLimitDelay?: number; // Optional: custom rate limit delay (default: 2000ms)
}

/**
 * Fetch Price Parameters
 *
 * Parameters for fetching historical price data
 *
 * USAGE:
 * Passed to getMarketChartRange() method
 *
 * EXAMPLE:
 * {
 *   coinId: "bitcoin",
 *   currency: "usd",
 *   from: 1719792000,  // July 1, 2025 in Unix seconds
 *   to: 1722470399     // July 31, 2025 in Unix seconds
 * }
 *
 * TIMESTAMP FORMAT:
 * CoinGecko expects Unix timestamps in SECONDS, not milliseconds
 * JavaScript Date.getTime() returns milliseconds, so divide by 1000
 *
 * Example conversion:
 * const from = Math.floor(new Date('2025-07-01').getTime() / 1000);
 */
export interface FetchPriceParams {
  coinId: string; // CoinGecko coin ID (e.g., "bitcoin")
  currency: string; // Fiat currency code (e.g., "usd", "eur", "try")
  from: number; // Start date as Unix timestamp in SECONDS
  to: number; // End date as Unix timestamp in SECONDS
}

/**
 * Market Data Collection
 *
 * Structured representation of fetched market data for multiple coins and currencies
 *
 * STRUCTURE:
 * A nested map where:
 * - First level key: coinId (e.g., "bitcoin", "ethereum")
 * - Second level key: currencyCode (e.g., "usd", "eur")
 * - Value: MarketChartRange (price data with timestamps)
 *
 * EXAMPLE:
 * {
 *   "bitcoin": {
 *     "usd": { prices: [[timestamp1, price1], ...], market_caps: [...], total_volumes: [...] },
 *     "eur": { prices: [[timestamp1, price1], ...], market_caps: [...], total_volumes: [...] }
 *   },
 *   "ethereum": {
 *     "usd": { prices: [[timestamp1, price1], ...], market_caps: [...], total_volumes: [...] },
 *     "eur": { prices: [[timestamp1, price1], ...], market_caps: [...], total_volumes: [...] }
 *   }
 * }
 *
 * WHY THIS STRUCTURE?
 * - Organized by coin first, then currency
 * - Easy to iterate through all coins and currencies
 * - Natural structure for batch operations
 * - Type-safe access: marketData.get("bitcoin")?.get("usd")?.prices
 *
 * USAGE:
 * Used as return type from batchFetchMarketDataByDays() and passed to
 * storeHourlyData() and storeDailyData() methods
 */
export interface MarketDataCollection {
  // Map of coinId to currency data
  [coinId: string]: {
    // Map of currencyCode to market chart data
    [currencyCode: string]: MarketChartRange;
  };
}
