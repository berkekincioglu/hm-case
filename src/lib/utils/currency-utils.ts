/**
 * Currency symbols mapping
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  usd: "$",
  eur: "€",
  gbp: "£",
  try: "₺",
  jpy: "¥",
  cny: "¥",
  krw: "₩",
  inr: "₹",
  rub: "₽",
  brl: "R$",
  cad: "C$",
  aud: "A$",
  chf: "CHF",
  mxn: "MX$",
};

/**
 * Get currency symbol by code
 */
export function getCurrencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code.toLowerCase()] || code.toUpperCase();
}
