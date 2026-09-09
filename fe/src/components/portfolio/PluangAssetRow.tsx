"use client";

import { useState } from "react";
import { formatIDR, formatPercent } from "@/services/api";
import {
  TrendingUp,
  TrendingDown,
  Building2,
  ExternalLink,
  ChevronRight,
  Sliders,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import SparklineMiniChart from "./SparklineMiniChart";

interface PluangAssetRowProps {
  holding: any;
  fxRate: number;
  isPrivate?: boolean;
  selectedWalletId: number | string;
  onSelectWallet: (walletId: number) => void;
  onOpenCalibrate: (holding: any) => void;
}

export default function PluangAssetRow({
  holding: h,
  fxRate,
  isPrivate = false,
  selectedWalletId,
  onSelectWallet,
  onOpenCalibrate,
}: PluangAssetRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const aType = h.asset_type || "STOCK";
  const isStock = aType === "STOCK";
  const isUp = (h.floating_pnl || 0) >= 0;

  const marketValIdr =
    h.market_value_idr ??
    (h.currency === "USD" ? (h.market_value || h.total_invested) * fxRate : h.market_value || h.total_invested);

  const currentPriceDisplay =
    h.currency === "USD"
      ? `$${Number(h.current_price || h.avg_buy_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : formatIDR(h.current_price || h.avg_buy_price || 0);

  const unitDisplay = isStock
    ? `${h.total_lots || (h.total_shares ? h.total_shares / 100 : 0)} Lot`
    : `${Number(h.quantity || 0).toLocaleString(undefined, { maximumFractionDigits: 8 })} ${aType === "GOLD" ? "gram" : "unit"}`;

  const hasRealImage = Boolean(h.logo_url || h.image_url);

  return (
    <div className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-all duration-150">
      {/* Main Asset Row (Pluang Mobile/Web Style) */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
      >
        {/* Left: Symbol & Details (Logo rendered only if real image exists) */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {hasRealImage && (
            <img
              src={h.logo_url || h.image_url}
              alt={h.ticker}
              className="w-9 h-9 rounded-full object-cover shrink-0 border border-white/10"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-black text-white tracking-tight">
                {h.ticker}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-zinc-850 text-zinc-400 border border-white/[0.06]">
                {aType}
              </span>
            </div>
            <div className="text-xs text-zinc-400 truncate max-w-[140px] sm:max-w-[200px]">
              {h.company_name || h.ticker}
            </div>
            <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
              {isPrivate ? "••••" : unitDisplay}
            </div>
          </div>
        </div>

        {/* Center: Mini Sparkline Visual Trend */}
        <div className="hidden sm:block">
          <SparklineMiniChart ticker={h.ticker} isPositive={isUp} width={80} height={30} />
        </div>

        {/* Right: Valuation & Returns */}
        <div className="text-right shrink-0">
          <div className="text-xs sm:text-sm font-bold text-zinc-100 font-mono">
            {isPrivate ? "Rp ••••••••" : formatIDR(marketValIdr)}
          </div>
          <div className="text-[11px] text-zinc-400 font-mono">
            {isPrivate ? "••••" : currentPriceDisplay}
          </div>
          <div
            className={`text-xs font-bold font-mono inline-flex items-center gap-0.5 mt-0.5 ${
              isUp ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {isUp ? "+" : ""}
            {h.floating_pnl_percent !== undefined ? `${h.floating_pnl_percent}%` : "0%"}
          </div>
        </div>
      </div>

      {/* Expandable Breakdown & Actions Panel */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 bg-[#10131a]/60 border-t border-white/[0.03] space-y-3 animate-in fade-in duration-150">
          {/* Multi-Wallet Exchange Breakdown */}
          {h.wallet_breakdown && h.wallet_breakdown.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                <Building2 className="w-3 h-3 text-emerald-400" />
                Rincian Akun & Exchange ({h.wallet_breakdown.length} Wallet):
              </span>
              <div className="flex flex-wrap gap-2">
                {h.wallet_breakdown.map((wb: any) => {
                  const isWbUp = (wb.floating_pnl || 0) >= 0;
                  return (
                    <button
                      key={wb.wallet_id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectWallet(wb.wallet_id);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-white/[0.08] text-xs transition flex items-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <span className="font-bold text-zinc-200 capitalize">{wb.wallet_name}:</span>
                      <span className="font-mono text-zinc-300">
                        {isPrivate
                          ? "••••"
                          : isStock
                          ? `${wb.total_lots} Lot`
                          : `${Number(wb.quantity).toLocaleString(undefined, { maximumFractionDigits: 6 })} unit`}
                      </span>
                      <span className={`text-[10px] font-bold ${isWbUp ? "text-emerald-400" : "text-red-400"}`}>
                        ({isWbUp ? "+" : ""}{wb.floating_pnl_percent}%)
                      </span>
                      <ExternalLink className="w-2.5 h-2.5 text-zinc-500" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.04] text-xs">
            <div className="text-[11px] text-zinc-400">
              Modal Investasi: <strong className="text-zinc-200">{isPrivate ? "••••" : formatIDR(h.total_invested_idr || h.total_invested || 0)}</strong>
            </div>

            {selectedWalletId !== "all" && selectedWalletId !== 0 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCalibrate(h);
                }}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition flex items-center gap-1 border border-white/[0.06] active:scale-95"
              >
                <Sliders className="w-3 h-3 text-emerald-400" />
                Kalibrasi / Edit
              </button>
            ) : (
              <span className="text-[10px] text-zinc-500 italic">
                Pilih dompet spesifik di atas untuk mengedit aset
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
