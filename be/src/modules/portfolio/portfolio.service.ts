import { pool } from "../../config/database";
import { Portfolio, PortfolioHolding, PortfolioSummary } from "./portfolio.type";
import * as marketService from "../market-data/market.service";

export const getPrimaryPortfolioByUserId = async (
  userId: number
): Promise<Portfolio> => {
  const { rows } = await pool.query(
    "SELECT * FROM portfolios WHERE user_id = $1 ORDER BY id ASC LIMIT 1;",
    [userId]
  );

  if (rows.length > 0) return rows[0];

  // Auto-create if not present
  const created = await pool.query(
    "INSERT INTO portfolios (user_id, name, cash_balance) VALUES ($1, $2, $3) RETURNING *;",
    [userId, "Portofolio Utama", 0]
  );
  return created.rows[0];
};

export const getPortfolioSummary = async (
  portfolioId: number
): Promise<PortfolioSummary> => {
  // 1. Fetch portfolio info
  const pResult = await pool.query(
    "SELECT * FROM portfolios WHERE id = $1;",
    [portfolioId]
  );
  if (pResult.rows.length === 0) {
    throw new Error("Portfolio not found");
  }
  const portfolio: Portfolio = pResult.rows[0];

  // 2. Fetch all active holdings with total_shares > 0
  const hResult = await pool.query(
    "SELECT * FROM portfolio_holdings WHERE portfolio_id = $1 AND total_shares > 0 ORDER BY total_invested DESC;",
    [portfolioId]
  );

  const rawHoldings = hResult.rows;
  let totalInvested = 0;
  let totalMarketValue = 0;

  // 3. Attach live prices to holdings
  const enrichedHoldings: PortfolioHolding[] = await Promise.all(
    rawHoldings.map(async (row) => {
      const shares = Number(row.total_shares);
      const lots = Number(row.total_lots);
      const avgPrice = Number(row.avg_buy_price);
      const invested = Number(row.total_invested);

      totalInvested += invested;

      let currentPrice = avgPrice;
      let companyName = row.ticker;

      try {
        const quote = await marketService.getStockQuote(row.ticker);
        currentPrice = quote.regularMarketPrice;
        companyName = quote.name;
      } catch (e) {
        // use avgPrice fallback
      }

      const marketVal = shares * currentPrice;
      totalMarketValue += marketVal;

      const pnl = marketVal - invested;
      const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;

      return {
        id: row.id,
        portfolio_id: row.portfolio_id,
        ticker: row.ticker,
        total_shares: shares,
        total_lots: lots,
        avg_buy_price: avgPrice,
        total_invested: invested,
        updated_at: row.updated_at,
        current_price: currentPrice,
        market_value: marketVal,
        floating_pnl: pnl,
        floating_pnl_percent: Number(pnlPercent.toFixed(2)),
        company_name: companyName,
      };
    })
  );

  // 4. Calculate weight percentages
  const grandTotal = totalMarketValue + Number(portfolio.cash_balance);
  const holdingsWithWeights = enrichedHoldings.map((h) => ({
    ...h,
    weight_percent:
      grandTotal > 0
        ? Number((((h.market_value || 0) / grandTotal) * 100).toFixed(2))
        : 0,
  }));

  const totalFloatingPnl = totalMarketValue - totalInvested;
  const totalFloatingPnlPercent =
    totalInvested > 0 ? (totalFloatingPnl / totalInvested) * 100 : 0;

  return {
    portfolio_id: portfolio.id,
    portfolio_name: portfolio.name,
    cash_balance: Number(portfolio.cash_balance),
    total_invested: totalInvested,
    total_market_value: totalMarketValue,
    total_net_worth: grandTotal,
    total_floating_pnl: totalFloatingPnl,
    total_floating_pnl_percent: Number(totalFloatingPnlPercent.toFixed(2)),
    holdings_count: holdingsWithWeights.length,
    holdings: holdingsWithWeights,
  };
};

export const updateCashBalance = async (
  portfolioId: number,
  amount: number,
  type: "DEPOSIT" | "WITHDRAW"
): Promise<Portfolio> => {
  const op = type === "DEPOSIT" ? "+" : "-";
  const { rows } = await pool.query(
    `UPDATE portfolios 
     SET cash_balance = cash_balance ${op} $1, updated_at = NOW() 
     WHERE id = $2 
     RETURNING *;`,
    [amount, portfolioId]
  );
  return rows[0];
};
