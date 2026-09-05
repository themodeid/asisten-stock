"use client";

import { Bell, Search, User } from "lucide-react";

export default function Header({ title }: { title: string }) {
  return (
    <header className="h-16 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur-md px-6 md:px-8 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h2 className="text-base font-semibold text-zinc-100">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Search bar */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari ticker (BBCA, BBRI)..."
            className="bg-zinc-800/90 border border-zinc-700 text-zinc-200 text-xs rounded-lg pl-9 pr-4 py-1.5 focus:outline-none focus:border-zinc-400 w-60 transition"
          />
        </div>

        {/* Telegram Connection Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-zinc-800 border border-zinc-700/60 text-zinc-300 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>@JarvisStockBot</span>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-2 border-l border-zinc-800">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-zinc-200 leading-tight">
              Investor Pro
            </p>
            <p className="text-[10px] text-zinc-400">ID: #1</p>
          </div>
        </div>
      </div>
    </header>
  );
}
