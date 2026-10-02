"use client";

import { ArrowRight, Sparkles } from"lucide-react";

interface PluangDiversificationBannerProps {
 onAction?: () => void;
}

export default function PluangDiversificationBanner({
 onAction,
}: PluangDiversificationBannerProps) {
 return (
 <div
 onClick={onAction}
 className="group relative overflow-hidden rounded-md bg-gradient-to-r from-blue-950/40 via-[#0e1424]/70 to-emerald-950/30 shadow-none border border-[#388bfd]/40 hover:border-[#388bfd]/40 p-4 sm:p-5 text-[#f0f6fc] cursor-pointer transition-all duration-200 active:scale-[0.99]"
 >
 <div className="flex items-center justify-between gap-4">
 <div className="space-y-1">
 <div className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider font-mono text-[#58a6ff]">
 <span>DIVERSIFIKASI GLOBAL &bull; WIDE-MOAT & GOLD</span>
 <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 text-[#58a6ff]"/>
 </div>
 <p className="text-[11px] sm:text-xs text-[#c9d1d9] font-normal max-w-md leading-relaxed">
 Lindungi kekayaan Anda dari depresiasi mata uang lokal dengan alokasi indeks global (VT/VOO), big-tech, dan emas murni via Sovereign Rebalancing.
 </p>
 </div>

 {/* Decorative Badge Coins */}
 <div className="hidden sm:flex items-center -space-x-2.5 shrink-0">
 <div className="w-8 h-8 rounded-full bg-[#388bfd] text-[#ffffff] flex items-center justify-center font-bold text-[9px] border-2 border-[#0d1117] shadow-none font-mono">
 VT
 </div>
 <div className="w-8 h-8 rounded-full bg-[#d29922] text-[#0d1117] flex items-center justify-center font-bold text-[9px] border-2 border-[#0d1117] shadow-none font-mono">
 GLD
 </div>
 <div className="w-8 h-8 rounded-full bg-[#f78166] text-[#ffffff] flex items-center justify-center font-bold text-[9px] border-2 border-[#0d1117] shadow-none font-mono">
 BTC
 </div>
 </div>
 </div>
 </div>
 );
}
