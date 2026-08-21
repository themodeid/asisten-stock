import { Router } from "express";
import * as dashboardController from "./dashboard.controller";

const router = Router();

router.get("/:userId?", dashboardController.getDashboardData);

export default router;
