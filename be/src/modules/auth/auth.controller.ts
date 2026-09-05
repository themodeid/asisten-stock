import { Request, Response } from "express";
import * as authService from "./auth.service";

export const handleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: "Username dan password wajib diisi.",
      });
      return;
    }

    const userProfile = await authService.authenticateUser(username, password);

    if (!userProfile) {
      res.status(401).json({
        success: false,
        message: "Username atau password salah. Akses ditolak.",
      });
      return;
    }

    // Generate lightweight bearer token / session signature
    const sessionToken = Buffer.from(`${userProfile.id}:${userProfile.username}:${Date.now()}`).toString("base64");

    res.status(200).json({
      success: true,
      message: `Selamat datang kembali, ${userProfile.full_name || userProfile.first_name}!`,
      data: {
        token: sessionToken,
        user: userProfile,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server saat login.",
      error: error.message,
    });
  }
};

export const handleGetMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userProfile = await authService.getUserFinancialProfile(1);
    if (!userProfile) {
      res.status(404).json({ success: false, message: "Pengguna tidak ditemukan." });
      return;
    }

    res.status(200).json({
      success: true,
      data: userProfile,
    });
  } catch (error: any) {
    console.error("GetMe error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const handleUpdateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const updated = await authService.updateFinancialProfile(1, req.body);
    res.status(200).json({
      success: true,
      message: "Jati diri finansial dan profil risiko berhasil disimpan!",
      data: updated,
    });
  } catch (error: any) {
    console.error("UpdateProfile error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const handleUpdatePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { old_password, new_password } = req.body;
    if (!new_password) {
      res.status(400).json({ success: false, message: "Password baru wajib diisi." });
      return;
    }

    const result = await authService.updatePassword(1, old_password || "", new_password);
    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error: any) {
    console.error("UpdatePassword error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
