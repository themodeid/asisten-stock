import { Request, Response, NextFunction } from "express";

/**
 * Middleware to sanitize string fields in request body.
 * Strips HTML tags and trims whitespace to prevent XSS.
 */
export const sanitizeBody = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.body && typeof req.body === "object") {
    sanitizeObject(req.body);
  }
  next();
};

function sanitizeObject(obj: Record<string, any>): void {
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (typeof value === "string") {
      // Strip HTML tags and trim
      obj[key] = value
        .replace(/<[^>]*>/g, "")
        .trim();
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      sanitizeObject(value);
    }
  }
}
