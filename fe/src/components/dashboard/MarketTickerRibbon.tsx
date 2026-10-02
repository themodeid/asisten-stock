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
  { symbol: "BTC", name: "Bitcoin", price: "$83,550", change: "+1.97%", isPositive: true, type: "CRYPTO" },
  { symbol: "VT", name: "Vanguard World", price: "$157.85", change: "+0.45%", isPositive: true, type: "ETF" },
  { symbol: "EMAS", name: "Antam/PAXG", price: "Rp2,421,034/g", change: "+0.50%", isPositive: true, type: "GOLD" },
  { symbol: "USD/IDR", name: "Kurs Dollar", price: "Rp16,240", change: "+0.08%", isPositive: true, type: "ETF" },
  { symbol: "ETH", name: "Ethereum", price: "$3,450", change: "+1.32%", isPositive: true, type: "CRYPTO" },
  { symbol: "SPY", name: "S&P 500", price: "$550.00", change: "+0.51%", isPositive: true, type: "ETF" },
];

export default function MarketTickerRibbon() {
  const [tickers, setTickers] = useState<TickerItem[]>(mockTickers);

  return (
    <div className="w-full overflow-hidden rounded-md bg-white dark:bg-[#161b22] border border-zinc-200 dark:border-[#30363d] p-1.5 shadow-[0_1px_0_rgba(27,31,36,0.04)]">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 px-1.5">
        {/* Live Market Chip */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-[#21262d] border border-zinc-200 dark:border-[#30363d] text-zinc-700 dark:text-[#8b949e] text-[11px] font-medium shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-[#3fb950] shrink-0" />
          <span className="tracking-wider uppercase text-[10px] font-mono">Market Live</span>
        </div>

        {/* Ticker Items */}
        {tickers.map((t) => (
          <div
            key={t.symbol}
            className="flex items-center gap-2 px-3 py-1 rounded-md bg-zinc-50 dark:bg-[#0d1117] hover:dark:bg-[#21262d] border border-zinc-200 dark:border-[#30363d] shrink-0 transition-colors cursor-default text-xs"
          >
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-zinc-900 dark:text-[#f0f6fc] font-mono">{t.symbol}</span>
              <span className="text-[10px] text-zinc-500 dark:text-[#8b949e] hidden sm:inline">{t.name}</span>
            </div>
            <span className="font-mono tabular-nums text-zinc-800 dark:text-[#c9d1d9] font-medium">{t.price}</span>
            <span
              className={`flex items-center gap-0.5 text-[11px] font-mono tabular-nums font-semibold ${
                t.isPositive ? "text-emerald-600 dark:text-[#3fb950]" : "text-rose-600 dark:text-[#f85149]"
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
