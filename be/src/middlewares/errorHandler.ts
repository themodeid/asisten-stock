import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/appError";
import { ENV } from "../config/env";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err;

  if (!(error instanceof AppError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    error = new AppError(message, statusCode);
  }

  const statusCode = error.statusCode || 500;
  const status = error.status || "error";

  console.error(`❌ [Error Handler] ${req.method} ${req.originalUrl}:`, {
    statusCode,
    message: error.message,
    details: error.details,
    stack: ENV.NODE_ENV === "development" ? error.stack : undefined,
  });

  return res.status(statusCode).json({
    status,
    statusCode,
    message: error.message,
    ...(error.details && { details: error.details }),
    ...(ENV.NODE_ENV === "development" && { stack: error.stack }),
  });
};
