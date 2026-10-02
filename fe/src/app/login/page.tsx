"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, Sun, Moon } from "lucide-react";
import BrandLogo from "@/components/ui/BrandLogo";

export default function LoginPage() {
 const router = useRouter();
 const { login, isAuthenticated, isLoading: authLoading } = useAuth();
 const { theme, toggleTheme } = useTheme();

 const [username, setUsername] = useState("adamwahyukur");
 const [password, setPassword] = useState("adamwahyu");
 const [showPassword, setShowPassword] = useState(false);
 const [rememberMe, setRememberMe] = useState(true);
 const [errorMsg, setErrorMsg] = useState("");
 const [isSubmitting, setIsSubmitting] = useState(false);

 // If already authenticated, redirect to portfolio
 useEffect(() => {
 if (!authLoading && isAuthenticated) {
 router.replace("/portfolio");
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
 router.push("/portfolio");
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
 <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-background text-foreground relative overflow-hidden px-4 py-8 transition-colors duration-150">
 {/* Theme Toggle in top right */}
 <button
 onClick={toggleTheme}
 className="absolute top-5 right-5 p-2 rounded-md bg-white dark:bg-[#21262d] border border-zinc-200 dark:border-[#30363d] text-[#6e7681] dark:text-[#8b949e] hover:text-zinc-900 dark:hover:text-[#f0f6fc] transition shadow-none"
 title="Ganti Tema"
 aria-label="Toggle Theme"
 >
 {theme === "dark" ? <Sun className="w-4 h-4 text-[#d29922]" /> : <Moon className="w-4 h-4 text-[#6e7681]" />}
 </button>

 {/* Main Login Card - Styled as a GitHub Sign-in Box */}
 <div className="relative w-full max-w-sm bg-white dark:bg-[#161b22] border border-zinc-200 dark:border-[#30363d] rounded-md p-6 sm:p-8 shadow-[0_1px_0_rgba(27,31,36,0.04)] transition-all">
 {/* Brand Header */}
 <div className="text-center space-y-3">
 <div className="inline-flex items-center justify-center">
 <BrandLogo size={48} />
 </div>

 <div>
 <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#8b949e] dark:text-[#8b949e] uppercase tracking-wider">
 <Lock className="w-3.5 h-3.5 text-[#58a6ff]" />
 Sovereign Terminal
 </div>
 <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-[#f0f6fc] tracking-tight mt-1.5">
 Sign in to Asisten+Stock
 </h1>
 <p className="text-xs text-[#8b949e] dark:text-[#8b949e] mt-1">
 Portofolio & Wealth Management Sandbox
 </p>
 </div>
 </div>

 {/* Error Alert */}
 {errorMsg && (
 <div className="mt-5 p-3 rounded-md bg-rose-50 dark:bg-[#da3633]/15 border border-rose-300 dark:border-[#da3633]/40 text-rose-700 dark:text-[#f85149] text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2">
 <AlertCircle className="w-4 h-4 text-[#f85149] shrink-0 mt-0.5" />
 <span>{errorMsg}</span>
 </div>
 )}

 {/* Login Form */}
 <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
 <div className="space-y-1.5">
 <label className="text-xs font-semibold text-zinc-700 dark:text-[#c9d1d9]">
 Username or Email
 </label>
 <div className="relative">
 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e] dark:text-[#8b949e]">
 <User className="w-4 h-4" />
 </span>
 <input
 type="text"
 value={username}
 onChange={(e) => setUsername(e.target.value)}
 placeholder="adamwahyukur"
 autoComplete="username"
 className="w-full bg-zinc-50 dark:bg-[#0d1117] border border-zinc-200 dark:border-[#30363d] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] rounded-md pl-9 pr-3 py-2 text-xs text-zinc-900 dark:text-[#f0f6fc] placeholder-zinc-400 dark:placeholder-[#6e7681] focus:outline-none transition font-mono"
 />
 </div>
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-semibold text-zinc-700 dark:text-[#c9d1d9]">
 Password
 </label>
 <div className="relative">
 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e] dark:text-[#8b949e]">
 <Lock className="w-4 h-4" />
 </span>
 <input
 type={showPassword ? "text" : "password"}
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 placeholder="••••••••"
 autoComplete="current-password"
 className="w-full bg-zinc-50 dark:bg-[#0d1117] border border-zinc-200 dark:border-[#30363d] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] rounded-md pl-9 pr-10 py-2 text-xs text-zinc-900 dark:text-[#f0f6fc] placeholder-zinc-400 dark:placeholder-[#6e7681] focus:outline-none transition"
 />
 <button
 type="button"
 onClick={() => setShowPassword(!showPassword)}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-zinc-700 dark:hover:text-[#f0f6fc] transition"
 >
 {showPassword ? <EyeOff className="w-3.5 h-3.5 text-[#8b949e]" /> : <Eye className="w-3.5 h-3.5 text-[#8b949e]" />}
 </button>
 </div>
 </div>

 <div className="flex items-center justify-between text-xs pt-0.5">
 <label className="flex items-center gap-2 text-[#6e7681] dark:text-[#8b949e] cursor-pointer select-none">
 <input
 type="checkbox"
 checked={rememberMe}
 onChange={(e) => setRememberMe(e.target.checked)}
 className="rounded border-zinc-300 dark:border-[#30363d] bg-zinc-100 dark:bg-[#0d1117] text-[#238636] focus:ring-0 w-3.5 h-3.5"
 />
 <span>Remember me</span>
 </label>
 </div>

 {/* Quick Credential Helper Banner */}
 <div className="p-2.5 rounded-md bg-zinc-50 dark:bg-[#0d1117] border border-zinc-200 dark:border-[#30363d] text-xs text-zinc-700 dark:text-[#c9d1d9] flex items-center justify-between gap-2">
 <div className="space-y-0.5">
 <div className="font-semibold flex items-center gap-1 text-[10px] uppercase tracking-wider text-[#8b949e] dark:text-[#8b949e]">
 <ShieldCheck className="w-3 h-3 text-[#3fb950]" />
 Demo Credentials
 </div>
 <div className="text-[11px] text-[#6e7681] dark:text-[#8b949e] font-mono">
 adamwahyukur • adamwahyu
 </div>
 </div>
 <button
 type="button"
 onClick={() => {
 setUsername("adamwahyukur");
 setPassword("adamwahyu");
 }}
 className="shrink-0 px-2 py-0.5 rounded-md bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] hover:text-[#f0f6fc] border border-[#30363d] font-medium text-[11px] transition"
 >
 Fill
 </button>
 </div>

 {/* GitHub Iconic Green Submit Button */}
 <button
 type="submit"
 disabled={isSubmitting}
 className="w-full mt-2 py-2 px-4 rounded-md bg-[#238636] hover:bg-[#2ea043] text-[#f0f6fc] border border-[rgba(240,246,252,0.1)] shadow-[0_1px_0_rgba(27,31,36,0.1)] font-semibold text-xs tracking-wide transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:bg-[#238636]"
 >
 {isSubmitting ? (
 <div className="flex items-center gap-2">
 <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
 <span>Signing in...</span>
 </div>
 ) : (
 <>
 <span>Sign in</span>
 <ArrowRight className="w-3.5 h-3.5 text-[#f0f6fc]" />
 </>
 )}
 </button>
 </form>
 </div>

 <div className="mt-6 text-center text-xs text-[#8b949e] space-x-4">
 <span className="hover:text-[#58a6ff] cursor-pointer">Security</span>
 <span>•</span>
 <span className="hover:text-[#58a6ff] cursor-pointer">Sovereign Vault</span>
 <span>•</span>
 <span className="hover:text-[#58a6ff] cursor-pointer">GitHub Primer UI</span>
 </div>
 </div>
 );
}
