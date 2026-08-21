"use client";

import { Bell, Search, User } from "lucide-react";

export default function Header({ title }: { title: string }) {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h2 className="text-xl font-bold text-slate-100">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Search bar */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari ticker (BBCA, BBRI)..."
            className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl pl-9 pr-4 py-1.5 focus:outline-none focus:border-blue-500 w-60 transition"
          />
        </div>

        {/* Telegram Connection Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-medium">
          <span>@JarvisStockBot</span>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold text-slate-200 leading-tight">
              Investor Pro
            </p>
            <p className="text-[11px] text-slate-400">ID: #1</p>
          </div>
        </div>
      </div>
    </header>
  );
}
