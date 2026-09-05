"use client";

import { Menu, Search, User } from "lucide-react";

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
}

export default function Header({ title, onMenuClick }: HeaderProps) {
  const handleOpenMenu = () => {
    if (onMenuClick) {
      onMenuClick();
    } else if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("toggle-mobile-menu"));
    }
  };

  return (
    <header className="h-16 border-b border-white/[0.06] bg-[#090b10]/80 backdrop-blur-xl px-4 sm:px-6 md:px-8 flex items-center justify-between sticky top-0 z-20 transition-all">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          onClick={handleOpenMenu}
          className="p-2 -ml-1 rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.06] lg:hidden transition active:scale-95"
          aria-label="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand indicator on small screens */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 font-black text-zinc-950 text-xs flex items-center justify-center lg:hidden shrink-0 shadow-sm shadow-emerald-500/30">
            JS
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-zinc-100 truncate tracking-tight">
              {title}
            </h2>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
        {/* Search bar with shortcut pill */}
        <div className="relative hidden md:block">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari emiten, koin, ETF..."
            className="bg-zinc-900/80 border border-white/[0.08] text-zinc-200 text-xs rounded-xl pl-8 pr-12 py-1.5 focus:outline-none focus:border-emerald-500/50 w-52 lg:w-64 transition placeholder:text-zinc-500"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-400 font-mono">
            ⌘K
          </kbd>
        </div>

        {/* Live Market Pulse Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-white/[0.06] text-xs font-medium shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
          <span className="text-zinc-300 text-[11px] font-medium hidden md:inline">
            Live IDX & Kripto 24/7
          </span>
          <span className="text-zinc-300 text-[11px] font-medium md:hidden">
            Live
          </span>
        </div>

        {/* Telegram Connection Badge */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-zinc-900/80 border border-white/[0.06] text-zinc-400 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[11px]">@JarvisStockBot</span>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-white/[0.08]">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-850 border border-white/[0.1] flex items-center justify-center text-zinc-300 shadow-inner shrink-0 relative">
            <User className="w-4 h-4 text-emerald-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-zinc-950" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-zinc-100 leading-tight">
              Investor Pro
            </p>
            <p className="text-[10px] text-emerald-400 font-mono">Tier: Verified</p>
          </div>
        </div>
      </div>
    </header>
  );
}
