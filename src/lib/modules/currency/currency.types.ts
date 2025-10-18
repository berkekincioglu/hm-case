import { Currency } from "@prisma/client";

export type CurrencyEntity = Currency;

export interface CreateCurrencyDto {
  code: string;
  name: string;
}
