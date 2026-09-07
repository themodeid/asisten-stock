"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Flame, Radio } from "lucide-react";

interface TickerItem {
  symbol: string;
  name: string;
  price: string;
  change: string;
  isPositive: boolean;
  type: "CRYPTO" | "STOCK" | "ETF" | "GOLD";
}

const mockTickers: TickerItem[] = [
  { symbol: "BTC", name: "Bitcoin", price: "$79,646", change: "-2.45%", isPositive: false, type: "CRYPTO" },
  { symbol: "ETH", name: "Ethereum", price: "$2,642", change: "+1.30%", isPositive: true, type: "CRYPTO" },
  { symbol: "BBCA", name: "BCA", price: "Rp9,850", change: "+0.77%", isPositive: true, type: "STOCK" },
  { symbol: "BBRI", name: "BRI", price: "Rp4,820", change: "-0.62%", isPositive: false, type: "STOCK" },
  { symbol: "VT", name: "Vanguard World", price: "$118.50", change: "+0.42%", isPositive: true, type: "ETF" },
  { symbol: "EMAS", name: "Emas Fisik", price: "Rp1,385,000/g", change: "+0.25%", isPositive: true, type: "GOLD" },
  { symbol: "USD/IDR", name: "Kurs Dollar", price: "Rp16,255", change: "+0.08%", isPositive: true, type: "ETF" },
];

export default function MarketTickerRibbon() {
  const [tickers, setTickers] = useState<TickerItem[]>(mockTickers);

  return (
    <div className="w-full overflow-hidden rounded-xl bg-white/90 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-white/[0.06] backdrop-blur-md p-1.5 shadow-sm">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 px-2">
        {/* Live Market Chip */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold shrink-0">
          <Radio className="w-3 h-3 animate-pulse text-emerald-600 dark:text-emerald-400" />
          <span className="tracking-wide uppercase">Market Live</span>
        </div>

        {/* Ticker Items */}
        {tickers.map((t) => (
          <div
            key={t.symbol}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100/90 dark:bg-zinc-850/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-800/90 border border-zinc-200/70 dark:border-white/[0.06] shrink-0 transition cursor-default text-xs"
          >
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-zinc-900 dark:text-zinc-100">{t.symbol}</span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 hidden sm:inline">{t.name}</span>
            </div>
            <span className="font-mono text-zinc-800 dark:text-zinc-200 font-semibold">{t.price}</span>
            <span
              className={`flex items-center gap-0.5 text-[11px] font-semibold ${
                t.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {t.isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {t.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
