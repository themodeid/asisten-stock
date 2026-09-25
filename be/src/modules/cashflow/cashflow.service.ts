import { pool } from "../../config/database";
import {
  CashflowTransaction,
  CreateCashflowInput,
  UpdateCashflowInput,
  CashflowSummary,
} from "./cashflow.type";
import { GoogleGenAI } from "@google/genai";
import { ENV } from "../../config/env";

export const getCashflowTransactions = async (
  userId: number = 1,
  filters: {
    type?: string;
    category?: string;
    wallet_id?: number;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ transactions: CashflowTransaction[]; total: number }> => {
  let query = `
    SELECT 
      c.*,
      w1.name as wallet_name,
      w2.name as to_wallet_name
    FROM cashflow_transactions c
    LEFT JOIN portfolios w1 ON c.wallet_id = w1.id
    LEFT JOIN portfolios w2 ON c.to_wallet_id = w2.id
    WHERE c.user_id = $1
  `;
  const params: any[] = [userId];

  if (filters.type) {
    params.push(filters.type.toUpperCase());
    query += ` AND c.type = $${params.length}`;
  }

  if (filters.category) {
    params.push(filters.category.toUpperCase());
    query += ` AND c.category = $${params.length}`;
  }

  if (filters.wallet_id) {
    params.push(filters.wallet_id);
    query += ` AND (c.wallet_id = $${params.length} OR c.to_wallet_id = $${params.length})`;
  }

  if (filters.startDate) {
    params.push(filters.startDate);
    query += ` AND c.transaction_date >= $${params.length}`;
  }

  if (filters.endDate) {
    params.push(filters.endDate);
    query += ` AND c.transaction_date <= $${params.length}`;
  }

  query += ` ORDER BY c.transaction_date DESC, c.id DESC`;

  const limit = filters.limit || 50;
  const offset = filters.offset || 0;

  params.push(limit);
  const limitIndex = params.length;
  params.push(offset);
  const offsetIndex = params.length;

  const countResult = await pool.query(
    query.replace("SELECT c.*, w1.name as wallet_name, w2.name as to_wallet_name", "SELECT COUNT(*)"),
    params.slice(0, params.length - 2)
  );
  const total = parseInt(countResult.rows[0]?.count || "0", 10);

  query += ` LIMIT $${limitIndex} OFFSET $${offsetIndex}`;
  const result = await pool.query(query, params);

  const transactions: CashflowTransaction[] = result.rows.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    wallet_id: row.wallet_id,
    wallet_name: row.wallet_name || "Kas Umum",
    to_wallet_id: row.to_wallet_id,
    to_wallet_name: row.to_wallet_name,
    type: row.type,
    category: row.category,
    amount: Number(row.amount),
    currency: row.currency,
    description: row.description,
    transaction_date: row.transaction_date,
    source: row.source,
    receipt_image_url: row.receipt_image_url,
    created_at: row.created_at,
  }));

  return { transactions, total };
};

