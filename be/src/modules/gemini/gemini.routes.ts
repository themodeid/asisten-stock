import { Router } from "express";
import * as geminiController from "./gemini.controller";

const router = Router();

router.post("/chat", geminiController.chatWithAssistant);
router.get("/logs/:userId?", geminiController.getChatLogs);

export default router;
