import { pool } from "../../config/database";
import { formatTicker, lotsToShares, calculateNewAveragePrice } from "../../utils/stockHelper";
import { StockTransaction, CreateTransactionInput } from "./transaction.type";

export const recordTransaction = async (
  input: CreateTransactionInput
): Promise<{ transaction: StockTransaction; holding: any }> => {
  const ticker = formatTicker(input.ticker);
  const lots = Number(input.lots);
  const price = Number(input.price_per_share);
  const shares = lotsToShares(lots);
  const fee = Number(input.fee || 0);
  const totalAmount = shares * price + (input.type === "BUY" ? fee : -fee);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Insert transaction
    const txResult = await client.query(
      `INSERT INTO stock_transactions 
       (portfolio_id, ticker, type, lots, shares, price_per_share, total_amount, fee, transaction_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, NOW()), $10)
       RETURNING *;`,
      [
        input.portfolio_id,
        ticker,
        input.type,
        lots,
        shares,
        price,
        totalAmount,
        fee,
        input.transaction_date || null,
        input.notes || null,
      ]
    );
    const transaction = txResult.rows[0];

    // 2. Fetch current holding
    const hResult = await client.query(
      "SELECT * FROM portfolio_holdings WHERE portfolio_id = $1 AND ticker = $2;",
      [input.portfolio_id, ticker]
    );

    let holding = null;

    if (input.type === "BUY") {
      if (hResult.rows.length === 0) {
        // Insert new holding
        const newHolding = await client.query(
          `INSERT INTO portfolio_holdings 
           (portfolio_id, ticker, total_shares, total_lots, avg_buy_price, total_invested)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *;`,
          [input.portfolio_id, ticker, shares, lots, price, shares * price]
        );
        holding = newHolding.rows[0];
      } else {
        // Update existing holding with average price
        const current = hResult.rows[0];
        const curShares = Number(current.total_shares);
        const curAvg = Number(current.avg_buy_price);
        const newAvg = calculateNewAveragePrice(curShares, curAvg, shares, price);
        const newTotalShares = curShares + shares;
        const newTotalLots = newTotalShares / 100;
        const newTotalInvested = newTotalShares * newAvg;

        const updated = await client.query(
          `UPDATE portfolio_holdings 
           SET total_shares = $1, total_lots = $2, avg_buy_price = $3, total_invested = $4, updated_at = NOW()
           WHERE id = $5
           RETURNING *;`,
          [newTotalShares, newTotalLots, newAvg, newTotalInvested, current.id]
        );
        holding = updated.rows[0];
      }
    } else {
      // SELL action
      if (hResult.rows.length === 0 || Number(hResult.rows[0].total_shares) < shares) {
        throw new Error(
          `Jumlah saham ${ticker} yang dimiliki tidak cukup untuk dijual (tersedia: ${
            hResult.rows[0]?.total_lots || 0
          } lot)`
        );
      }

      const current = hResult.rows[0];
      const curShares = Number(current.total_shares);
      const curAvg = Number(current.avg_buy_price);
      const remainingShares = curShares - shares;
      const remainingLots = remainingShares / 100;
      const remainingInvested = remainingShares * curAvg;

      if (remainingShares <= 0) {
        await client.query("DELETE FROM portfolio_holdings WHERE id = $1;", [
          current.id,
        ]);
        holding = { ...current, total_shares: 0, total_lots: 0, total_invested: 0 };
      } else {
        const updated = await client.query(
          `UPDATE portfolio_holdings 
           SET total_shares = $1, total_lots = $2, total_invested = $3, updated_at = NOW()
           WHERE id = $4
           RETURNING *;`,
          [remainingShares, remainingLots, remainingInvested, current.id]
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
  ticker?: string
): Promise<StockTransaction[]> => {
  let query = "SELECT * FROM stock_transactions WHERE portfolio_id = $1";
  const params: any[] = [portfolioId];

  if (ticker) {
    query += " AND ticker = $2";
    params.push(formatTicker(ticker));
  }

  query += " ORDER BY transaction_date DESC, id DESC;";
  const { rows } = await pool.query(query, params);
  return rows;
};

export const deleteTransaction = async (id: number): Promise<boolean> => {
  const result = await pool.query("DELETE FROM stock_transactions WHERE id = $1;", [id]);
  return (result.rowCount ?? 0) > 0;
};
