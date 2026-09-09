"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, Search, User, Sun, Moon, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import GlobalSearchModal from "@/components/search/GlobalSearchModal";

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

export default function Header({ title = "Asisten Stock & Crypto", onMenuClick }: HeaderProps) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
        <div className="flex items-center gap-2.5 min-w-0 max-w-full">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 font-black text-zinc-950 text-xs flex items-center justify-center lg:hidden shrink-0 shadow-sm shadow-emerald-500/30">
            AS
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xs sm:text-sm md:text-base font-bold text-zinc-900 dark:text-zinc-100 truncate tracking-tight max-w-[150px] sm:max-w-[220px] md:max-w-[320px] lg:max-w-none">
              {title}
            </h2>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Search trigger button with shortcut pill - visible on lg+ desktop */}
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="relative hidden lg:flex items-center bg-zinc-100 dark:bg-zinc-900/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-white/[0.08] text-zinc-500 dark:text-zinc-400 text-xs rounded-xl pl-8 pr-12 py-1.5 w-48 xl:w-64 transition text-left cursor-pointer select-none"
        >
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <span className="truncate">Cari emiten US, IDX, koin...</span>
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Mobile / Tablet Search Trigger Icon */}
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-white/[0.06] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 lg:hidden transition"
          title="Cari Saham & Aset Global"
          aria-label="Cari Saham & Aset Global"
        >
          <Search className="w-4 h-4" />
        </button>


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

      {/* Global Command Palette / Search Dialog */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </header>
  );
}
