import * as portfolioService from "./portfolio.service";
import * as marketService from "../market-data/market.service";

export interface DividendHoldingItem {
  ticker: string;
  name: string;
  asset_type: string;
  market_value_idr: number;
  dividend_yield_percent: number;
  annual_dividend_income_idr: number;
  distribution_months: number[]; // 1-12
}

export interface DividendSummaryReport {
  portfolio_id: number;
  portfolio_name: string;
  total_market_value_idr: number;
  annual_passive_income_idr: number;
  average_monthly_income_idr: number;
  portfolio_dividend_yield_percent: number;
  monthly_projections: {
    month: number;
    month_name: string;
    estimated_income_idr: number;
    tickers: string[];
  }[];
  holdings: DividendHoldingItem[];
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

// Historical payout month distributions for common dividend-paying assets
const DIVIDEND_MONTH_MAP: Record<string, number[]> = {
  "BBCA.JK": [4, 12],
  "BBRI.JK": [3, 12],
  "BMRI.JK": [4, 12],
  "TLKM.JK": [6],
  "ASII.JK": [5, 10],
  "ICBP.JK": [7],
  "UNVR.JK": [6, 12],
  "VT": [3, 6, 9, 12],
  "VOO": [3, 6, 9, 12],
  "SPY": [3, 6, 9, 12],
  "QQQ": [3, 6, 9, 12],
};

const DEFAULT_YIELDS: Record<string, number> = {
  "BBCA.JK": 2.8,
  "BBRI.JK": 6.8,
  "BMRI.JK": 5.5,
  "TLKM.JK": 5.9,
  "ASII.JK": 8.2,
  "ICBP.JK": 3.2,
  "UNVR.JK": 4.5,
  "VT": 1.95,
  "VOO": 1.35,
  "SPY": 1.25,
  "QQQ": 0.58,
};

export const getDividendSummary = async (portfolioId: number): Promise<DividendSummaryReport> => {
  const summary = await portfolioService.getPortfolioSummary(portfolioId);
  const holdings = summary.holdings || [];
  const totalNetWorth = summary.total_net_worth || 1;

  let totalAnnualIncome = 0;
  const dividendHoldings: DividendHoldingItem[] = [];

  const monthlyBuckets = new Array(12).fill(0).map((_, i) => ({
    month: i + 1,
    month_name: MONTH_NAMES[i],
    estimated_income_idr: 0,
    tickers: [] as string[],
  }));

  for (const h of holdings) {
    const ticker = h.ticker;
    const aType = h.asset_type || "STOCK";
    const marketValIDR = h.market_value_idr || (h.currency === "USD" ? (h.market_value || 0) * 15800 : h.market_value || 0);

    let divYield = DEFAULT_YIELDS[ticker] || 0;
    try {
      const quote = await marketService.getStockQuote(ticker, aType);
      if (quote.dividendYield) {
        divYield = quote.dividendYield;
      }
    } catch (e) {
      // fallback
    }

    if (divYield > 0 && marketValIDR > 0) {
      const annualIncome = Math.round((divYield / 100) * marketValIDR);
      totalAnnualIncome += annualIncome;

      const payoutMonths = DIVIDEND_MONTH_MAP[ticker] || (aType === "ETF" ? [3, 6, 9, 12] : [5]);
      const perPayout = Math.round(annualIncome / payoutMonths.length);

      for (const m of payoutMonths) {
        const bucket = monthlyBuckets[m - 1];
        if (bucket) {
          bucket.estimated_income_idr += perPayout;
          if (!bucket.tickers.includes(ticker)) {
            bucket.tickers.push(ticker);
          }
        }
      }

      dividendHoldings.push({
        ticker,
        name: h.company_name || ticker,
        asset_type: aType,
        market_value_idr: marketValIDR,
        dividend_yield_percent: divYield,
        annual_dividend_income_idr: annualIncome,
        distribution_months: payoutMonths,
      });
    }
  }

  const portfolioYield =
    totalNetWorth > 0 ? Number(((totalAnnualIncome / totalNetWorth) * 100).toFixed(2)) : 0;
  const avgMonthlyIncome = Math.round(totalAnnualIncome / 12);

  return {
    portfolio_id: portfolioId,
    portfolio_name: summary.portfolio_name,
    total_market_value_idr: totalNetWorth,
    annual_passive_income_idr: totalAnnualIncome,
    average_monthly_income_idr: avgMonthlyIncome,
    portfolio_dividend_yield_percent: portfolioYield,
    monthly_projections: monthlyBuckets,
    holdings: dividendHoldings,
  };
};
