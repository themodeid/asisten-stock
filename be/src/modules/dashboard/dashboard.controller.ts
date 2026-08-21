import { Request, Response, NextFunction } from "express";
import * as dashboardService from "./dashboard.service";
import { successResponse } from "../../utils/response";
import { AppError } from "../../utils/appError";

export const getDashboardData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = Number(req.params.userId || req.query.userId || 1);
    const data = await dashboardService.getDashboardMetrics(userId);
    return successResponse(res, data, "Dashboard metrics retrieved successfully");
  } catch (error: any) {
    next(new AppError(error.message, 500));
  }
};
