import { Router } from "express";
import * as alertController from "./alert.controller";

const router = Router();

router.get("/:userId?", alertController.getWatchlist);
router.post("/", alertController.addWatchlist);
router.delete("/:ticker", alertController.removeWatchlist);
router.post("/alert", alertController.createAlert);

export default router;
