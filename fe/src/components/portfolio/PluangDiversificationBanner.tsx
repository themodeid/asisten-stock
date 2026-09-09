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
      className="group relative overflow-hidden rounded-2xl bg-[#D2F831] hover:bg-[#c4ec26] p-4 sm:p-5 text-zinc-950 shadow-lg cursor-pointer transition-all duration-200 active:scale-[0.99]"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black uppercase tracking-tight">
            <span>Diversifikasi dengan Saham Global & Emas</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
          <p className="text-[11px] sm:text-xs text-zinc-900 font-medium max-w-md leading-relaxed">
            Optimalkan portofolio Anda dari risiko inflasi menggunakan AI Rebalancing deterministik.
          </p>
        </div>

        {/* Decorative Badge Coins */}
        <div className="hidden sm:flex items-center -space-x-2.5 shrink-0">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-[9px] shadow border-2 border-[#D2F831]">
            VT
          </div>
          <div className="w-8 h-8 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center font-black text-[9px] shadow border-2 border-[#D2F831]">
            GLD
          </div>
          <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-black text-[9px] shadow border-2 border-[#D2F831]">
            BTC
          </div>
        </div>
      </div>
    </div>
  );
}
