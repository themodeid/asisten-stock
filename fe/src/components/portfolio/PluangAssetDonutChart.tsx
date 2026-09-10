"use client";

import { useState } from "react";
import { formatIDR } from "@/services/api";
import { ChevronUp, ChevronRight, HelpCircle } from "lucide-react";
import { PluangClassAllocation, PluangAllocationSummary } from "@/types";

interface PluangAssetDonutChartProps {
  data?: PluangAllocationSummary;
  isPrivate?: boolean;
  onSelectCategory?: (category: string) => void;
}

export default function PluangAssetDonutChart({
  data,
  isPrivate = false,
  onSelectCategory,
}: PluangAssetDonutChartProps) {
  const [openCard, setOpenCard] = useState<string | null>("CASH");
  const [showTooltip, setShowTooltip] = useState(false);

  const classes: PluangClassAllocation[] = data?.classes || [];

  // SVG Donut calculation
  const size = 180;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedOffset = 0;
  const slices = classes.map((item) => {
    const rawPct = item.percentage ?? item.percent ?? 0;
    const pct = rawPct / 100;
    const strokeDash = pct * circumference;
    const offset = accumulatedOffset;
    accumulatedOffset += strokeDash;
    return {
      ...item,
      strokeDash,
      offset,
    };
  });

  const toggleCard = (key: string) => {
    setOpenCard(openCard === key ? null : key);
  };

  const maskValue = (val: number) => {
    if (isPrivate) return "Rp ••••••••";
    return formatIDR(val);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h3 className="text-base sm:text-lg font-bold text-zinc-100 tracking-tight">
            Alokasi Kelas Aset
          </h3>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTooltip(!showTooltip)}
              className="text-zinc-400 hover:text-zinc-200 transition p-0.5"
              title="Informasi Alokasi Portofolio"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            {showTooltip && (
              <div className="absolute left-0 top-6 z-20 w-64 p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-300 shadow-2xl">
                Alokasi aset dibagi ke dalam kelas Kripto, Saham Global/AS (ETF), Emas, dan Saldo Kas Tunai.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Donut Chart & Legend Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row items-center justify-around gap-6">
        {/* SVG Donut */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg
            width={size}
            height={size}
            className="rotate-[-90deg] transition-all duration-700"
          >
            {/* Background track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#1e293b"
              strokeWidth={strokeWidth}
            />
            {/* Segments */}
            {slices.map((slice) => {
              const val = slice.percentage ?? slice.percent ?? 0;
              if (val <= 0) return null;
              return (
                <circle
                  key={slice.key}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${slice.strokeDash} ${circumference}`}
                  strokeDashoffset={-slice.offset}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              );
            })}
          </svg>

          {/* Center Text Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
            <span className="text-xl sm:text-2xl font-black font-mono text-slate-100 tracking-tight">
              {isPrivate ? "••••" : (data?.center_label || "0")}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">NET ASSET</span>
          </div>
        </div>

        {/* Legend on Right Side */}
        <div className="w-full md:w-auto flex-1 max-w-sm space-y-2.5">
          {classes.map((c) => (
            <div
              key={c.key}
              className="flex items-center justify-between text-xs sm:text-sm py-1.5 border-b border-slate-800/80 last:border-0"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: c.color }}
                />
                <span className="font-semibold text-slate-200">{c.label}</span>
              </div>
              <span className="font-bold text-slate-300 font-mono tabular-nums">
                {c.formatted_percentage || `${c.percentage ?? c.percent ?? 0}%`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Accordion Cards below Donut for each Asset Class */}
      <div className="space-y-3">
        {classes.map((c) => {
          const isOpen = openCard === c.key;
          return (
            <div
              key={c.key}
              className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-md transition-all duration-200"
            >
              {/* Card Header */}
              <button
                type="button"
                onClick={() => toggleCard(c.key)}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-800/40 transition active:scale-[0.99]"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-100">{c.label}</span>
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  <span
                    className="text-xs font-bold font-mono"
                    style={{ color: c.color }}
                  >
                    {c.formatted_percentage || `${c.percentage ?? c.percent ?? 0}%`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-zinc-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  )}
                </div>
              </button>

              {/* Collapsible Content */}
              {isOpen && (
                <div className="px-4 pb-4 pt-1 space-y-2.5 border-t border-slate-800">
                  {/* Total Nilai / Aset Row */}
                  <div
                    onClick={() => onSelectCategory && onSelectCategory(c.key)}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 cursor-pointer transition group"
                  >
                    <span className="text-xs font-mono font-medium text-slate-400">
                      {c.key === "CASH" ? "TOTAL SETTLED CASH" : "HOLDINGS VALUATION"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-bold text-slate-100 font-mono tabular-nums">
                        {maskValue(c.assets_value)}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition" />
                    </div>
                  </div>

                  {/* Pocket Row (if non-cash) */}
                  {c.key !== "CASH" && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/40 border border-slate-800/60">
                      <span className="text-xs font-mono font-medium text-slate-400">VAULT / POCKET</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-slate-400 font-mono tabular-nums">
                          {maskValue(c.pocket_value)}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                      </div>
                    </div>
                  )}

                  {/* Detailed Cash Sub-items */}
                  {c.key === "CASH" && c.sub_items && (
                    <div className="space-y-1.5 pt-1 pl-1 font-mono">
                      {c.sub_items.map((sub: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-slate-800/30"
                        >
                          <span className="text-slate-400">{sub.label}</span>
                          <span className="text-slate-200 font-mono font-medium tabular-nums">
                            {maskValue(sub.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
