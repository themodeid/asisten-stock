import { pool } from "../../config/database";
import { formatTicker, detectAssetType } from "../../utils/stockHelper";
import { WatchlistItem, PriceAlert } from "./alert.type";
import * as marketService from "../market-data/market.service";

export const getWatchlistByUserId = async (
  userId: number
): Promise<WatchlistItem[]> => {
  const { rows } = await pool.query(
    "SELECT * FROM watchlists WHERE user_id = $1 ORDER BY id DESC;",
    [userId]
  );

  const enriched = await Promise.all(
    rows.map(async (row) => {
      let currentPrice = 0;
      let dayChange = 0;
      let name = row.ticker;
      let currency = row.currency || (row.ticker.endsWith(".JK") || row.ticker.endsWith(".IDR") ? "IDR" : "USD");
      let assetType = row.asset_type || detectAssetType(row.ticker);
      try {
        const quote = await marketService.getStockQuote(row.ticker, assetType);
        currentPrice = quote.regularMarketPrice;
        dayChange = quote.regularMarketChangePercent;
        name = quote.name;
        if (quote.currency) currency = quote.currency;
      } catch {}
      return {
        ...row,
        current_price: currentPrice,
        day_change_percent: dayChange,
        company_name: name,
        asset_type: assetType,
        currency,
      };
    })
  );

  return enriched;
};

export const addToWatchlist = async (
  userId: number,
  ticker: string,
  targetBuy?: number,
  targetSell?: number,
  notes?: string
): Promise<WatchlistItem> => {
  const formatted = formatTicker(ticker);
  const detectedType = detectAssetType(formatted);
  let detectedCurrency = formatted.endsWith(".JK") || formatted.endsWith(".IDR") ? "IDR" : "USD";

  try {
    const q = await marketService.getStockQuote(formatted, detectedType);
    if (q && q.currency) detectedCurrency = q.currency;
  } catch {}

  const { rows } = await pool.query(
    `INSERT INTO watchlists (user_id, ticker, target_buy_price, target_sell_price, notes, asset_type, currency)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id, ticker) 
     DO UPDATE SET target_buy_price = EXCLUDED.target_buy_price, target_sell_price = EXCLUDED.target_sell_price, notes = EXCLUDED.notes, asset_type = EXCLUDED.asset_type, currency = EXCLUDED.currency
     RETURNING *;`,
    [userId, formatted, targetBuy || null, targetSell || null, notes || null, detectedType, detectedCurrency]
  );
  return rows[0];
};

export const removeFromWatchlist = async (
  userId: number,
  ticker: string
): Promise<boolean> => {
  const formatted = formatTicker(ticker);
  const result = await pool.query(
    "DELETE FROM watchlists WHERE user_id = $1 AND ticker = $2;",
    [userId, formatted]
  );
  return (result.rowCount ?? 0) > 0;
};

export const createPriceAlert = async (
  userId: number,
  ticker: string,
  targetPrice: number,
  condition: "ABOVE" | "BELOW"
): Promise<PriceAlert> => {
  const formatted = formatTicker(ticker);
  const { rows } = await pool.query(
    `INSERT INTO price_alerts (user_id, ticker, target_price, condition, status)
     VALUES ($1, $2, $3, $4, 'ACTIVE')
     RETURNING *;`,
    [userId, formatted, targetPrice, condition]
  );
  return rows[0];
};

export const getActivePriceAlerts = async (): Promise<
  (PriceAlert & { telegram_id: number; first_name?: string })[]
> => {
  const query = `
    SELECT a.*, u.telegram_id, u.first_name
    FROM price_alerts a
    JOIN users u ON a.user_id = u.id
    WHERE a.status = 'ACTIVE';
  `;
  const { rows } = await pool.query(query);
  return rows;
};

export const markAlertTriggered = async (alertId: number): Promise<void> => {
  await pool.query(
    "UPDATE price_alerts SET status = 'TRIGGERED', triggered_at = NOW() WHERE id = $1;",
    [alertId]
  );
};
