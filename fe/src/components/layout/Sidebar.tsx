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
  Wallet,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import BrandLogo from "@/components/ui/BrandLogo";

export const navigation = [
  { name: "Portofolio", href: "/portfolio", icon: LayoutDashboard },
  { name: "Keuangan & Kas", href: "/cashflow", icon: Wallet },
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
        <div className="h-16 flex items-center justify-between px-5 border-b border-zinc-200 dark:border-[#30363d]">
          <div className="flex items-center gap-3">
            <BrandLogo size={32} />
            <div>
              <h1 className="font-bold text-zinc-900 dark:text-[#f0f6fc] text-sm tracking-tight leading-none flex items-center gap-1.5">
                Asisten+Stock
                <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-medium bg-zinc-100 dark:bg-[#21262d] text-zinc-600 dark:text-[#c9d1d9] border border-zinc-300 dark:border-[#30363d]">
                  TERMINAL
                </span>
              </h1>
              <span className="text-[10px] text-zinc-500 dark:text-[#8b949e] font-medium">
                Sovereign Wealth Management
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md text-zinc-500 dark:text-[#8b949e] hover:text-zinc-900 dark:hover:text-[#f0f6fc] hover:bg-zinc-100 dark:hover:bg-[#21262d] transition-colors"
              title={theme === "dark" ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-[#d29922]" /> : <Moon className="w-4 h-4 text-zinc-600" />}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-md text-zinc-400 dark:text-[#8b949e] hover:text-zinc-900 dark:hover:text-[#f0f6fc] hover:bg-zinc-100 dark:hover:bg-[#21262d] lg:hidden"
                aria-label="Tutup Menu"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#8b949e] mb-2">
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
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs transition-colors ${
                  isActive
                    ? "bg-[#21262d] text-[#f0f6fc] border-l-2 border-[#f78166] dark:border-[#f78166] font-semibold"
                    : "text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22] border-l-2 border-transparent"
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${isActive ? "text-[#f0f6fc]" : "text-[#8b949e]"}`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & User Session */}
      <div className="p-3 m-3 space-y-2 border-t border-[#30363d]">
        <div className="p-2.5 rounded-md bg-[#161b22] border border-[#30363d]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[#f0f6fc] font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-[#3fb950]" />
              <span>Telegram Bot</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d] font-mono">
              Live
            </span>
          </div>
          <p className="text-[10px] text-[#8b949e] mt-1 leading-relaxed">
            Gemini AI Connected • Real-time Sync
          </p>
        </div>

        {/* User Card with Quick Lock */}
        {user && (
          <div className="p-2 rounded-md bg-[#161b22] border border-[#30363d] flex items-center justify-between gap-2">
            <Link
              href="/profile"
              onClick={onClose}
              className="flex items-center gap-2 min-w-0 flex-1 hover:opacity-80 transition"
              title="Kelola Jati Diri & Profil"
            >
              <div className="w-7 h-7 rounded-md bg-[#21262d] border border-[#30363d] flex items-center justify-center text-[#f0f6fc] shrink-0 text-xs font-bold font-mono">
                {user.first_name?.[0] || "A"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#f0f6fc] truncate">
                  {user.full_name || user.first_name}
                </p>
                <p className="text-[10px] text-[#8b949e] truncate">
                  @{user.username}
                </p>
              </div>
            </Link>
            <button
              onClick={logout}
              className="p-1.5 rounded-md text-[#8b949e] hover:text-[#f85149] hover:bg-[#da3633]/15 transition shrink-0"
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
      <aside className="hidden lg:flex w-64 bg-white dark:bg-[#0d1117] border-r border-zinc-200 dark:border-[#30363d] flex-col justify-between shrink-0 h-screen sticky top-0 left-0 z-30 select-none overflow-y-auto transition-colors duration-150">
        {content}
      </aside>

      {/* 2. Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 transition-opacity"
            onClick={onClose}
          />
          {/* Drawer Panel */}
          <aside className="relative w-72 max-w-[85vw] bg-white dark:bg-[#0d1117] border-r border-zinc-200 dark:border-[#30363d] flex flex-col justify-between h-full z-10 shadow-xl select-none overflow-y-auto animate-in slide-in-from-left duration-150 transition-colors">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
