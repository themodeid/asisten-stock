import { Request, Response, NextFunction } from "express";
import * as transactionService from "./transaction.service";
import { successResponse } from "../../utils/response";
import { AppError } from "../../utils/appError";
import { z } from "zod";

export const createTransactionSchema = z.object({
  portfolio_id: z.number().int().positive(),
  ticker: z.string().min(1),
  type: z.enum(["BUY", "SELL"]),
  lots: z.number().positive(),
  price_per_share: z.number().positive(),
  fee: z.number().optional().default(0),
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
    const result = await transactionService.recordTransaction(validated);
    return successResponse(
      res,
      result,
      `Transaction ${validated.type} ${validated.ticker} recorded successfully`,
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
    const portfolioId = Number(req.params.portfolioId || req.query.portfolioId || 1);
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
