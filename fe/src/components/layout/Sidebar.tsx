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
  { name: "AI Simulator (Bot)", href: "/playground", icon: Bot },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 min-h-screen">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 bg-slate-950/40">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-blue-100" />
          </div>
          <div>
            <h1 className="font-bold text-slate-100 text-lg tracking-tight leading-none">
              Jarvis Stock
            </h1>
            <span className="text-xs text-blue-400 font-medium">
              AI Portfolio Assistant
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 m-4 rounded-2xl bg-gradient-to-b from-slate-800/60 to-slate-900 border border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Telegram Bot Active</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Connected to Gemini 2.5 Flash
        </p>
      </div>
    </aside>
  );
}
