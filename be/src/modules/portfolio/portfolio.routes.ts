import { Router } from "express";
import * as portfolioController from "./portfolio.controller";

const router = Router();

router.get("/wallets", portfolioController.getWallets);
router.post("/wallets", portfolioController.createWallet);
router.delete("/wallets/:id", portfolioController.deleteWallet);

router.get("/summary/:portfolioId?", portfolioController.getPortfolioSummary);
router.get("/user/:userId", portfolioController.getPrimaryPortfolio);
router.get("/health/:portfolioId?", portfolioController.getPortfolioHealth);
router.get("/dividends/:portfolioId?", portfolioController.getPortfolioDividends);
router.get("/export/:portfolioId?", portfolioController.exportPortfolioReport);

router.post("/rebalance", portfolioController.getRebalancePlan);
router.get("/rebalance/:portfolioId?", portfolioController.getRebalancePlan);
router.post("/tax-simulate", portfolioController.simulateTax);
router.get("/tax-summary/:portfolioId?", portfolioController.getTaxSummary);
router.get("/fx-analytics/:portfolioId?", portfolioController.getFxAnalytics);
router.get("/chart/:portfolioId?", portfolioController.getPortfolioChart);
router.put("/calibrate", portfolioController.calibrateHolding);

export default router;
