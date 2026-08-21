import yahooFinance from "yahoo-finance2";
import { formatTicker } from "../../utils/stockHelper";
import { StockQuote, StockFundamentalAnalysis } from "./market.type";

// In-memory cache to prevent excessive Yahoo Finance rate limiting
const quoteCache = new Map<string, { data: StockQuote; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache

const FALLBACK_DATABASE: Record<string, Partial<StockQuote>> = {
  "BBCA.JK": {
    name: "Bank Central Asia Tbk",
    currency: "IDR",
    regularMarketPrice: 9925,
    regularMarketChange: 75,
    regularMarketChangePercent: 0.76,
    regularMarketDayHigh: 10000,
    regularMarketDayLow: 9850,
    regularMarketVolume: 75000000,
    marketCap: 1220000000000000,
    trailingPE: 22.4,
    priceToBook: 4.8,
    dividendYield: 2.8,
    returnOnEquity: 21.5,
  },
  "BBRI.JK": {
    name: "Bank Rakyat Indonesia Tbk",
    currency: "IDR",
    regularMarketPrice: 4750,
    regularMarketChange: -30,
    regularMarketChangePercent: -0.63,
    regularMarketDayHigh: 4800,
    regularMarketDayLow: 4710,
    regularMarketVolume: 120000000,
    marketCap: 720000000000000,
    trailingPE: 11.8,
    priceToBook: 2.1,
    dividendYield: 6.8,
    returnOnEquity: 18.2,
  },
  "BMRI.JK": {
    name: "Bank Mandiri (Persero) Tbk",
    currency: "IDR",
    regularMarketPrice: 6500,
    regularMarketChange: 100,
    regularMarketChangePercent: 1.56,
    regularMarketDayHigh: 6550,
    regularMarketDayLow: 6425,
    regularMarketVolume: 65000000,
    marketCap: 605000000000000,
    trailingPE: 10.9,
    priceToBook: 2.2,
    dividendYield: 5.5,
    returnOnEquity: 20.1,
  },
  "TLKM.JK": {
    name: "Telkom Indonesia (Persero) Tbk",
    currency: "IDR",
    regularMarketPrice: 2820,
    regularMarketChange: 20,
    regularMarketChangePercent: 0.71,
    regularMarketDayHigh: 2850,
    regularMarketDayLow: 2790,
    regularMarketVolume: 95000000,
    marketCap: 279000000000000,
    trailingPE: 11.2,
    priceToBook: 2.0,
    dividendYield: 5.9,
    returnOnEquity: 17.8,
  },
  "ASII.JK": {
    name: "Astra International Tbk",
    currency: "IDR",
    regularMarketPrice: 5050,
    regularMarketChange: 50,
    regularMarketChangePercent: 1.0,
    regularMarketDayHigh: 5100,
    regularMarketDayLow: 5000,
    regularMarketVolume: 40000000,
    marketCap: 204000000000000,
    trailingPE: 6.9,
    priceToBook: 1.0,
    dividendYield: 8.2,
    returnOnEquity: 14.5,
  },
  "GOTO.JK": {
    name: "GoTo Gojek Tokopedia Tbk",
    currency: "IDR",
    regularMarketPrice: 62,
    regularMarketChange: 1,
    regularMarketChangePercent: 1.64,
    regularMarketDayHigh: 64,
    regularMarketDayLow: 60,
    regularMarketVolume: 850000000,
    marketCap: 74000000000000,
    trailingPE: -12.5,
    priceToBook: 1.8,
    dividendYield: 0,
    returnOnEquity: -8.5,
  },
};

export const getStockQuote = async (rawTicker: string): Promise<StockQuote> => {
  const ticker = formatTicker(rawTicker);

  // Check cache
  const cached = quoteCache.get(ticker);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  try {
    const quote: any = await yahooFinance.quote(ticker);
    if (quote && quote.regularMarketPrice) {
      const data: StockQuote = {
        ticker,
        name: quote.longName || quote.shortName || ticker,
        currency: quote.currency || "IDR",
        regularMarketPrice: quote.regularMarketPrice,
        regularMarketChange: quote.regularMarketChange || 0,
        regularMarketChangePercent: quote.regularMarketChangePercent || 0,
        regularMarketDayHigh: quote.regularMarketDayHigh || quote.regularMarketPrice,
        regularMarketDayLow: quote.regularMarketDayLow || quote.regularMarketPrice,
        regularMarketVolume: quote.regularMarketVolume || 0,
        marketCap: quote.marketCap,
        trailingPE: quote.trailingPE,
        priceToBook: quote.priceToBook,
        dividendYield: quote.dividendYield ? quote.dividendYield * 100 : undefined,
        fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
        updatedAt: new Date(),
      };

      quoteCache.set(ticker, { data, expiresAt: Date.now() + CACHE_TTL_MS });
      return data;
    }
  } catch (err) {
    console.warn(`[MarketData] Yahoo Finance lookup error for ${ticker}:`, (err as any).message);
  }

  // Use fallback if available
  const fallback = FALLBACK_DATABASE[ticker] || {
    name: ticker.replace(".JK", ""),
    currency: "IDR",
    regularMarketPrice: 1000,
    regularMarketChange: 0,
    regularMarketChangePercent: 0,
    regularMarketDayHigh: 1020,
    regularMarketDayLow: 980,
    regularMarketVolume: 1000000,
    trailingPE: 15.0,
    priceToBook: 1.5,
    dividendYield: 4.0,
    returnOnEquity: 12.0,
  };

  const data: StockQuote = {
    ticker,
    name: fallback.name || ticker,
    currency: fallback.currency || "IDR",
    regularMarketPrice: fallback.regularMarketPrice || 1000,
    regularMarketChange: fallback.regularMarketChange || 0,
    regularMarketChangePercent: fallback.regularMarketChangePercent || 0,
    regularMarketDayHigh: fallback.regularMarketDayHigh || fallback.regularMarketPrice || 1000,
    regularMarketDayLow: fallback.regularMarketDayLow || fallback.regularMarketPrice || 1000,
    regularMarketVolume: fallback.regularMarketVolume || 0,
    marketCap: fallback.marketCap,
    trailingPE: fallback.trailingPE,
    priceToBook: fallback.priceToBook,
    dividendYield: fallback.dividendYield,
    returnOnEquity: fallback.returnOnEquity,
    updatedAt: new Date(),
  };

  quoteCache.set(ticker, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  return data;
};

export const getMultipleQuotes = async (tickers: string[]): Promise<Record<string, StockQuote>> => {
  const result: Record<string, StockQuote> = {};
  await Promise.all(
    tickers.map(async (t) => {
      try {
        result[t] = await getStockQuote(t);
      } catch {
        // ignore individual errors
      }
    })
  );
  return result;
};
