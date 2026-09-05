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
  forwardPE?: number;
  priceToBook?: number;
  dividendYield?: number;
  returnOnEquity?: number;
  eps?: number;
  valuationStatus?: "Undervalued" | "Fair Value" | "Overvalued" | "Growth Premium";
  valuationSummary?: string;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  news?: { title: string; source: string; time: string; sentiment: "positive" | "neutral" | "cautious" }[];
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