export const getCashflowSummary = async (
  userId: number = 1,
  month?: number,
  year?: number
): Promise<CashflowSummary> => {
  const now = new Date();
  const targetMonth = month || now.getMonth() + 1;
  const targetYear = year || now.getFullYear();

  const startDate = `${targetYear}-${String(targetMonth).padStart(2, "0")}-01 00:00:00`;
  const nextMonth = targetMonth === 12 ? 1 : targetMonth + 1;
  const nextYear = targetMonth === 12 ? targetYear + 1 : targetYear;
  const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01 00:00:00`;

  // Aggregate income and expenses
  const aggResult = await pool.query(
    `
    SELECT 
      type,
      COALESCE(SUM(amount), 0) as total
    FROM cashflow_transactions
    WHERE user_id = $1
      AND transaction_date >= $2
      AND transaction_date < $3
    GROUP BY type;
    `,
    [userId, startDate, endDate]
  );

  let total_income = 0;
  let total_expense = 0;

  for (const row of aggResult.rows) {
    if (row.type === "INCOME") total_income = Number(row.total);
    if (row.type === "EXPENSE") total_expense = Number(row.total);
  }

  // Category breakdown for expenses
  const catResult = await pool.query(
    `
    SELECT 
      category,
      COALESCE(SUM(amount), 0) as total
    FROM cashflow_transactions
    WHERE user_id = $1
      AND type = 'EXPENSE'
      AND transaction_date >= $2
      AND transaction_date < $3
    GROUP BY category
    ORDER BY total DESC;
    `,
    [userId, startDate, endDate]
  );

  const category_breakdown = catResult.rows.map((row) => ({
    category: row.category,
    amount: Number(row.total),
    percentage: total_expense > 0 ? (Number(row.total) / total_expense) * 100 : 0,
  }));

  // Total cash balance across all portfolios/wallets
  const walletResult = await pool.query(
    `SELECT COALESCE(SUM(cash_balance), 0) as total_cash FROM portfolios WHERE user_id = $1;`,
    [userId]
  );
  const total_cash_balance = Number(walletResult.rows[0]?.total_cash || 0);

  return {
    total_income,
    total_expense,
    net_savings: total_income - total_expense,
    total_cash_balance,
    category_breakdown,
    period: { month: targetMonth, year: targetYear },
  };
};

export const createCashflowTransaction = async (
  userId: number = 1,
  input: CreateCashflowInput
): Promise<CashflowTransaction> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Resolve or fallback wallet_id
    let walletId = input.wallet_id;
    if (!walletId && input.wallet_name) {
      const wRes = await client.query(
        "SELECT id FROM portfolios WHERE user_id = $1 AND LOWER(name) = LOWER($2) LIMIT 1;",
        [userId, input.wallet_name.trim()]
      );
      if (wRes.rows.length > 0) {
        walletId = wRes.rows[0].id;
      }
    }

    if (!walletId) {
      // Default to first user wallet
      const defRes = await client.query(
        "SELECT id FROM portfolios WHERE user_id = $1 ORDER BY id ASC LIMIT 1;",
        [userId]
      );
      if (defRes.rows.length > 0) {
        walletId = defRes.rows[0].id;
      }
    }

    // Resolve to_wallet_id if transfer
    let toWalletId = input.to_wallet_id;
    if (input.type === "TRANSFER" && !toWalletId && input.to_wallet_name) {
      const toRes = await client.query(
        "SELECT id FROM portfolios WHERE user_id = $1 AND LOWER(name) = LOWER($2) LIMIT 1;",
        [userId, input.to_wallet_name.trim()]
      );
      if (toRes.rows.length > 0) {
        toWalletId = toRes.rows[0].id;
      }
    }

    const amount = Number(input.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error("Nominal transaksi harus lebih besar dari 0");
    }

    // Update wallet cash balance according to ACID rules
    if (input.type === "INCOME" && walletId) {
      await client.query(
        "UPDATE portfolios SET cash_balance = cash_balance + $1, updated_at = NOW() WHERE id = $2 AND user_id = $3;",
        [amount, walletId, userId]
      );
    } else if (input.type === "EXPENSE" && walletId) {
      await client.query(
        "UPDATE portfolios SET cash_balance = cash_balance - $1, updated_at = NOW() WHERE id = $2 AND user_id = $3;",
        [amount, walletId, userId]
      );
    } else if (input.type === "TRANSFER" && walletId && toWalletId) {
      await client.query(
        "UPDATE portfolios SET cash_balance = cash_balance - $1, updated_at = NOW() WHERE id = $2 AND user_id = $3;",
        [amount, walletId, userId]
      );
      await client.query(
        "UPDATE portfolios SET cash_balance = cash_balance + $1, updated_at = NOW() WHERE id = $2 AND user_id = $3;",
        [amount, toWalletId, userId]
      );
    }

    const insertResult = await client.query(
      `
      INSERT INTO cashflow_transactions (
        user_id, wallet_id, to_wallet_id, type, category, amount, currency,
        description, transaction_date, source, receipt_image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, NOW()), $10, $11)
      RETURNING *;
      `,
      [
        userId,
        walletId || null,
        toWalletId || null,
        input.type.toUpperCase(),
        (input.category || "LAINNYA").toUpperCase(),
        amount,
        input.currency || "IDR",
        input.description || null,
        input.transaction_date || null,
        input.source || "MANUAL",
        input.receipt_image_url || null,
      ]
    );

    await client.query("COMMIT");
    return insertResult.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const updateCashflowTransaction = async (
  id: number,
  userId: number = 1,
  input: UpdateCashflowInput
): Promise<CashflowTransaction> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Get old transaction
    const oldRes = await client.query(
      "SELECT * FROM cashflow_transactions WHERE id = $1 AND user_id = $2 FOR UPDATE;",
      [id, userId]
    );
    if (oldRes.rows.length === 0) {
      throw new Error("Transaksi tidak ditemukan");
    }
    const oldTx = oldRes.rows[0];

    // Revert old wallet balances
    const oldAmount = Number(oldTx.amount);
    if (oldTx.type === "INCOME" && oldTx.wallet_id) {
      await client.query("UPDATE portfolios SET cash_balance = cash_balance - $1 WHERE id = $2;", [oldAmount, oldTx.wallet_id]);
    } else if (oldTx.type === "EXPENSE" && oldTx.wallet_id) {
      await client.query("UPDATE portfolios SET cash_balance = cash_balance + $1 WHERE id = $2;", [oldAmount, oldTx.wallet_id]);
    } else if (oldTx.type === "TRANSFER" && oldTx.wallet_id && oldTx.to_wallet_id) {
      await client.query("UPDATE portfolios SET cash_balance = cash_balance + $1 WHERE id = $2;", [oldAmount, oldTx.wallet_id]);
      await client.query("UPDATE portfolios SET cash_balance = cash_balance - $1 WHERE id = $2;", [oldAmount, oldTx.to_wallet_id]);
    }

    // Apply new values
    const newType = input.type ? input.type.toUpperCase() : oldTx.type;
    const newAmount = input.amount !== undefined ? Number(input.amount) : oldAmount;
    const newWalletId = input.wallet_id !== undefined ? input.wallet_id : oldTx.wallet_id;
    const newToWalletId = input.to_wallet_id !== undefined ? input.to_wallet_id : oldTx.to_wallet_id;
    const newCategory = input.category ? input.category.toUpperCase() : oldTx.category;
    const newDesc = input.description !== undefined ? input.description : oldTx.description;
    const newDate = input.transaction_date ? input.transaction_date : oldTx.transaction_date;

    // Apply new wallet balances
    if (newType === "INCOME" && newWalletId) {
      await client.query("UPDATE portfolios SET cash_balance = cash_balance + $1 WHERE id = $2;", [newAmount, newWalletId]);
    } else if (newType === "EXPENSE" && newWalletId) {
      await client.query("UPDATE portfolios SET cash_balance = cash_balance - $1 WHERE id = $2;", [newAmount, newWalletId]);
    } else if (newType === "TRANSFER" && newWalletId && newToWalletId) {
      await client.query("UPDATE portfolios SET cash_balance = cash_balance - $1 WHERE id = $2;", [newAmount, newWalletId]);
      await client.query("UPDATE portfolios SET cash_balance = cash_balance + $1 WHERE id = $2;", [newAmount, newToWalletId]);
    }

    const updateRes = await client.query(
      `
      UPDATE cashflow_transactions SET
        type = $1,
        amount = $2,
        wallet_id = $3,
        to_wallet_id = $4,
        category = $5,
        description = $6,
        transaction_date = $7
      WHERE id = $8 AND user_id = $9
      RETURNING *;
      `,
      [newType, newAmount, newWalletId, newToWalletId, newCategory, newDesc, newDate, id, userId]
    );

    await client.query("COMMIT");
    return updateRes.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const deleteCashflowTransaction = async (
  id: number,
  userId: number = 1
): Promise<{ success: boolean; deleted_id: number }> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const oldRes = await client.query(
      "SELECT * FROM cashflow_transactions WHERE id = $1 AND user_id = $2 FOR UPDATE;",
      [id, userId]
    );
    if (oldRes.rows.length === 0) {
      throw new Error("Transaksi tidak ditemukan");
    }
    const oldTx = oldRes.rows[0];
    const oldAmount = Number(oldTx.amount);

    // Revert wallet balances
    if (oldTx.type === "INCOME" && oldTx.wallet_id) {
      await client.query("UPDATE portfolios SET cash_balance = cash_balance - $1 WHERE id = $2;", [oldAmount, oldTx.wallet_id]);
    } else if (oldTx.type === "EXPENSE" && oldTx.wallet_id) {
      await client.query("UPDATE portfolios SET cash_balance = cash_balance + $1 WHERE id = $2;", [oldAmount, oldTx.wallet_id]);
    } else if (oldTx.type === "TRANSFER" && oldTx.wallet_id && oldTx.to_wallet_id) {
      await client.query("UPDATE portfolios SET cash_balance = cash_balance + $1 WHERE id = $2;", [oldAmount, oldTx.wallet_id]);
      await client.query("UPDATE portfolios SET cash_balance = cash_balance - $1 WHERE id = $2;", [oldAmount, oldTx.to_wallet_id]);
    }

    await client.query("DELETE FROM cashflow_transactions WHERE id = $1 AND user_id = $2;", [id, userId]);
    await client.query("COMMIT");
    return { success: true, deleted_id: id };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const parseReceiptImageWithGemini = async (
  imageBuffer: Buffer,
  mimeType: string = "image/jpeg"
): Promise<{
  amount: number;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  category: string;
  merchant_or_notes: string;
  suggested_wallet?: string;
  date?: string;
}> => {
  if (!ENV.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY belum dikonfigurasi.");
  }

  const ai = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });
  const prompt = `
