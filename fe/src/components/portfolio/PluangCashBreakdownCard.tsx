"use client";

import { useState } from"react";
import { formatIDR } from"@/services/api";
import { ChevronUp, ChevronDown } from"lucide-react";
import { PluangCashBreakdown } from"@/types";

interface PluangCashBreakdownCardProps {
 data?: PluangCashBreakdown;
 isPrivate?: boolean;
}

export default function PluangCashBreakdownCard({
 data,
 isPrivate = false,
}: PluangCashBreakdownCardProps) {
 const [isOpen, setIsOpen] = useState(true);

 const maskValue = (val: number) => {
 if (isPrivate) return"Rp ••••••••";
 return formatIDR(val);
 };

 const total = data?.total_asset_and_cash || 0;
 const netAsset = data?.net_asset_value || 0;
 const idrCrypto = data?.idr_crypto_cash || 0;
 const idrCash = data?.idr_cash || 0;
 const rdn = data?.rdn_cash || 0;
 const usdTotal = (data?.usd_cash || 0) + (data?.usd_margin || 0);

 return (
 <div className="rounded-md bg-[#0d1117] border border-[#30363d] hover:border-[#30363d] shadow-none p-4 sm:p-5 space-y-3 transition-all duration-200">
 {/* Header with toggle */}
 <button
 type="button"
 onClick={() => setIsOpen(!isOpen)}
 className="w-full flex items-center justify-between text-left group"
 >
 <div className="flex items-center gap-2">
 <span className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-[#c9d1d9] group-hover:text-[#58a6ff] transition">
 Nilai Aset &amp; Likuiditas Kas
 </span>
 {isOpen ? (
 <ChevronUp className="w-4 h-4 text-[#8b949e] group-hover:text-[#c9d1d9] transition"/>
 ) : (
 <ChevronDown className="w-4 h-4 text-[#8b949e] group-hover:text-[#c9d1d9] transition"/>
 )}
 </div>
 <span className="text-sm sm:text-base font-bold text-[#f0f6fc] font-mono tabular-nums">
 {maskValue(total)}
 </span>
 </button>

 {/* Inner breakdown container (Terminal style) */}
 {isOpen && (
 <div className="rounded-md bg-[#0d1117]/40 border border-[#30363d] shadow-inner p-3.5 space-y-2.5 text-xs font-mono">
 <div className="flex items-center justify-between">
 <span className="text-[#8b949e] font-sans">Nilai Aset Bersih (NAV)</span>
 <span className="font-semibold text-[#f0f6fc] tabular-nums">
 {maskValue(netAsset)}
 </span>
 </div>

 <div className="flex items-center justify-between">
 <span className="text-[#8b949e] font-sans">Saldo Kas Kripto (IDR)</span>
 <span className="font-semibold text-[#f0f6fc] tabular-nums">
 {maskValue(idrCrypto)}
 </span>
 </div>

 <div className="flex items-center justify-between">
 <span className="text-[#8b949e] font-sans">Saldo IDR Tunai</span>
 <span className="font-semibold text-[#f0f6fc] tabular-nums">
 {maskValue(idrCash)}
 </span>
 </div>

 <div className="flex items-center justify-between">
 <span className="text-[#8b949e] font-sans">Kas RDN Sekuritas</span>
 <span className="font-semibold text-[#f0f6fc] tabular-nums">
 {maskValue(rdn)}
 </span>
 </div>

 <div className="flex items-center justify-between">
 <span className="text-[#8b949e] font-sans">Kas Valas USD &amp; Margin</span>
 <span className="font-semibold text-[#f0f6fc] tabular-nums">
 {maskValue(usdTotal)}
 </span>
 </div>
 </div>
 )}
 </div>
 );
}
