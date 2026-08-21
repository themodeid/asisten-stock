import { Router } from "express";
import * as portfolioController from "./portfolio.controller";

const router = Router();

router.get("/summary/:portfolioId?", portfolioController.getPortfolioSummary);
router.get("/user/:userId", portfolioController.getPrimaryPortfolio);
router.post("/:portfolioId/cash", portfolioController.manageCash);

export default router;
