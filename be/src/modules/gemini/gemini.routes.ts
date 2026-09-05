import { Router } from "express";
import multer from "multer";
import * as geminiController from "./gemini.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const router = Router();

router.post("/chat", geminiController.chatWithAssistant);
router.post("/ocr-transaction", upload.single("image"), geminiController.ocrTransactionReceipt);
router.get("/logs/:userId?", geminiController.getChatLogs);
router.delete("/logs/:userId?", geminiController.clearChatLogs);

export default router;
