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
    bg: "bg-emerald-500",
    dot: "bg-emerald-400",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
  },
  ETF: {
    bg: "bg-blue-500",
    dot: "bg-blue-400",
    text: "text-blue-400",
    border: "border-blue-500/30",
  },
  STOCK: {
    bg: "bg-purple-500",
    dot: "bg-purple-400",
    text: "text-purple-400",
    border: "border-purple-500/30",
  },
  GOLD: {
    bg: "bg-amber-500",
    dot: "bg-amber-400",
    text: "text-amber-400",
    border: "border-amber-500/30",
  },
  CASH: {
    bg: "bg-slate-400",
    dot: "bg-slate-300",
    text: "text-slate-300",
    border: "border-slate-500/30",
  },
};

export default function AssetAllocationBar({
  allocations = [],
  totalValue = 0,
}: AssetAllocationBarProps) {
  const safeTotal = totalValue > 0 ? totalValue : 1;

  return (
    <div className="rounded-2xl bg-zinc-900/70 border border-white/[0.06] p-5 shadow-lg backdrop-blur-xl space-y-4 glass-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100 tracking-tight">
              Alokasi & Diversifikasi Aset
            </h3>
            <p className="text-[11px] text-zinc-400">
              Sebaran kelas aset dalam portofolio Anda
            </p>
          </div>
        </div>
        <Link
          href="/portfolio"
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
        >
          Lihat Aset
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Segmented Multi-Color Progress Bar (Pluang Style) */}
      <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden flex p-0.5 gap-0.5">
        {allocations.map((alloc) => {
          const cfg = colorMap[alloc.asset_type] || colorMap.STOCK;
          const widthPct = Math.max(2, alloc.percentage);
          return (
            <div
              key={alloc.asset_type}
              style={{ width: `${widthPct}%` }}
              className={`${cfg.bg} h-full rounded-sm transition-all duration-500 hover:opacity-90`}
              title={`${alloc.label}: ${alloc.percentage.toFixed(1)}% (${formatIDR(alloc.total_value)})`}
            />
          );
        })}
      </div>

      {/* Allocation Breakdown Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
        {allocations.map((alloc) => {
          const cfg = colorMap[alloc.asset_type] || colorMap.STOCK;
          return (
            <div
              key={alloc.asset_type}
              className="p-2.5 rounded-xl bg-zinc-850/60 border border-white/[0.04] flex flex-col justify-between hover:bg-zinc-850/90 transition"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <span className="text-xs font-semibold text-zinc-200">
                    {alloc.label}
                  </span>
                </div>
                <span className={`text-xs font-bold font-mono ${cfg.text}`}>
                  {alloc.percentage.toFixed(1)}%
                </span>
              </div>
              <p className="text-xs font-mono font-medium text-zinc-300">
                {formatIDR(alloc.total_value)}
              </p>
              <span className="text-[10px] text-zinc-500 mt-0.5">
                {alloc.count} instrumen
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
