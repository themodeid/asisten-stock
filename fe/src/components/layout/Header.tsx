"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, Search, User, Sun, Moon, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import GlobalSearchModal from "@/components/search/GlobalSearchModal";
import BrandLogo from "@/components/ui/BrandLogo";

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
    <header className="h-16 shrink-0 w-full border-b border-zinc-200 dark:border-[#30363d] bg-white dark:bg-[#161b22] px-4 sm:px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 transition-colors duration-150">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          onClick={handleOpenMenu}
          className="p-2 -ml-1 rounded-md text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] lg:hidden transition"
          aria-label="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand indicator on small screens */}
        <div className="flex items-center gap-2.5 min-w-0 max-w-full">
          <BrandLogo size={28} className="lg:hidden" />
          <div className="min-w-0 flex-1">
            <h2 className="text-xs sm:text-sm md:text-base font-bold text-zinc-900 dark:text-[#f0f6fc] truncate tracking-tight max-w-[150px] sm:max-w-[220px] md:max-w-[320px] lg:max-w-none">
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
          className="relative hidden lg:flex items-center bg-zinc-100 dark:bg-[#0d1117] hover:bg-zinc-200/80 dark:hover:bg-[#010409] border border-zinc-200 dark:border-[#30363d] hover:dark:border-[#8b949e] text-zinc-500 dark:text-[#8b949e] text-xs rounded-md pl-8 pr-12 py-1.5 w-48 xl:w-64 transition text-left cursor-pointer select-none focus:border-[#58a6ff]"
        >
          <Search className="w-3.5 h-3.5 text-[#8b949e] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <span className="truncate">Type <kbd className="font-mono text-[10px] text-[#58a6ff]">/</kbd> or search...</span>
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-[#21262d] border border-zinc-300 dark:border-[#30363d] text-[10px] text-[#8b949e] font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Mobile / Tablet Search Trigger Icon */}
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="p-2 rounded-md bg-zinc-100 dark:bg-[#21262d] border border-zinc-200 dark:border-[#30363d] text-zinc-600 dark:text-[#8b949e] hover:text-zinc-900 dark:hover:text-[#f0f6fc] lg:hidden transition"
          title="Cari Saham & Aset Global"
          aria-label="Cari Saham & Aset Global"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md bg-zinc-100 dark:bg-[#21262d] border border-zinc-200 dark:border-[#30363d] text-zinc-600 dark:text-[#8b949e] hover:text-zinc-900 dark:hover:text-[#f0f6fc] transition-colors"
          title={theme === "dark" ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
        </button>

        {/* User Profile & Lock Action */}
        <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-[#30363d]">
          <Link
            href="/profile"
            className="flex items-center gap-2.5 p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-[#21262d] transition"
            title="Buka Jati Diri & Profil Investor"
          >
            <div className="w-8 h-8 rounded-md bg-zinc-100 dark:bg-[#21262d] border border-zinc-200 dark:border-[#30363d] flex items-center justify-center text-zinc-600 dark:text-[#c9d1d9] shrink-0">
              <User className="w-4 h-4 text-[#8b949e]" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-zinc-900 dark:text-[#f0f6fc] leading-tight max-w-[130px] truncate">
                {displayName}
              </p>
              <p className="text-[10px] text-zinc-500 dark:text-[#8b949e] font-mono">Sovereign Terminal</p>
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
