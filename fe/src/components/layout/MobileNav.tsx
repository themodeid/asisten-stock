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
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#090b0e]/95 backdrop-blur-xl border-t border-white/[0.08] lg:hidden px-3 py-1.5 shadow-2xl safe-area-bottom">
      <div className="flex items-center justify-around max-w-md mx-auto relative">
        {/* 1. Portofolio (Beranda Utama) */}
        <Link
          href="/portfolio"
          className={`flex flex-col items-center justify-center py-1 px-2 transition-all ${
            pathname === "/" || pathname?.startsWith("/portfolio")
              ? "text-[#D2F831] font-bold scale-105"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-1">Portofolio</span>
        </Link>

        {/* 2. Search / Watchlist */}
        <Link
          href="/watchlist"
          className={`flex flex-col items-center justify-center py-1 px-2 transition-all ${
            pathname?.startsWith("/watchlist")
              ? "text-[#D2F831] font-bold scale-105"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] mt-1">Eksplor</span>
        </Link>

        {/* 3. Floating Center Action Button (Pluang White Circle with Dual Arrows) */}
        <Link
          href="/portfolio?tab=rebalance"
          className="flex flex-col items-center justify-center -mt-6 group active:scale-95 transition-transform"
          title="Transaksi Cepat & AI Rebalancing"
        >
          <div className="w-12 h-12 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-lg shadow-white/20 border-2 border-[#090b0e] group-hover:bg-zinc-100 transition">
            <ArrowLeftRight className="w-5 h-5 text-zinc-950 font-black" />
          </div>
        </Link>

        {/* 4. AI Analyst */}
        <Link
          href="/analytics"
          className={`flex flex-col items-center justify-center py-1 px-2 transition-all ${
            pathname?.startsWith("/analytics")
              ? "text-[#D2F831] font-bold scale-105"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span className="text-[10px] mt-1">AI Analyst</span>
        </Link>

        {/* 5. Riwayat Transaksi */}
        <Link
          href="/transactions"
          className={`flex flex-col items-center justify-center py-1 px-2 transition-all ${
            pathname?.startsWith("/transactions")
              ? "text-[#D2F831] font-bold scale-105"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <History className="w-5 h-5" />
          <span className="text-[10px] mt-1">Riwayat</span>
        </Link>
      </div>
    </nav>
  );
}
