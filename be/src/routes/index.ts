import { Router } from "express";
import dashboardRoutes from "../modules/dashboard/dashboard.routes";
import userRoutes from "../modules/users/user.routes";
import portfolioRoutes from "../modules/portfolio/portfolio.routes";
import transactionRoutes from "../modules/transactions/transaction.routes";
import marketRoutes from "../modules/market-data/market.routes";
import watchlistRoutes from "../modules/watchlist-alert/alert.routes";
import geminiRoutes from "../modules/gemini/gemini.routes";
import telegramRoutes from "../modules/telegram/telegram.routes";
import authRoutes from "../modules/auth/auth.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/users", userRoutes);
router.use("/portfolio", portfolioRoutes);
router.use("/transactions", transactionRoutes);
router.use("/market", marketRoutes);
router.use("/watchlist", watchlistRoutes);
router.use("/gemini", geminiRoutes);
router.use("/telegram", telegramRoutes);

export default router;
