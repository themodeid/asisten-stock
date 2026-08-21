import { Router } from "express";
import * as telegramController from "./telegram.controller";

const router = Router();

router.post("/webhook", telegramController.handleWebhook);
router.get("/status", telegramController.getBotStatus);

export default router;
