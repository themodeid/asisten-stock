import { Router } from "express";
import dashboardRoutes from "../modules/dashboard/dashboard.routes";
import userRoutes from "../modules/users/user.routes";
import portfolioRoutes from "../modules/portfolio/portfolio.routes";
import transactionRoutes from "../modules/transactions/transaction.routes";
import marketRoutes from "../modules/market-data/market.routes";
import technicalRoutes from "../modules/market-data/technical.routes";
import watchlistRoutes from "../modules/watchlist-alert/alert.routes";
import geminiRoutes from "../modules/gemini/gemini.routes";
import telegramRoutes from "../modules/telegram/telegram.routes";
import authRoutes from "../modules/auth/auth.routes";
import exportRoutes from "../modules/export/export.routes";
import newsRoutes from "../modules/news/news.routes";
import { authGuard } from "../middlewares/authGuard";

const router = Router();

// ======================================================
// 🔓 PUBLIC ROUTES — No authentication required
// ======================================================
router.use("/auth", authRoutes); // /auth/login is public, /auth/me etc. have their own authGuard
router.use("/market", marketRoutes); // Market data is public (quotes, fx-rate, technical)
router.use("/market", technicalRoutes); // Technical analysis is public
router.use("/news", newsRoutes); // Financial news feed & AI sentiment
router.use("/telegram", telegramRoutes); // Telegram webhook needs to be accessible

// ======================================================
// 🔐 PROTECTED ROUTES — Require valid JWT token
// ======================================================
router.use("/dashboard", authGuard, dashboardRoutes);
router.use("/users", authGuard, userRoutes);
router.use("/portfolio", authGuard, portfolioRoutes);
router.use("/transactions", authGuard, transactionRoutes);
router.use("/watchlist", authGuard, watchlistRoutes);
router.use("/gemini", authGuard, geminiRoutes);
router.use("/export", authGuard, exportRoutes);

export default router;
