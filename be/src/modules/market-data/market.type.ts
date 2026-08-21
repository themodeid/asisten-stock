export interface StockQuote {
  ticker: string;
  name: string;
  currency: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketVolume: number;
  marketCap?: number;
  trailingPE?: number;
  priceToBook?: number;
  dividendYield?: number;
  returnOnEquity?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  updatedAt: Date;
}

export interface StockFundamentalAnalysis {
  ticker: string;
  name: string;
  sector?: string;
  price: number;
  peRatio?: number;
  pbvRatio?: number;
  roePercent?: number;
  dividendYieldPercent?: number;
  marketCapRupiah?: string;
  valuationStatus: "Undervalued" | "Fair Value" | "Overvalued" | "Unknown";
  summary: string;
}
