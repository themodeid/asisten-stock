"use client";

import Link from "next/link";
import { formatIDR } from "@/services/api";
import { PieChart, ArrowUpRight } from "lucide-react";

interface AllocationItem {
  asset_type: string;
  label: string;
  total_value: number;
  percentage: number;
  count: number;
}

interface AssetAllocationBarProps {
  allocations?: AllocationItem[];
  totalValue?: number;
}

const colorMap: Record<string, { bg: string; dot: string; text: string; border: string }> = {
  CRYPTO: {
    bg: "bg-[#3fb950]",
    dot: "bg-[#3fb950]",
    text: "text-[#3fb950]",
    border: "border-[#238636]/40",
  },
  ETF: {
    bg: "bg-[#58a6ff]",
    dot: "bg-[#58a6ff]",
    text: "text-[#58a6ff]",
    border: "border-[#388bfd]/40",
  },
  GOLD: {
    bg: "bg-[#d29922]",
    dot: "bg-[#d29922]",
    text: "text-[#d29922]",
    border: "border-[#d29922]/40",
  },
  STOCK: {
    bg: "bg-[#a371f7]",
    dot: "bg-[#a371f7]",
    text: "text-[#a371f7]",
    border: "border-[#8957e5]/40",
  },
  CASH: {
    bg: "bg-[#8b949e]",
    dot: "bg-[#8b949e]",
    text: "text-[#8b949e]",
    border: "border-[#30363d]",
  },
};

export default function AssetAllocationBar({
  allocations = [],
  totalValue = 0,
}: AssetAllocationBarProps) {
  const safeTotal = totalValue > 0 ? totalValue : 1;

  return (
    <div className="rounded-md bg-white dark:bg-[#161b22] border border-zinc-200 dark:border-[#30363d] p-4 sm:p-5 space-y-4 shadow-[0_1px_0_rgba(27,31,36,0.04)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-zinc-100 dark:bg-[#21262d] border border-zinc-200 dark:border-[#30363d] flex items-center justify-center text-zinc-700 dark:text-[#c9d1d9]">
            <PieChart className="w-4 h-4 text-[#58a6ff]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-[#f0f6fc] tracking-tight">
              Alokasi & Diversifikasi Aset
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-[#8b949e]">
              Sebaran kelas aset dalam portofolio
            </p>
          </div>
        </div>
        <Link
          href="/portfolio"
          className="text-xs font-medium text-[#58a6ff] hover:underline flex items-center gap-1 transition-colors"
        >
          Lihat Aset
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* GitHub Repository Language Breakdown Bar Style */}
      <div className="w-full h-2.5 rounded-full bg-zinc-100 dark:bg-[#0d1117] border border-zinc-200 dark:border-[#30363d] overflow-hidden flex p-0.5 gap-0.5">
        {allocations.map((alloc) => {
          const cfg = colorMap[alloc.asset_type] || colorMap.STOCK;
          const widthPct = Math.max(2, alloc.percentage);
          return (
            <div
              key={alloc.asset_type}
              style={{ width: `${widthPct}%` }}
              className={`${cfg.bg} h-full rounded-sm transition-all duration-300 hover:opacity-90`}
              title={`${alloc.label}: ${alloc.percentage.toFixed(1)}% (${formatIDR(alloc.total_value)})`}
            />
          );
        })}
      </div>

      {/* GitHub Breakdown Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-1">
        {allocations.map((alloc) => {
          const cfg = colorMap[alloc.asset_type] || colorMap.STOCK;
          return (
            <div
              key={alloc.asset_type}
              className="p-3 rounded-md bg-zinc-50 dark:bg-[#0d1117] border border-zinc-200 dark:border-[#30363d] hover:dark:border-[#8b949e] flex flex-col justify-between transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <span className="text-xs font-bold text-zinc-800 dark:text-[#f0f6fc]">
                    {alloc.label}
                  </span>
                </div>
                <span className={`text-xs font-bold font-mono ${cfg.text}`}>
                  {alloc.percentage.toFixed(1)}%
                </span>
              </div>
              <p className="text-xs font-mono font-bold text-zinc-900 dark:text-[#f0f6fc]">
                {formatIDR(alloc.total_value)}
              </p>
              <span className="text-[10px] text-zinc-500 dark:text-[#8b949e] mt-0.5 font-medium">
                {alloc.count} instrumen
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
