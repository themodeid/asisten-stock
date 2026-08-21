import { Request, Response, NextFunction } from "express";
import { handleTelegramMessage } from "./telegram.bot";
import { successResponse } from "../../utils/response";

export const handleWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const update = req.body;
    if (update && update.message) {
      // Process asynchronously
      handleTelegramMessage(update.message).catch(console.error);
    }
    return res.status(200).send("OK");
  } catch (error: any) {
    next(error);
  }
};

export const getBotStatus = (req: Request, res: Response) => {
  return successResponse(res, {
    status: "online",
    timestamp: new Date(),
  });
};
