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
  const accentGradients = {
    emerald: "from-emerald-500/15 to-emerald-700/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 bg-emerald-50 dark:bg-emerald-950/30",
    blue: "from-blue-500/15 to-blue-700/5 text-blue-600 dark:text-blue-400 border-blue-500/25 bg-blue-50 dark:bg-blue-950/30",
    amber: "from-amber-500/15 to-amber-700/5 text-amber-600 dark:text-amber-400 border-amber-500/25 bg-amber-50 dark:bg-amber-950/30",
    purple: "from-purple-500/15 to-purple-700/5 text-purple-600 dark:text-purple-400 border-purple-500/25 bg-purple-50 dark:bg-purple-950/30",
    indigo: "from-indigo-500/15 to-indigo-700/5 text-indigo-600 dark:text-indigo-400 border-indigo-500/25 bg-indigo-50 dark:bg-indigo-950/30",
  };

  const iconClass = accentGradients[accentColor] || accentGradients.emerald;

  return (
    <div className="rounded-2xl bg-white/90 dark:bg-zinc-900/75 border border-zinc-200/80 dark:border-white/[0.07] hover:border-zinc-300 dark:hover:border-white/[0.16] p-5 transition-all duration-200 shadow-sm dark:shadow-lg dark:shadow-black/40 glass-card glass-card-hover flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {title}
        </span>
        <div
          className={`w-9 h-9 rounded-xl bg-gradient-to-br ${iconClass} border flex items-center justify-center shadow-sm`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight break-words tabular-nums">
          {value}
        </h3>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-lg font-mono tabular-nums ${
                trend.isPositive
                  ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60"
                  : "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800/60"
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
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