Kamu adalah asisten keuangan cerdas spesialis Indonesia. 
Analisis gambar struk belanja, struk restoran, nota pembayaran, atau bukti transfer m-banking/QRIS/GoPay/OVO/ShopeePay/BCA berikut.

Ekstrak informasi finansial dan kembalikan HANYA JSON murni (tanpa markdown backtick, tanpa komentar):
{
  "amount": <angka total pembayaran atau transfer dalam rupiah (number)>,
  "type": "<EXPENSE | INCOME | TRANSFER>",
  "category": "<MAKANAN | TRANSPORT | GAJI | INVESTASI | BELANJA | TAGIHAN | HIBURAN | KESEHATAN | LAINNYA>",
  "merchant_or_notes": "<Nama toko / penerima / merchant / keterangan>",
  "suggested_wallet": "<GoPay | OVO | ShopeePay | Bank BCA | Mandiri | Cash | Kas Umum>",
  "date": "<YYYY-MM-DD jika terbaca, atau null>"
}
Jika gambar adalah bukti transfer keluar atau pembayaran QRIS, gunakan type "EXPENSE".
Jika gambar adalah transfer masuk / gaji, gunakan type "INCOME".
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: imageBuffer.toString("base64"),
              mimeType: mimeType,
            },
          },
        ],
      },
    ],
  });

  const rawText = response.text?.trim() || "{}";
  const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return {
      amount: 0,
      type: "EXPENSE",
      category: "LAINNYA",
      merchant_or_notes: "Gagal memindai detail struk",
      suggested_wallet: "Kas Umum",
    };
  }
};
