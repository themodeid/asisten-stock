import { Request, Response, NextFunction } from "express";
import * as alertService from "./alert.service";
import { successResponse } from "../../utils/response";
import { AppError } from "../../utils/appError";

export const getWatchlist = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = Number(req.params.userId || req.query.userId || 1);
    const watchlist = await alertService.getWatchlistByUserId(userId);
    return successResponse(res, watchlist, "Watchlist retrieved");
  } catch (error: any) {
    next(new AppError(error.message, 500));
  }
};

export const addWatchlist = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user_id, ticker, target_buy_price, target_sell_price, notes } = req.body;
    if (!ticker) throw new AppError("Ticker is required", 400);

    const item = await alertService.addToWatchlist(
      Number(user_id || 1),
      ticker,
      target_buy_price,
      target_sell_price,
      notes
    );
    return successResponse(res, item, `${ticker} added to watchlist`, 201);
  } catch (error: any) {
    next(error);
  }
};

export const removeWatchlist = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = Number(req.query.userId || 1);
    const ticker = req.params.ticker;
    await alertService.removeFromWatchlist(userId, ticker);
    return successResponse(res, null, `${ticker} removed from watchlist`);
  } catch (error: any) {
    next(error);
  }
};

export const createAlert = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user_id, ticker, target_price, condition } = req.body;
    if (!ticker || !target_price || !condition) {
      throw new AppError("ticker, target_price, and condition are required", 400);
    }

    const alert = await alertService.createPriceAlert(
      Number(user_id || 1),
      ticker,
      Number(target_price),
      condition
    );
    return successResponse(res, alert, "Price alert created", 201);
  } catch (error: any) {
    next(error);
  }
};
