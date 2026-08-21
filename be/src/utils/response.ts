import { Response } from "express";

export const successResponse = (
  res: Response,
  data: any = null,
  message = "Operation successful",
  statusCode = 200
) => {
  return res.status(statusCode).json({
    status: "success",
    statusCode,
    message,
    data,
  });
};
