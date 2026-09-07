import { Router } from "express";
import { handleLogin, handleGetMe, handleUpdateProfile, handleUpdatePassword } from "./auth.controller";
import { authGuard } from "../../middlewares/authGuard";

const router = Router();

// Public route — no auth required
router.post("/login", handleLogin);

// Protected routes — require valid JWT
router.get("/me", authGuard, handleGetMe);
router.put("/profile", authGuard, handleUpdateProfile);
router.put("/password", authGuard, handleUpdatePassword);

export default router;
