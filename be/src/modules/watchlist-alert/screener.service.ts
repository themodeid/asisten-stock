import * as marketService from "../market-data/market.service";
import { AssetType } from "../transactions/transaction.type";

export interface DipRadarItem {
  ticker: string;
  name: string;
  asset_type: AssetType;
  current_price: number;
  currency: string;
  fifty_two_week_high: number;
  fifty_two_week_low: number;
  fifty_two_week_position_percent: number;
  discount_from_high_percent: number;
  potential_upside_percent: number;
  pe_ratio?: number;
  pbv_ratio?: number;
  roe_percent?: number;
  dividend_yield_percent?: number;
  valuation_status: "Undervalued" | "Fair Value" | "Overvalued" | "Growth Premium";
  buy_confidence_score: number;
  recommendation_tag: "STRONG_ACCUMULATE" | "MODERATE_BUY" | "WAIT_FOR_DIP";
  analysis_summary: string;
}

const DEFAULT_SCAN_TICKERS = [
  // Saham Blue-Chip IDX
  { ticker: "BBCA", asset_type: "STOCK" as AssetType, name: "Bank Central Asia" },
  { ticker: "BBRI", asset_type: "STOCK" as AssetType, name: "Bank Rakyat Indonesia" },
  { ticker: "BMRI", asset_type: "STOCK" as AssetType, name: "Bank Mandiri" },
  { ticker: "TLKM", asset_type: "STOCK" as AssetType, name: "Telkom Indonesia" },
  { ticker: "ASII", asset_type: "STOCK" as AssetType, name: "Astra International" },
  { ticker: "ICBP", asset_type: "STOCK" as AssetType, name: "Indofood CBP Sukses Makmur" },
  { ticker: "UNVR", asset_type: "STOCK" as AssetType, name: "Unilever Indonesia" },
  { ticker: "ITMG", asset_type: "STOCK" as AssetType, name: "Indo Tambangraya Megah" },
  // Global ETF
  { ticker: "VT", asset_type: "ETF" as AssetType, name: "Vanguard Total World Stock ETF" },
  { ticker: "VOO", asset_type: "ETF" as AssetType, name: "Vanguard S&P 500 ETF" },
  { ticker: "QQQ", asset_type: "ETF" as AssetType, name: "Invesco QQQ Trust (Nasdaq 100)" },
  // Kripto
  { ticker: "BTC", asset_type: "CRYPTO" as AssetType, name: "Bitcoin" },
  { ticker: "ETH", asset_type: "CRYPTO" as AssetType, name: "Ethereum" },
  { ticker: "SOL", asset_type: "CRYPTO" as AssetType, name: "Solana" },
];

export const getDipRadarScan = async (): Promise<DipRadarItem[]> => {
  const results: DipRadarItem[] = [];

  for (const item of DEFAULT_SCAN_TICKERS) {
    try {
      const quote = await marketService.getStockQuote(item.ticker, item.asset_type);
      const price = quote.regularMarketPrice || 1000;
      const high = quote.fiftyTwoWeekHigh || price * 1.15;
      const low = quote.fiftyTwoWeekLow || price * 0.85;

      const rangeSpan = Math.max(1, high - low);
      const posPercent = Math.min(100, Math.max(0, Number((((price - low) / rangeSpan) * 100).toFixed(1))));
      const discountFromHigh = Math.max(0, Number((((high - price) / high) * 100).toFixed(1)));
      const potentialUpside = Number((((high - price) / price) * 100).toFixed(1));

      let score = 40;

      if (posPercent <= 20) score += 35;
      else if (posPercent <= 35) score += 25;
      else if (posPercent <= 50) score += 15;
      else if (posPercent >= 80) score -= 15;

      if (discountFromHigh >= 25) score += 15;
      else if (discountFromHigh >= 15) score += 10;
      else if (discountFromHigh >= 8) score += 5;

      const valStatus = quote.valuationStatus || "Fair Value";
      if (valStatus === "Undervalued") score += 15;
      else if (valStatus === "Overvalued") score -= 15;

      if (quote.returnOnEquity && quote.returnOnEquity >= 15) score += 5;
      if (quote.dividendYield && quote.dividendYield >= 3) score += 5;

      score = Math.min(98, Math.max(15, score));

      let tag: "STRONG_ACCUMULATE" | "MODERATE_BUY" | "WAIT_FOR_DIP" = "WAIT_FOR_DIP";
      if (score >= 70) tag = "STRONG_ACCUMULATE";
      else if (score >= 50) tag = "MODERATE_BUY";

      let summary = "";
      if (tag === "STRONG_ACCUMULATE") {
        summary = `Harga saat ini terdiskon ${discountFromHigh}% dari puncak 52 minggu (posisi rentang ${posPercent}%). Sangat menarik untuk cicil beli bertahap (DCA).`;
      } else if (tag === "MODERATE_BUY") {
        summary = `Valuasi berada di kisaran wajar dengan potensi upside ${potentialUpside}% menuju puncak tahunan. Cocok untuk alokasi porsi reguler.`;
      } else {
        summary = `Posisi harga mendekati area tertinggi tahunan (${posPercent}% rentang 52W). Disarankan menunggu koreksi teknikal sebelum akumulasi agresif.`;
      }

      results.push({
        ticker: item.ticker,
        name: quote.name || item.name,
        asset_type: item.asset_type,
        current_price: price,
        currency: quote.currency || (item.asset_type === "STOCK" ? "IDR" : "USD"),
        fifty_two_week_high: high,
        fifty_two_week_low: low,
        fifty_two_week_position_percent: posPercent,
        discount_from_high_percent: discountFromHigh,
        potential_upside_percent: potentialUpside,
        pe_ratio: quote.trailingPE,
        pbv_ratio: quote.priceToBook,
        roe_percent: quote.returnOnEquity,
        dividend_yield_percent: quote.dividendYield,
        valuation_status: valStatus,
        buy_confidence_score: score,
        recommendation_tag: tag,
        analysis_summary: summary,
      });
    } catch (err) {
      console.warn(`Error scanning ${item.ticker}:`, err);
    }
  }

  return results.sort((a, b) => b.buy_confidence_score - a.buy_confidence_score);
};
