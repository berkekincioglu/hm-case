import { Coin } from "@prisma/client";

export type CoinEntity = Coin;

export interface CreateCoinDto {
  id: string;
  symbol: string;
  name: string;
}

export interface CoinWithMetadata extends Coin {
  metadata?: {
    description: string | null;
    imageUrl: string | null;
    homepageUrl: string | null;
  } | null;
}
