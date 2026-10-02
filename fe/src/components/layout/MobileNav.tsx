"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  PieChart,
  History,
  ArrowLeftRight,
  TrendingUp,
} from "lucide-react";

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-[#0d1117] border-t border-zinc-200 dark:border-[#30363d] lg:hidden px-3 py-1 safe-area-bottom">
      <div className="flex items-center justify-around max-w-md mx-auto relative">
        {/* 1. Portofolio (Beranda Utama) */}
        <Link
          href="/portfolio"
          className={`flex flex-col items-center justify-center py-1 px-2 transition-colors ${
            pathname === "/" || pathname?.startsWith("/portfolio")
              ? "text-zinc-900 dark:text-[#f0f6fc] font-semibold"
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-[#c9d1d9]"
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-1">Portofolio</span>
        </Link>

        {/* 2. Search / Watchlist */}
        <Link
          href="/watchlist"
          className={`flex flex-col items-center justify-center py-1 px-2 transition-colors ${
            pathname?.startsWith("/watchlist")
              ? "text-zinc-900 dark:text-[#f0f6fc] font-semibold"
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-[#c9d1d9]"
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] mt-1">Eksplor</span>
        </Link>

        {/* 3. Floating Center Action Button */}
        <Link
          href="/portfolio?tab=rebalance"
          className="flex flex-col items-center justify-center -mt-5 group active:scale-95 transition-transform"
          title="Transaksi Cepat & AI Rebalancing"
        >
          <div className="w-11 h-11 rounded-full bg-zinc-900 dark:bg-[#f0f6fc] text-white dark:text-[#0d1117] flex items-center justify-center shadow-none border-2 border-white dark:border-[#0d1117] transition-colors">
            <ArrowLeftRight className="w-4 h-4 font-bold" />
          </div>
        </Link>

        {/* 4. AI Analyst */}
        <Link
          href="/analytics"
          className={`flex flex-col items-center justify-center py-1 px-2 transition-colors ${
            pathname?.startsWith("/analytics")
              ? "text-zinc-900 dark:text-[#f0f6fc] font-semibold"
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-[#c9d1d9]"
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span className="text-[10px] mt-1">AI Analyst</span>
        </Link>

        {/* 5. Riwayat Transaksi */}
        <Link
          href="/transactions"
          className={`flex flex-col items-center justify-center py-1 px-2 transition-colors ${
            pathname?.startsWith("/transactions")
              ? "text-zinc-900 dark:text-[#f0f6fc] font-semibold"
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-[#c9d1d9]"
          }`}
        >
          <History className="w-5 h-5" />
          <span className="text-[10px] mt-1">Riwayat</span>
        </Link>
      </div>
    </nav>
  );
}
