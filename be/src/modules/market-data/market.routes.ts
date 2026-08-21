import { Router } from "express";
import * as marketController from "./market.controller";

const router = Router();

router.get("/popular", marketController.getPopularQuotes);
router.get("/quote/:ticker", marketController.getQuote);

export default router;
