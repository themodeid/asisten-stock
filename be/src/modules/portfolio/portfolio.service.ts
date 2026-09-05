import { pool } from "../../config/database";
import { Portfolio, PortfolioHolding, PortfolioSummary, AssetAllocation } from "./portfolio.type";
import * as marketService from "../market-data/market.service";

export const getPrimaryPortfolioByUserId = async (
  userId: number
): Promise<Portfolio> => {
  const { rows } = await pool.query(
    "SELECT * FROM portfolios WHERE user_id = $1 ORDER BY id ASC LIMIT 1;",
    [userId]
  );

  if (rows.length > 0) return rows[0];

  // Auto-create user if not exists
  const userCheck = await pool.query("SELECT id FROM users WHERE id = $1;", [userId]);
  if (userCheck.rows.length === 0) {
    await pool.query(
      `INSERT INTO users (id, telegram_id, first_name, username) 
       VALUES ($1, $2, 'Adam (Jarvis User)', 'jarvis_user') 
       ON CONFLICT (id) DO NOTHING;`,
      [userId, userId === 1 ? 123456789 : userId]
    );
  }

  // Auto-create if not present
  const created = await pool.query(
    "INSERT INTO portfolios (user_id, name, cash_balance) VALUES ($1, $2, $3) RETURNING *;",
    [userId, "Portofolio Utama", 10000000]
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

  // 2. Fetch all active holdings with quantity > 0 or total_shares > 0
  const hResult = await pool.query(
    `SELECT * FROM portfolio_holdings 
     WHERE portfolio_id = $1 AND (quantity > 0 OR total_shares > 0) 
     ORDER BY total_invested DESC;`,
    [portfolioId]
  );

  const rawHoldings = hResult.rows;
  let totalInvested = 0;
  let totalMarketValue = 0;

  // 3. Attach live prices to holdings
  const enrichedHoldings: PortfolioHolding[] = await Promise.all(
    rawHoldings.map(async (row) => {
      const assetType = row.asset_type || "STOCK";
      const quantity = Number(row.quantity || row.total_shares || 0);
      const shares = Number(row.total_shares || (assetType === "STOCK" ? quantity : 0));
      const lots = Number(row.total_lots || (assetType === "STOCK" ? quantity / 100 : 0));
      const avgPrice = Number(row.avg_buy_price);
      const invested = Number(row.total_invested);
      const currency = row.currency || (assetType === "CRYPTO" ? "USD" : "IDR");

      let currentPrice = avgPrice;
      let companyName = row.ticker;

      try {
        const quote = await marketService.getStockQuote(row.ticker, assetType);
        currentPrice = quote.regularMarketPrice;
        companyName = quote.name;
      } catch (e) {
        // use avgPrice fallback
      }

      const rateToIDR = currency === "USD" ? 15800 : 1;
      const investedIDR = invested * rateToIDR;
      const marketVal = quantity * currentPrice;
      const marketValIDR = marketVal * rateToIDR;

      totalInvested += investedIDR;
      totalMarketValue += marketValIDR;

      const pnl = marketVal - invested;
      const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;

      return {
        id: row.id,
        portfolio_id: row.portfolio_id,
        ticker: row.ticker,
        asset_type: assetType,
        quantity,
        currency,
        total_shares: shares,
        total_lots: lots,
        avg_buy_price: avgPrice,
        total_invested: invested,
        updated_at: row.updated_at,
        current_price: currentPrice,
        market_value: marketVal,
        market_value_idr: marketValIDR,
        floating_pnl: pnl,
        floating_pnl_percent: Number(pnlPercent.toFixed(2)),
        company_name: companyName,
      };
    })
  );

  // 4. Calculate weight percentages
  const grandTotalIDR = totalMarketValue + Number(portfolio.cash_balance);
  const holdingsWithWeights = enrichedHoldings.map((h: any) => ({
    ...h,
    weight_percent:
      grandTotalIDR > 0
        ? Number((((h.market_value_idr || 0) / grandTotalIDR) * 100).toFixed(2))
        : 0,
  }));

  // 5. Compute Asset Allocation Breakdown
  const allocationMap = new Map<string, { label: string; total_value: number; count: number }>();
  
  const labels: Record<string, string> = {
    STOCK: "Saham",
    CRYPTO: "Kripto (Crypto)",
    ETF: "ETF",
    BOND: "Obligasi / SBN",
    MUTUAL_FUND: "Reksadana",
    GOLD: "Emas & Logam Mulia",
    CASH: "Kas / Saldo",
  };

  for (const h of holdingsWithWeights) {
    const type = h.asset_type || "STOCK";
    const existing = allocationMap.get(type) || {
      label: labels[type] || type,
      total_value: 0,
      count: 0,
    };
    existing.total_value += (h as any).market_value_idr || 0;
    existing.count += 1;
    allocationMap.set(type, existing);
  }

  if (Number(portfolio.cash_balance) > 0) {
    allocationMap.set("CASH", {
      label: "Kas & Tunai",
      total_value: Number(portfolio.cash_balance),
      count: 1,
    });
  }

  const asset_allocations: AssetAllocation[] = Array.from(allocationMap.entries()).map(
    ([type, data]) => ({
      asset_type: type as any,
      label: data.label,
      total_value: data.total_value,
      percentage: grandTotalIDR > 0 ? Number(((data.total_value / grandTotalIDR) * 100).toFixed(1)) : 0,
      count: data.count,
    })
  );

  const totalFloatingPnl = totalMarketValue - totalInvested;
  const totalFloatingPnlPercent =
    totalInvested > 0 ? (totalFloatingPnl / totalInvested) * 100 : 0;

  return {
    portfolio_id: portfolio.id,
    portfolio_name: portfolio.name,
    cash_balance: Number(portfolio.cash_balance),
    total_invested: totalInvested,
    total_market_value: totalMarketValue,
    total_net_worth: grandTotalIDR,
    total_floating_pnl: totalFloatingPnl,
    total_floating_pnl_percent: Number(totalFloatingPnlPercent.toFixed(2)),
    holdings_count: holdingsWithWeights.length,
    holdings: holdingsWithWeights,
    asset_allocations,
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
