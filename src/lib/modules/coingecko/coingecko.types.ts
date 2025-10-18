// CoinGecko API Response Types

export interface CoinListItem {
  id: string;
  symbol: string;
  name: string;
}

export interface MarketChartRange {
  prices: [number, number][]; // [timestamp, price]
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

export interface CoinDetail {
  id: string;
  symbol: string;
  name: string;
  description?: {
    en?: string;
  };
  image?: {
    thumb?: string;
    small?: string;
    large?: string;
  };
  links?: {
    homepage?: string[];
  };
}

export interface CoinGeckoConfig {
  apiKey: string;
  baseUrl: string;
  rateLimitDelay?: number;
}

export interface FetchPriceParams {
  coinId: string;
  currency: string;
  from: number; // Unix timestamp in seconds
  to: number; // Unix timestamp in seconds
}
