import yahooFinance from "yahoo-finance2";

interface FxRateInfo {
  rate: number;
  source: string;
  updatedAt: Date;
  isLive: boolean;
}

let cachedRate: number | null = null;
let lastFetchTime: number | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const FALLBACK_RATE = 16250;

/**
 * Gets the live USD/IDR exchange rate.
 * Uses yahoo-finance2 to fetch USDIDR=X.
 * Includes 1-hour in-memory cache and a hard fallback to 16250.
 *
 * @returns {Promise<number>} The USD to IDR exchange rate
 */
export const getUsdIdrRate = async (): Promise<number> => {
  const now = Date.now();

  if (cachedRate && lastFetchTime && now - lastFetchTime < CACHE_TTL) {
    return cachedRate;
  }

  try {
    const quote = await yahooFinance.quote("USDIDR=X");
    if (quote && quote.regularMarketPrice) {
      cachedRate = quote.regularMarketPrice;
      lastFetchTime = now;
      return cachedRate;
    }
  } catch (error) {
    console.error("Error fetching USD/IDR rate:", error);
  }

  // Fallback if API fails or no valid price found
  if (cachedRate) return cachedRate;
  return FALLBACK_RATE;
};

/**
 * Gets detailed FX rate info including metadata like timestamp and live status.
 *
 * @returns {Promise<FxRateInfo>} The FX rate information object
 */
export const getFxRateInfo = async (): Promise<FxRateInfo> => {
  const now = Date.now();
  let rate = FALLBACK_RATE;
  let isLive = false;
  let source = "Fallback (Hardcoded)";
  
  if (cachedRate && lastFetchTime && now - lastFetchTime < CACHE_TTL) {
    rate = cachedRate;
    isLive = true;
    source = "Yahoo Finance (Cached)";
  } else {
    try {
      const quote = await yahooFinance.quote("USDIDR=X");
      if (quote && quote.regularMarketPrice) {
        rate = quote.regularMarketPrice;
        cachedRate = rate;
        lastFetchTime = now;
        isLive = true;
        source = "Yahoo Finance (Live)";
      }
    } catch (error) {
      console.error("Error fetching USD/IDR rate:", error);
    }
  }

  // If still not live and we have an old cache, use it
  if (!isLive && cachedRate) {
    rate = cachedRate;
    source = "Yahoo Finance (Stale Cache)";
  }

  return {
    rate,
    source,
    updatedAt: new Date(lastFetchTime || now),
    isLive,
  };
};
