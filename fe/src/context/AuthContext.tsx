"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/services/api";

export interface UserProfile {
  id: number;
  username: string;
  first_name: string;
  full_name: string;
  age: number;
  occupation: string;
  monthly_income: number;
  monthly_expenses: number;
  monthly_surplus: number;
  emergency_fund_months: number;
  risk_profile: "conservative" | "moderate" | "aggressive";
  investment_goals: string;
  time_horizon_years: number;
  strategy_preference: string;
  currency: string;
  timezone: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<{ success: boolean; message: string }>;
  updatePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "asisten_stock_auth_token";
const USER_KEY = "asisten_stock_auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedToken = localStorage.getItem(TOKEN_KEY);
        const savedUser = localStorage.getItem(USER_KEY);

        if (savedToken) {
          setToken(savedToken);
          if (savedUser) {
            try {
              setUser(JSON.parse(savedUser));
            } catch (e) {
              console.warn("Error parsing saved user:", e);
            }
          }

          // Fetch freshest profile from backend
          try {
            const res = await api.get("/auth/me");
            if (res.data?.data) {
              setUser(res.data.data);
              localStorage.setItem(USER_KEY, JSON.stringify(res.data.data));
            }
          } catch (fetchErr) {
            console.warn("Could not verify session with backend:", fetchErr);
          }
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await api.post("/auth/login", { username, password });
      if (res.data?.success && res.data?.data) {
        const { token: sessionToken, user: userProfile } = res.data.data;
        setToken(sessionToken);
        setUser(userProfile);
        localStorage.setItem(TOKEN_KEY, sessionToken);
        localStorage.setItem(USER_KEY, JSON.stringify(userProfile));
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data?.message || "Login gagal." };
    } catch (err: any) {
      const msg = err.response?.data?.message || "Username atau password salah.";
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  const refreshProfile = async () => {
    try {
      const res = await api.get("/auth/me");
      if (res.data?.data) {
        setUser(res.data.data);
        localStorage.setItem(USER_KEY, JSON.stringify(res.data.data));
      }
    } catch (err) {
      console.warn("Failed refreshing profile:", err);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await api.put("/auth/profile", data);
      if (res.data?.success && res.data?.data) {
        setUser(res.data.data);
        localStorage.setItem(USER_KEY, JSON.stringify(res.data.data));
        return { success: true, message: res.data.message || "Profil berhasil disimpan!" };
      }
      return { success: false, message: res.data?.message || "Gagal memperbarui profil." };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || "Gagal memperbarui profil." };
    }
  };

  const updatePassword = async (oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await api.put("/auth/password", { old_password: oldPassword, new_password: newPassword });
      return res.data;
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || "Gagal mengubah password." };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
        refreshProfile,
        updateProfile,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
