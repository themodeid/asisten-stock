"use client";

import { useState } from "react";
import { formatIDR } from "@/services/api";
import { ChevronUp, ChevronDown } from "lucide-react";
import { PluangCashBreakdown } from "@/types";

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
    if (isPrivate) return "Rp ••••••••";
    return formatIDR(val);
  };

  const total = data?.total_asset_and_cash || 0;
  const netAsset = data?.net_asset_value || 0;
  const idrCrypto = data?.idr_crypto_cash || 0;
  const idrCash = data?.idr_cash || 0;
  const rdn = data?.rdn_cash || 0;
  const usdTotal = (data?.usd_cash || 0) + (data?.usd_margin || 0);

  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 sm:p-5 shadow-lg space-y-3 transition-all duration-200">
      {/* Header with toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-slate-300 group-hover:text-blue-400 transition">
            Nilai Aset &amp; Likuiditas Kas
          </span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-200 transition" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-200 transition" />
          )}
        </div>
        <span className="text-sm sm:text-base font-bold text-slate-100 font-mono tabular-nums">
          {maskValue(total)}
        </span>
      </button>

      {/* Inner breakdown container (Terminal style) */}
      {isOpen && (
        <div className="rounded-lg bg-slate-950/80 border border-slate-800 p-3.5 space-y-2.5 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-sans">Nilai Aset Bersih (NAV)</span>
            <span className="font-semibold text-slate-100 tabular-nums">
              {maskValue(netAsset)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-sans">Saldo Kas Kripto (IDR)</span>
            <span className="font-semibold text-slate-100 tabular-nums">
              {maskValue(idrCrypto)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-sans">Saldo IDR Tunai</span>
            <span className="font-semibold text-slate-100 tabular-nums">
              {maskValue(idrCash)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-sans">Kas RDN Sekuritas</span>
            <span className="font-semibold text-slate-100 tabular-nums">
              {maskValue(rdn)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-sans">Kas Valas USD &amp; Margin</span>
            <span className="font-semibold text-slate-100 tabular-nums">
              {maskValue(usdTotal)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
