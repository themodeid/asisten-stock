import yahooFinance from "yahoo-finance2";

interface FxRateInfo {
  rate: number;
  source: string;
  updatedAt: Date;
  isLive: boolean;
}

let cachedRate: number | null = null;
let lastFetchTime: number | null = null;
let lastFetchAttempt: number = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour for successful quotes
const ERROR_BACKOFF = 5 * 60 * 1000; // 5 minutes backoff if providers fail/rate-limited
const FALLBACK_RATE = 16250;

/**
 * Fetch USD/IDR rate from secondary public provider if Yahoo is rate-limited.
 */
async function fetchSecondaryRate(): Promise<number | null> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data: any = await res.json();
      if (data?.rates?.IDR && typeof data.rates.IDR === "number") {
        return data.rates.IDR;
      }
    }
  } catch {
    // Secondary failed silently
  }
  return null;
}

/**
 * Gets the live USD/IDR exchange rate.
 * Uses yahoo-finance2 to fetch USDIDR=X with secondary provider fallback.
 * Includes in-memory caching and error backoff to avoid 429 rate limit spam.
 *
 * @returns {Promise<number>} The USD to IDR exchange rate
 */
export const getUsdIdrRate = async (): Promise<number> => {
  const now = Date.now();

  // If cache is fresh, return immediately
  if (cachedRate && lastFetchTime && now - lastFetchTime < CACHE_TTL) {
    return cachedRate;
  }

  // If we had a recent error within backoff window, don't spam providers
  if (now - lastFetchAttempt < ERROR_BACKOFF && (cachedRate || lastFetchAttempt > 0)) {
    return cachedRate || FALLBACK_RATE;
  }

  lastFetchAttempt = now;

  // 1. Try Yahoo Finance primary
  try {
    const quote = await yahooFinance.quote("USDIDR=X");
    if (quote && quote.regularMarketPrice) {
      cachedRate = quote.regularMarketPrice;
      lastFetchTime = now;
      return cachedRate;
    }
  } catch (error: any) {
    // Gracefully handle Yahoo Finance rate limiting
    const errMsg = error?.message || String(error);
    if (errMsg.includes("Too Many Requests") || errMsg.includes("SyntaxError")) {
      console.warn("[FX] Yahoo Finance USD/IDR rate-limited. Trying secondary provider...");
    } else {
      console.warn("[FX] Yahoo Finance error:", errMsg);
    }
  }

  // 2. Try Secondary Public Provider
  const secondary = await fetchSecondaryRate();
  if (secondary) {
    cachedRate = secondary;
    lastFetchTime = now;
    return cachedRate;
  }

  // 3. Fallback if all providers fail
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
  let rate = cachedRate || FALLBACK_RATE;
  let isLive = false;
  let source = "Fallback (Hardcoded)";

  if (cachedRate && lastFetchTime && now - lastFetchTime < CACHE_TTL) {
    rate = cachedRate;
    isLive = true;
    source = "Yahoo Finance (Cached)";
  } else if (now - lastFetchAttempt < ERROR_BACKOFF && cachedRate) {
    rate = cachedRate;
    isLive = true;
    source = "Cached (Provider Cooldown)";
  } else {
    lastFetchAttempt = now;
    try {
      const quote = await yahooFinance.quote("USDIDR=X");
      if (quote && quote.regularMarketPrice) {
        rate = quote.regularMarketPrice;
        cachedRate = rate;
        lastFetchTime = now;
        isLive = true;
        source = "Yahoo Finance (Live)";
      }
    } catch {
      const secondary = await fetchSecondaryRate();
      if (secondary) {
        rate = secondary;
        cachedRate = rate;
        lastFetchTime = now;
        isLive = true;
        source = "Open ER API (Live Backup)";
      }
    }
  }

  if (!isLive && cachedRate) {
    rate = cachedRate;
    source = "Stale Cache";
    isLive = true;
  }

  return {
    rate,
    source,
    updatedAt: new Date(lastFetchTime || now),
    isLive,
  };
};
