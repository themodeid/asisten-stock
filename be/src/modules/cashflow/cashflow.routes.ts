import { Router } from "express";
import multer from "multer";
import * as cashflowController from "./cashflow.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const router = Router();

router.get("/", cashflowController.getTransactions);
router.get("/summary", cashflowController.getSummary);
router.post("/", cashflowController.createTransaction);
router.put("/:id", cashflowController.updateTransaction);
router.delete("/:id", cashflowController.deleteTransaction);
router.post("/scan-receipt", upload.single("receipt"), cashflowController.scanReceipt);

export default router;
