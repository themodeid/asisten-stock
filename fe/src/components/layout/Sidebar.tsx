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
  Sparkles,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Portofolio", href: "/portfolio", icon: PieChart },
  { name: "Riwayat Transaksi", href: "/transactions", icon: History },
  { name: "AI Analyst", href: "/analytics", icon: TrendingUp },
  { name: "Watchlist & Alerts", href: "/watchlist", icon: BookmarkCheck },
  { name: "Jarvis AI Chat", href: "/playground", icon: Bot },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col justify-between shrink-0 min-h-screen">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-zinc-800">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 font-bold text-zinc-100 text-sm flex items-center justify-center shadow-sm">
            JS
          </div>
          <div>
            <h1 className="font-semibold text-zinc-100 text-sm tracking-tight leading-none">
              Jarvis Stock
            </h1>
            <span className="text-[11px] text-zinc-400 font-normal">
              AI Portfolio Assistant
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
            Menu Navigasi
          </p>
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-xs transition-colors ${
                  isActive
                    ? "bg-zinc-800 text-zinc-100 border border-zinc-700/60 font-semibold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-zinc-100" : "text-zinc-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-3 m-3 rounded-xl bg-zinc-850 border border-zinc-800">
        <div className="flex items-center gap-2 text-xs text-zinc-300">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Telegram Bot Aktif</span>
        </div>
        <p className="text-[10px] text-zinc-500 mt-0.5">
          Gemini 2.5 Flash Connected
        </p>
      </div>
    </aside>
  );
}
