import { Request, Response, NextFunction } from "express";
import * as portfolioService from "./portfolio.service";
import { successResponse } from "../../utils/response";
import { AppError } from "../../utils/appError";

export const getPortfolioSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const portfolioId = Number(req.params.portfolioId || req.query.portfolioId || 1);
    const summary = await portfolioService.getPortfolioSummary(portfolioId);
    return successResponse(res, summary, "Portfolio summary retrieved");
  } catch (error: any) {
    next(new AppError(error.message, 500));
  }
};

export const getPrimaryPortfolio = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = Number(req.params.userId || req.query.userId || 1);
    const portfolio = await portfolioService.getPrimaryPortfolioByUserId(userId);
    const summary = await portfolioService.getPortfolioSummary(portfolio.id);
    return successResponse(res, summary, "Primary portfolio details");
  } catch (error: any) {
    next(new AppError(error.message, 500));
  }
};

export const manageCash = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const portfolioId = Number(req.params.portfolioId);
    const { amount, type } = req.body;
    if (!amount || amount <= 0) throw new AppError("Invalid amount", 400);
    if (!["DEPOSIT", "WITHDRAW"].includes(type))
      throw new AppError("Type must be DEPOSIT or WITHDRAW", 400);

    const updated = await portfolioService.updateCashBalance(portfolioId, amount, type);
    return successResponse(res, updated, `Cash ${type.toLowerCase()}ed successfully`);
  } catch (error: any) {
    next(error);
  }
};
