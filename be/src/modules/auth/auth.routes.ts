import { Router } from "express";
import { handleLogin, handleGetMe, handleUpdateProfile, handleUpdatePassword } from "./auth.controller";

const router = Router();

router.post("/login", handleLogin);
router.get("/me", handleGetMe);
router.put("/profile", handleUpdateProfile);
router.put("/password", handleUpdatePassword);

export default router;
