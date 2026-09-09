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
    <div className="rounded-2xl bg-[#090b0e] border border-white/[0.08] p-4 sm:p-5 shadow-lg space-y-3 transition-all duration-200">
      {/* Header with toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-sm sm:text-base font-semibold text-zinc-200 group-hover:text-white transition">
            Nilai Aset & Uang Tunai
          </span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200 transition" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200 transition" />
          )}
        </div>
        <span className="text-sm sm:text-base font-bold text-zinc-100 font-mono">
          {maskValue(total)}
        </span>
      </button>

      {/* Inner breakdown container (Pluang dark grey box) */}
      {isOpen && (
        <div className="rounded-xl bg-[#14171f] border border-white/[0.05] p-3.5 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Nilai Aset Bersih</span>
            <span className="font-semibold text-zinc-100 font-mono">
              {maskValue(netAsset)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Saldo IDR Crypto</span>
            <span className="font-semibold text-zinc-100 font-mono">
              {maskValue(idrCrypto)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Saldo IDR</span>
            <span className="font-semibold text-zinc-100 font-mono">
              {maskValue(idrCash)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Kas Investasi / Sekuritas</span>
            <span className="font-semibold text-zinc-100 font-mono">
              {maskValue(rdn)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Saldo USD & USD Margin</span>
            <span className="font-semibold text-zinc-100 font-mono">
              {maskValue(usdTotal)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
