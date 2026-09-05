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
  X,
} from "lucide-react";

export const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Portofolio", href: "/portfolio", icon: PieChart },
  { name: "Riwayat Transaksi", href: "/transactions", icon: History },
  { name: "AI Analyst", href: "/analytics", icon: TrendingUp },
  { name: "Watchlist & Alerts", href: "/watchlist", icon: BookmarkCheck },
  { name: "Jarvis AI Chat", href: "/playground", icon: Bot },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const content = (
    <div className="flex flex-col justify-between h-full">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 font-black text-zinc-950 text-xs flex items-center justify-center shadow-md shadow-emerald-500/25">
              JS
            </div>
            <div>
              <h1 className="font-bold text-zinc-100 text-sm tracking-tight leading-none flex items-center gap-1.5">
                Jarvis Stock
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 font-mono border border-emerald-800/60 font-semibold">
                  PRO
                </span>
              </h1>
              <span className="text-[10px] text-zinc-400 font-medium">
                AI Wealth Management
              </span>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] lg:hidden"
              aria-label="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
            Menu Utama
          </p>
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname?.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all relative ${
                  isActive
                    ? "bg-white/[0.07] text-white border border-white/[0.1] font-bold shadow-sm"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.03]"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                )}
                <Icon
                  className={`w-4 h-4 transition-colors ${isActive ? "text-emerald-400" : "text-zinc-400"}`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-3 m-3 rounded-2xl bg-zinc-900/80 border border-white/[0.06] shadow-sm">
        <div className="flex items-center gap-2 text-xs text-zinc-200 font-semibold">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
          <span>Telegram Bot Aktif</span>
        </div>
        <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
          Gemini 2.5 Flash Connected • Real-time Quotes
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#0a0d14]/95 backdrop-blur-xl border-r border-white/[0.06] flex-col justify-between shrink-0 h-screen sticky top-0 left-0 z-30 select-none overflow-y-auto">
        {content}
      </aside>

      {/* 2. Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
            onClick={onClose}
          />
          {/* Drawer Panel */}
          <aside className="relative w-72 max-w-[85vw] bg-[#0a0d14] border-r border-white/[0.08] flex flex-col justify-between h-full z-10 shadow-2xl select-none overflow-y-auto animate-in slide-in-from-left duration-200">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
