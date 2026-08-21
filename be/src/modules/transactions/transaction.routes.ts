import { Router } from "express";
import * as transactionController from "./transaction.controller";

const router = Router();

router.get("/:portfolioId?", transactionController.getTransactions);
router.post("/", transactionController.createTransaction);
router.delete("/:id", transactionController.deleteTransaction);

export default router;
