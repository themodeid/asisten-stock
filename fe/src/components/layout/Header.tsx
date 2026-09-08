"use client";

import Link from "next/link";
import { Menu, Search, User, Sun, Moon, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

export default function Header({ title = "Asisten Stock & Crypto", onMenuClick }: HeaderProps) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleOpenMenu = () => {
    if (onMenuClick) {
      onMenuClick();
    } else if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("toggle-mobile-menu"));
    }
  };

  const displayName = user?.full_name || user?.first_name || user?.username || "Investor Pro";

  return (
    <header className="h-16 shrink-0 w-full border-b border-zinc-200/80 dark:border-white/[0.06] bg-white/90 dark:bg-[#090b10]/90 backdrop-blur-xl px-4 sm:px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 transition-colors duration-200">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          onClick={handleOpenMenu}
          className="p-2 -ml-1 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] lg:hidden transition active:scale-95"
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
            <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 truncate tracking-tight">
              {title}
            </h2>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
        {/* Search bar with shortcut pill */}
        <div className="relative hidden md:block">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari emiten, koin, ETF..."
            className="bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/[0.08] text-zinc-800 dark:text-zinc-200 text-xs rounded-xl pl-8 pr-12 py-1.5 focus:outline-none focus:border-emerald-500/50 w-48 lg:w-60 transition placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
            ⌘K
          </kbd>
        </div>

        {/* Live Market Pulse Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-white/[0.06] text-xs font-medium shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
          <span className="text-zinc-700 dark:text-zinc-300 text-[11px] font-medium hidden md:inline">
            Live IDX & Kripto 24/7
          </span>
          <span className="text-zinc-700 dark:text-zinc-300 text-[11px] font-medium md:hidden">
            Live
          </span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-white/[0.06] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          title={theme === "dark" ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
        </button>

        {/* User Profile & Lock Action */}
        <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-white/[0.08]">
          <Link
            href="/profile"
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition"
            title="Buka Jati Diri & Profil Investor"
          >
            <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-gradient-to-br dark:from-zinc-800 dark:to-zinc-850 border border-zinc-200 dark:border-white/[0.1] flex items-center justify-center text-zinc-600 dark:text-zinc-300 shadow-inner shrink-0 relative">
              <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 ring-2 ring-white dark:ring-zinc-950" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-tight max-w-[130px] truncate">
                {displayName}
              </p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">Verified Investor</p>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
