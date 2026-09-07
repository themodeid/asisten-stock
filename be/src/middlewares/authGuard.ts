import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../config/jwt";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware to protect routes with JWT authentication.
 * Extracts and verifies the Bearer token from Authorization header.
 * Attaches decoded user info to `req.user`.
 */
export const authGuard = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Akses ditolak. Token autentikasi tidak ditemukan.",
        statusCode: 401,
      });
      return;
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Akses ditolak. Format token tidak valid.",
        statusCode: 401,
      });
      return;
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: error.message || "Token tidak valid atau telah kedaluwarsa.",
      statusCode: 401,
    });
  }
};
