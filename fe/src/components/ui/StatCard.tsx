import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  accentColor?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}: StatCardProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700/80 transition shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400">{title}</span>
        <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-200">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3">
        <h3 className="text-xl font-bold text-zinc-100 tracking-tight">
          {value}
        </h3>
        <div className="flex items-center gap-2 mt-1.5">
          {trend && (
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                trend.isPositive
                  ? "bg-emerald-950/40 text-emerald-300 border border-emerald-800/60"
                  : "bg-red-950/40 text-red-300 border border-red-800/60"
              }`}
            >
              {trend.value}
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-zinc-400">{subtitle}</span>
          )}
        </div>
      </div>
    </div>
  );
}
