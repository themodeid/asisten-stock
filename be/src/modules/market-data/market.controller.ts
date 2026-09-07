import { Request, Response, NextFunction } from "express";
import * as marketService from "./market.service";
import { successResponse } from "../../utils/response";
import { AppError } from "../../utils/appError";
import * as fxService from "./fx.service";

export const getQuote = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ticker = req.params.ticker;
    if (!ticker) throw new AppError("Ticker parameter is required", 400);

    const quote = await marketService.getStockQuote(ticker);
    return successResponse(res, quote, `Quote for ${quote.ticker}`);
  } catch (error: any) {
    next(error);
  }
};

export const getPopularQuotes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const popular = ["BBCA.JK", "BBRI.JK", "BMRI.JK", "TLKM.JK", "ASII.JK", "GOTO.JK"];
    const quotes = await marketService.getMultipleQuotes(popular);
    return successResponse(res, Object.values(quotes), "Popular stock quotes");
  } catch (error: any) {
    next(error);
  }
};

export const handleGetFxRate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const fxInfo = await fxService.getFxRateInfo();
    return successResponse(res, fxInfo, "Live USD/IDR Exchange Rate");
  } catch (error: any) {
    next(error);
  }
};
