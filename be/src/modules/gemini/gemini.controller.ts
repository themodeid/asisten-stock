import { Request, Response, NextFunction } from "express";
import * as geminiService from "./gemini.service";
import { successResponse } from "../../utils/response";
import { AppError } from "../../utils/appError";
import { pool } from "../../config/database";

export const chatWithAssistant = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user_id, message, image_url } = req.body;
    if (!message && !image_url) {
      throw new AppError("Message or image is required", 400);
    }

    const userId = Number(user_id || 1);
    const result = await geminiService.processUserMessage(
      userId,
      message || "",
      image_url
    );

    return successResponse(res, result, "Message processed");
  } catch (error: any) {
    next(new AppError(error.message, 500));
  }
};

export const getChatLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = Number(req.params.userId || req.query.userId || 1);
    const { rows } = await pool.query(
      "SELECT * FROM chat_logs WHERE user_id = $1 ORDER BY created_at ASC LIMIT 100;",
      [userId]
    );
    return successResponse(res, rows, "Chat logs retrieved");
  } catch (error: any) {
    next(new AppError(error.message, 500));
  }
};

export const clearChatLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = Number(req.params.userId || req.query.userId || 1);
    await pool.query("DELETE FROM chat_logs WHERE user_id = $1;", [userId]);
    return successResponse(res, null, "Chat logs cleared");
  } catch (error: any) {
    next(new AppError(error.message, 500));
  }
};
