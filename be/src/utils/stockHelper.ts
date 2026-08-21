/**
 * Formats a stock symbol to standard Yahoo Finance format (e.g. BBCA -> BBCA.JK for IDX)
 */
export function formatTicker(ticker: string): string {
  const clean = ticker.trim().toUpperCase();
  if (clean.endsWith(".JK") || clean.includes(".")) {
    return clean;
  }
  // If 4 letters (standard Indonesian stock code e.g. BBCA, TLKM, ASII) or 4-5 letters without dot, default to IDX .JK
  if (/^[A-Z]{4,5}$/.test(clean)) {
    return `${clean}.JK`;
  }
  return clean;
}

/**
 * Converts Indonesian stock lots to total shares (1 lot = 100 shares)
 */
export function lotsToShares(lots: number): number {
  return Math.round(lots * 100);
}

/**
 * Converts shares to lots
 */
export function sharesToLots(shares: number): number {
  return Number((shares / 100).toFixed(2));
}

/**
 * Calculates new average price when buying additional shares
 */
export function calculateNewAveragePrice(
  currentShares: number,
  currentAvgPrice: number,
  addedShares: number,
  buyPrice: number
): number {
  const totalShares = currentShares + addedShares;
  if (totalShares <= 0) return 0;
  const totalCost = currentShares * currentAvgPrice + addedShares * buyPrice;
  return Number((totalCost / totalShares).toFixed(2));
}

/**
 * Formats Rupiah currency
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}
