"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PieChart,
  History,
  TrendingUp,
  BookmarkCheck,
  Bot,
  Newspaper,
  Sun,
  Moon,
  X,
  Shield,
  LogOut,
  User,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";

export const navigation = [
  { name: "Portofolio", href: "/portfolio", icon: LayoutDashboard },
  { name: "Riwayat Transaksi", href: "/transactions", icon: History },
  { name: "AI Analyst", href: "/analytics", icon: TrendingUp },
  { name: "Berita & Sentimen", href: "/news", icon: Newspaper },
  { name: "Watchlist & Alerts", href: "/watchlist", icon: BookmarkCheck },
  { name: "Asisten AI Chat", href: "/playground", icon: Bot },
  { name: "Jati Diri & Profil", href: "/profile", icon: Shield },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const content = (
    <div className="flex flex-col justify-between h-full">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-zinc-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-lg shadow-blue-500/25 ring-1 ring-blue-400/30">
              AS
            </div>
            <div>
              <h1 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm tracking-tight leading-none flex items-center gap-1.5">
                Asisten+Stock
                <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  TERMINAL
                </span>
              </h1>
              <span className="text-[10px] text-zinc-500 dark:text-slate-400 font-medium">
                Sovereign Wealth Management
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-zinc-500 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-slate-800/60 transition-colors"
              title={theme === "dark" ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-slate-800/60 lg:hidden"
                aria-label="Tutup Menu"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-slate-500 mb-2">
            Menu Utama
          </p>
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/portfolio" && pathname === "/") ||
              (item.href !== "/portfolio" && pathname?.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all relative ${
                  isActive
                    ? "bg-blue-500/10 text-white border border-blue-500/30 font-semibold shadow-sm"
                    : "text-zinc-600 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-slate-100 hover:bg-zinc-100 dark:hover:bg-slate-800/40"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-blue-500 shadow-sm shadow-blue-400/60" />
                )}
                <Icon
                  className={`w-4 h-4 transition-colors ${isActive ? "text-blue-400" : "text-zinc-400 dark:text-slate-500"}`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & User Session */}
      <div className="p-3 m-3 space-y-2">
        <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-slate-900/80 border border-zinc-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-zinc-800 dark:text-slate-200 font-semibold">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-400/50" />
              <span>Telegram Bot</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
              Live Sync
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 dark:text-slate-400 mt-1 leading-relaxed">
            Gemini AI Connected • Real-time Sync
          </p>
        </div>

        {/* User Card with Quick Lock */}
        {user && (
          <div className="p-2.5 rounded-2xl bg-zinc-100/80 dark:bg-slate-900/60 border border-zinc-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
            <Link
              href="/profile"
              onClick={onClose}
              className="flex items-center gap-2 min-w-0 flex-1 hover:opacity-80 transition"
              title="Kelola Jati Diri & Profil"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 text-xs font-bold">
                {user.first_name?.[0] || "A"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {user.full_name || user.first_name}
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-slate-400 truncate">
                  @{user.username}
                </p>
              </div>
            </Link>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition shrink-0"
              title="Kunci / Logout Akun"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-xl border-r border-zinc-200/80 dark:border-slate-800/80 flex-col justify-between shrink-0 h-screen sticky top-0 left-0 z-30 select-none overflow-y-auto transition-colors duration-200">
        {content}
      </aside>

      {/* 2. Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md transition-opacity"
            onClick={onClose}
          />
          {/* Drawer Panel */}
          <aside className="relative w-72 max-w-[85vw] bg-white dark:bg-[#0b0f19] border-r border-zinc-200 dark:border-slate-800 flex flex-col justify-between h-full z-10 shadow-2xl select-none overflow-y-auto animate-in slide-in-from-left duration-200 transition-colors duration-200">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
