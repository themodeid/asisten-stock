import React from "react";
import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  accentColor?: "emerald" | "blue" | "amber" | "purple" | "indigo";
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = "emerald",
}: StatCardProps) {
  const iconAccents = {
    emerald: "text-emerald-600 dark:text-[#3fb950] bg-emerald-500/10 dark:bg-[#238636]/15 border-emerald-500/20 dark:border-[#238636]/40",
    blue: "text-blue-600 dark:text-[#58a6ff] bg-blue-500/10 dark:bg-[#388bfd]/15 border-blue-500/20 dark:border-[#388bfd]/40",
    amber: "text-amber-600 dark:text-[#d29922] bg-amber-500/10 dark:bg-[#d29922]/15 border-amber-500/20 dark:border-[#d29922]/40",
    purple: "text-purple-600 dark:text-[#a371f7] bg-purple-500/10 dark:bg-[#8957e5]/15 border-purple-500/20 dark:border-[#8957e5]/40",
    indigo: "text-blue-600 dark:text-[#58a6ff] bg-blue-500/10 dark:bg-[#388bfd]/15 border-blue-500/20 dark:border-[#388bfd]/40",
  };

  const iconClass = iconAccents[accentColor] || iconAccents.emerald;

  return (
    <div className="rounded-md bg-white dark:bg-[#161b22] border border-zinc-200 dark:border-[#30363d] hover:dark:border-[#8b949e] p-4 sm:p-5 transition-colors duration-150 flex flex-col justify-between shadow-[0_1px_0_rgba(27,31,36,0.04)]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-[#8b949e]">
          {title}
        </span>
        <div
          className={`w-8 h-8 rounded-md ${iconClass} border flex items-center justify-center shrink-0`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3">
        <h3 className="text-xl sm:text-2xl font-bold font-mono text-zinc-900 dark:text-[#f0f6fc] tracking-tight break-words tabular-nums">
          {value}
        </h3>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 text-[11px] font-medium px-2 py-0.5 rounded-full font-mono tabular-nums border ${
                trend.isPositive
                  ? "bg-emerald-500/10 dark:bg-[#238636]/15 text-emerald-600 dark:text-[#3fb950] border-emerald-500/20 dark:border-[#238636]/40"
                  : "bg-rose-500/10 dark:bg-[#da3633]/15 text-rose-600 dark:text-[#f85149] border-rose-500/20 dark:border-[#da3633]/40"
              }`}
            >
              {trend.isPositive ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {trend.value}
            </span>
          )}
          {subtitle && (
            <span className="text-[11px] text-zinc-500 dark:text-[#8b949e] font-medium">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
