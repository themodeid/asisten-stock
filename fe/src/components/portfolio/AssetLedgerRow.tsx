"use client";

import { useState } from "react";
import { formatIDR } from "@/services/api";
import {
  Building2,
  ExternalLink,
  Sliders,
} from "lucide-react";
import SparklineMiniChart from "./SparklineMiniChart";

interface AssetLedgerRowProps {
  holding: any;
  fxRate: number;
  isPrivate?: boolean;
  selectedWalletId: number | string;
  onSelectWallet: (walletId: number) => void;
  onOpenCalibrate: (holding: any) => void;
}

export default function AssetLedgerRow({
  holding: h,
  fxRate,
  isPrivate = false,
  selectedWalletId,
  onSelectWallet,
  onOpenCalibrate,
}: AssetLedgerRowProps) {
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

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case "ETF":
        return "bg-blue-500/10 text-blue-400 border-blue-500/25";
      case "CRYPTO":
        return "bg-amber-500/10 text-amber-400 border-amber-500/25";
      case "GOLD":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/25";
      default:
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/25";
    }
  };

  return (
    <div className="border-b border-slate-800/80 last:border-0 hover:bg-slate-850/40 transition-all duration-150">
      {/* Main Terminal Ledger Row */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
      >
        {/* Left: Symbol & Details */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {hasRealImage ? (
            <img
              src={h.logo_url || h.image_url}
              alt={h.ticker}
              className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-700/80 bg-slate-900"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <div className={`w-9 h-9 rounded-lg border font-bold text-xs flex items-center justify-center shrink-0 ${getBadgeStyle(aType)}`}>
              {h.ticker?.slice(0, 3)}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold text-white tracking-tight">
                {h.ticker}
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold border ${getBadgeStyle(aType)}`}>
                {aType}
              </span>
            </div>
            <div className="text-xs text-slate-400 truncate max-w-[140px] sm:max-w-[220px]">
              {h.company_name || h.ticker}
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5 tabular-nums">
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
          <div className="text-xs sm:text-sm font-bold text-white font-mono tabular-nums">
            {isPrivate ? "Rp ••••••••" : formatIDR(marketValIdr)}
          </div>
          <div className="text-[11px] text-slate-400 font-mono tabular-nums">
            {isPrivate ? "••••" : currentPriceDisplay}
          </div>
          <div
            className={`text-xs font-bold font-mono tabular-nums inline-flex items-center gap-0.5 mt-0.5 ${
              isUp ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {isUp ? "+" : ""}
            {h.floating_pnl_percent !== undefined ? `${h.floating_pnl_percent}%` : "0%"}
          </div>
        </div>
      </div>

      {/* Expandable Breakdown & Actions Panel */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 bg-slate-950/70 border-t border-slate-800/80 space-y-3 animate-in fade-in duration-150">
          {/* Multi-Vault Breakdown */}
          {h.wallet_breakdown && h.wallet_breakdown.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                Distribusi Dompet & Akun Platform ({h.wallet_breakdown.length} Vault):
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
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-700/80 text-xs transition flex items-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <span className="font-bold text-slate-200 capitalize">{wb.wallet_name}:</span>
                      <span className="font-mono text-slate-300 tabular-nums">
                        {isPrivate
                          ? "••••"
                          : isStock
                          ? `${wb.total_lots} Lot`
                          : `${Number(wb.quantity).toLocaleString(undefined, { maximumFractionDigits: 6 })} unit`}
                      </span>
                      <span className={`text-[10px] font-bold font-mono tabular-nums ${isWbUp ? "text-emerald-400" : "text-rose-400"}`}>
                        ({isWbUp ? "+" : ""}{wb.floating_pnl_percent}%)
                      </span>
                      <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
            <div className="text-[11px] text-slate-400">
              Basis Modal Investasi: <strong className="text-slate-100 font-mono tabular-nums">{isPrivate ? "••••" : formatIDR(h.total_invested_idr || h.total_invested || 0)}</strong>
            </div>

            {selectedWalletId !== "all" && selectedWalletId !== 0 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCalibrate(h);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-200 font-semibold text-xs transition flex items-center gap-1.5 border border-slate-700/80 active:scale-95"
              >
                <Sliders className="w-3 h-3 text-blue-400" />
                Kalibrasi / Edit Posisi
              </button>
            ) : (
              <span className="text-[10px] text-slate-500 italic">
                Pilih salah satu dompet di atas untuk mengedit catatan aset
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Backward compatibility export
export { AssetLedgerRow as PluangAssetRow };
