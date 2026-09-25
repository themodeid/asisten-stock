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
      className="group relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950/40 via-[#0e1424]/70 to-emerald-950/30 backdrop-blur-2xl shadow-[0_15px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.12)] border border-blue-500/30 hover:border-blue-500/60 p-4 sm:p-5 text-slate-100 cursor-pointer transition-all duration-200 active:scale-[0.99]"
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
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[9px] border-2 border-[#0e1424] shadow-[0_0_15px_rgba(59,130,246,0.3)] font-mono">
            VT
          </div>
          <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-[9px] border-2 border-[#0e1424] shadow-[0_0_15px_rgba(59,130,246,0.3)] font-mono">
            GLD
          </div>
          <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-[9px] border-2 border-[#0e1424] shadow-[0_0_15px_rgba(59,130,246,0.3)] font-mono">
            BTC
          </div>
        </div>
      </div>
    </div>
  );
}
