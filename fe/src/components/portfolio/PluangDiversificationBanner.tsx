"use client";

import { ArrowRight, Sparkles } from "lucide-react";

interface PluangDiversificationBannerProps {
  onAction?: () => void;
}

export default function PluangDiversificationBanner({
  onAction,
}: PluangDiversificationBannerProps) {
  return (
    <div
      onClick={onAction}
      className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-blue-500/30 hover:border-blue-500/60 p-4 sm:p-5 text-slate-100 shadow-xl cursor-pointer transition-all duration-200 active:scale-[0.99]"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider font-mono text-blue-400">
            <span>DIVERSIFIKASI GLOBAL &bull; WIDE-MOAT & GOLD</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 text-blue-400" />
          </div>
          <p className="text-[11px] sm:text-xs text-slate-300 font-normal max-w-md leading-relaxed">
            Lindungi kekayaan Anda dari depresiasi mata uang lokal dengan alokasi indeks global (VT/VOO), big-tech, dan emas murni via Sovereign Rebalancing.
          </p>
        </div>

        {/* Decorative Badge Coins */}
        <div className="hidden sm:flex items-center -space-x-2.5 shrink-0">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[9px] shadow-md border-2 border-slate-900 font-mono">
            VT
          </div>
          <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-[9px] shadow-md border-2 border-slate-900 font-mono">
            GLD
          </div>
          <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-[9px] shadow-md border-2 border-slate-900 font-mono">
            BTC
          </div>
        </div>
      </div>
    </div>
  );
}
