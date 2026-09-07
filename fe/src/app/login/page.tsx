"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, Sparkles, AlertCircle, Sun, Moon } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [username, setUsername] = useState("adamwahyukur");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg("Harap masukkan username dan password Anda.");
      return;
    }

    setErrorMsg("");
    setIsSubmitting(true);

    try {
      const res = await login(username.trim(), password);
      if (res.success) {
        router.push("/dashboard");
      } else {
        setErrorMsg(res.message || "Akses ditolak. Kredensial tidak valid.");
      }
    } catch (err: any) {
      setErrorMsg("Terjadi gangguan koneksi ke server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-background text-foreground relative overflow-hidden px-4 py-8 transition-colors duration-200">
      {/* Background ambient lighting effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/[0.03] rounded-full blur-[120px] pointer-events-none" />

      {/* Theme Toggle in top right */}
      <button
        onClick={toggleTheme}
        className="absolute top-5 right-5 p-2 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition shadow-sm"
        title="Ganti Tema"
        aria-label="Toggle Theme"
      >
        {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
      </button>

      {/* Main Login Card */}
      <div className="relative w-full max-w-md bg-white/95 dark:bg-[#0d1017]/90 backdrop-blur-2xl border border-zinc-200/90 dark:border-white/10 rounded-3xl p-8 sm:p-10 shadow-xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.7)] transition-all">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-gradient-to-tr dark:from-emerald-500/20 dark:to-emerald-400/5 border border-emerald-300 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-inner">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              Private Wealth Vault
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight mt-1">
              Asisten+Stock AI
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Gerbang Otentikasi Eksklusif Pemilik Portofolio
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mt-6 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Username Investor
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="adamwahyukur"
                autoComplete="username"
                className="w-full bg-zinc-50 dark:bg-[#131722] border border-zinc-200 dark:border-zinc-800 focus:border-emerald-500/60 rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Master Password / Kunci Brankas
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full bg-zinc-50 dark:bg-[#131722] border border-zinc-200 dark:border-zinc-800 focus:border-emerald-500/60 rounded-xl pl-10 pr-11 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-500 focus:ring-0 w-3.5 h-3.5"
              />
              <span>Ingat sesi di perangkat ini</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white dark:text-zinc-950 font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white dark:border-zinc-950 border-t-transparent rounded-full animate-spin" />
                <span>Membuka Akses...</span>
              </div>
            ) : (
              <>
                <span>Buka Brankas Asisten+Stock</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Badge Footer */}
        <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center justify-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400/80" />
          <span>Proteksi Kriptografi JWT & PBKDF2 • Akses Privat Terenkripsi</span>
        </div>
      </div>
    </div>
  );
}
