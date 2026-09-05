import { pool } from "../../config/database";
import {
  formatTicker,
  detectAssetType,
  lotsToShares,
  calculateNewAveragePrice,
} from "../../utils/stockHelper";
import { StockTransaction, CreateTransactionInput, AssetType } from "./transaction.type";
import * as marketService from "../market-data/market.service";

export const recordTransaction = async (
  input: CreateTransactionInput
): Promise<{ transaction: StockTransaction; holding: any }> => {
  const assetType: AssetType =
    input.asset_type || detectAssetType(input.ticker);
  const ticker = formatTicker(input.ticker, assetType);
  const fee = Number(input.fee || 0);

  // 1. Fetch live market price if not provided
  let price = Number(input.price_per_share || 0);
  let liveQuote: any = null;

  if (!price || price <= 0 || (input.total_budget && input.total_budget > 0)) {
    try {
      liveQuote = await marketService.getStockQuote(ticker, assetType);
      if (!price || price <= 0) {
        price = liveQuote.regularMarketPrice;
      }
    } catch (err) {
      if (!price || price <= 0) {
        price = 1000; // fallback
      }
    }
  }

  // 2. Currency detection & asset quote currency
  const isAssetUSD =
    liveQuote?.currency === "USD" ||
    assetType === "CRYPTO" ||
    ticker.endsWith("-USD") ||
    ["SPY", "QQQ", "AAPL", "NVDA", "TSLA", "MSFT", "VOO", "VTI"].includes(ticker);

  let currency = input.currency || (isAssetUSD ? "USD" : "IDR");

  // 3. Determine quantity and lots (supports Budget / Nominal Uang Input)
  let quantity = 0;
  let lots = 0;
  let shares = 0;

  if (input.total_budget && Number(input.total_budget) > 0) {
    const budget = Number(input.total_budget);

    // If asset is USD-denominated but budget is given in IDR (e.g. 1.100.000 IDR for BTC)
    const effectiveBudget =
      isAssetUSD && (input.currency === "IDR" || budget > 10000)
        ? budget / 15800
        : budget;

    // The holding currency for USD assets should be USD
    if (isAssetUSD) {
      currency = "USD";
    }

    if (assetType === "STOCK" && currency === "IDR") {
      const pricePerLot = price * 100;
      lots = Math.max(1, Math.floor(effectiveBudget / pricePerLot));
      shares = lots * 100;
      quantity = shares;
    } else if (assetType === "CRYPTO") {
      quantity = Number((effectiveBudget / price).toFixed(8));
      shares = quantity;
      lots = 0;
    } else if (assetType === "GOLD") {
      quantity = Number((effectiveBudget / price).toFixed(4));
      shares = quantity;
      lots = 0;
    } else if (assetType === "BOND") {
      quantity = effectiveBudget;
      price = 1;
      shares = quantity;
      lots = 0;
    } else {
      // ETF, US STOCKS, MUTUAL_FUND, etc.
      quantity = Number((effectiveBudget / price).toFixed(4));
      shares = quantity;
      lots = 0;
    }
  } else {
    // Normal quantity / lot input
    if (assetType === "STOCK") {
      if (input.lots && Number(input.lots) > 0) {
        lots = Number(input.lots);
        shares = lotsToShares(lots);
        quantity = shares;
      } else if (input.quantity && Number(input.quantity) > 0) {
        quantity = Number(input.quantity);
        shares = quantity;
        lots = Number((quantity / 100).toFixed(2));
      } else {
        lots = 1;
        shares = 100;
        quantity = 100;
      }
    } else {
      quantity = Number(input.quantity || input.lots || 1);
      shares = quantity;
      lots = 0;
    }
  }

  const totalAmount = quantity * price + (input.type === "BUY" ? fee : -fee);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Insert transaction
    const txResult = await client.query(
      `INSERT INTO stock_transactions 
       (portfolio_id, ticker, asset_type, type, lots, shares, quantity, price_per_share, currency, total_amount, fee, transaction_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, COALESCE($12, NOW()), $13)
       RETURNING *;`,
      [
        input.portfolio_id,
        ticker,
        assetType,
        input.type,
        lots,
        shares,
        quantity,
        price,
        currency,
        totalAmount,
        fee,
        input.transaction_date || null,
        input.notes || null,
      ]
    );
    const transaction = txResult.rows[0];

    // 2. Fetch current holding
    const hResult = await client.query(
      "SELECT * FROM portfolio_holdings WHERE portfolio_id = $1 AND ticker = $2 AND asset_type = $3;",
      [input.portfolio_id, ticker, assetType]
    );

    let holding = null;

    if (input.type === "BUY") {
      if (hResult.rows.length === 0) {
        // Insert new holding
        const newHolding = await client.query(
          `INSERT INTO portfolio_holdings 
           (portfolio_id, ticker, asset_type, total_shares, total_lots, quantity, currency, avg_buy_price, total_invested)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING *;`,
          [
            input.portfolio_id,
            ticker,
            assetType,
            shares,
            lots,
            quantity,
            currency,
            price,
            quantity * price,
          ]
        );
        holding = newHolding.rows[0];
      } else {
        // Update existing holding with average price
        const current = hResult.rows[0];
        const curQuantity = Number(current.quantity || current.total_shares);
        const curAvg = Number(current.avg_buy_price);
        const newAvg = calculateNewAveragePrice(curQuantity, curAvg, quantity, price);
        const newTotalQuantity = curQuantity + quantity;
        const newTotalShares = assetType === "STOCK" ? newTotalQuantity : 0;
        const newTotalLots = assetType === "STOCK" ? newTotalQuantity / 100 : 0;
        const newTotalInvested = newTotalQuantity * newAvg;

        const updated = await client.query(
          `UPDATE portfolio_holdings 
           SET total_shares = $1, total_lots = $2, quantity = $3, avg_buy_price = $4, total_invested = $5, updated_at = NOW()
           WHERE id = $6
           RETURNING *;`,
          [
            newTotalShares,
            newTotalLots,
            newTotalQuantity,
            newAvg,
            newTotalInvested,
            current.id,
          ]
        );
        holding = updated.rows[0];
      }
    } else {
      // SELL action
      const current = hResult.rows[0];
      const curQuantity = current ? Number(current.quantity || current.total_shares) : 0;

      if (!current || curQuantity < quantity) {
        throw new Error(
          `Jumlah ${ticker} yang dimiliki tidak cukup untuk dijual (tersedia: ${curQuantity} unit)`
        );
      }

      const curAvg = Number(current.avg_buy_price);
      const remainingQuantity = curQuantity - quantity;
      const remainingShares = assetType === "STOCK" ? remainingQuantity : 0;
      const remainingLots = assetType === "STOCK" ? remainingQuantity / 100 : 0;
      const remainingInvested = remainingQuantity * curAvg;

      if (remainingQuantity <= 0) {
        await client.query("DELETE FROM portfolio_holdings WHERE id = $1;", [
          current.id,
        ]);
        holding = {
          ...current,
          quantity: 0,
          total_shares: 0,
          total_lots: 0,
          total_invested: 0,
        };
      } else {
        const updated = await client.query(
          `UPDATE portfolio_holdings 
           SET total_shares = $1, total_lots = $2, quantity = $3, total_invested = $4, updated_at = NOW()
           WHERE id = $5
           RETURNING *;`,
          [
            remainingShares,
            remainingLots,
            remainingQuantity,
            remainingInvested,
            current.id,
          ]
        );
        holding = updated.rows[0];
      }
    }

    await client.query("COMMIT");
    return { transaction, holding };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const getTransactions = async (
  portfolioId: number,
  ticker?: string,
  assetType?: AssetType
): Promise<StockTransaction[]> => {
  let query = "SELECT * FROM stock_transactions WHERE portfolio_id = $1";
  const params: any[] = [portfolioId];

  if (ticker) {
    params.push(formatTicker(ticker, assetType));
    query += ` AND ticker = $${params.length}`;
  }

  if (assetType) {
    params.push(assetType);
    query += ` AND asset_type = $${params.length}`;
  }

  query += " ORDER BY transaction_date DESC, id DESC;";
  const { rows } = await pool.query(query, params);
  return rows;
};

export const deleteTransaction = async (id: number): Promise<boolean> => {
  const result = await pool.query("DELETE FROM stock_transactions WHERE id = $1;", [id]);
  return (result.rowCount ?? 0) > 0;
};

