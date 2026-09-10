import { Request, Response, NextFunction } from "express";
import * as transactionService from "./transaction.service";
import { successResponse } from "../../utils/response";
import { AppError } from "../../utils/appError";
import { z } from "zod";

export const createTransactionSchema = z.object({
  portfolio_id: z.number().int().positive().optional().default(1),
  ticker: z.string().min(1),
  asset_type: z.enum(["STOCK", "CRYPTO", "ETF", "BOND", "MUTUAL_FUND", "GOLD", "CASH"]).optional(),
  type: z.enum(["BUY", "SELL"]),
  lots: z.number().positive().optional(),
  shares: z.number().positive().optional(),
  quantity: z.number().positive().optional(),
  price_per_share: z.number().positive().optional(),
  total_budget: z.number().positive().optional(),
  currency: z.string().optional(),
  fee: z.number().optional().default(0),
  historical_pnl_percent: z.number().optional(),
  historical_buy_price: z.number().optional(),
  transaction_date: z.string().optional(),
  notes: z.string().optional(),
});

export const createTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validated = createTransactionSchema.parse(req.body);
    const result = await transactionService.recordTransaction(validated as any);
    return successResponse(
      res,
      result,
      `Transaksi ${validated.type} ${validated.ticker} berhasil dicatat`,
      201
    );
  } catch (error: any) {
    next(error);
  }
};

export const getTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const rawPid = req.params.portfolioId ?? req.query.portfolioId;
    let portfolioId: number | undefined = undefined;

    if (rawPid && rawPid !== "all" && rawPid !== "0") {
      const parsed = Number(rawPid);
      if (!isNaN(parsed) && parsed > 0) {
        portfolioId = parsed;
      }
    }

    const ticker = req.query.ticker as string | undefined;

    const data = await transactionService.getTransactions(portfolioId, ticker);
    return successResponse(res, data, "Transactions retrieved");
  } catch (error: any) {
    next(new AppError(error.message, 500));
  }
};

export const deleteTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    const deleted = await transactionService.deleteTransaction(id);
    if (!deleted) throw new AppError("Transaction not found", 404);
    return successResponse(res, null, "Transaction deleted");
  } catch (error: any) {
    next(error);
  }
};
