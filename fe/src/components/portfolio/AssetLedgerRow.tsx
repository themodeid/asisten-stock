"use client";

import { useState } from"react";
import { formatIDR } from"@/services/api";
import {
 Building2,
 ExternalLink,
 Sliders,
} from"lucide-react";
import SparklineMiniChart from"./SparklineMiniChart";

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

 const aType = h.asset_type ||"STOCK";
 const isStock = aType ==="STOCK";
 const isUp = (h.floating_pnl || 0) >= 0;

 const marketValIdr =
 h.market_value_idr ??
 (h.currency ==="USD"? (h.market_value || h.total_invested) * fxRate : h.market_value || h.total_invested);

 const currentPriceDisplay =
 h.currency ==="USD"
 ? `$${Number(h.current_price || h.avg_buy_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
 : formatIDR(h.current_price || h.avg_buy_price || 0);

 const unitDisplay = isStock
 ? `${h.total_lots || (h.total_shares ? h.total_shares / 100 : 0)} Lot`
 : `${Number(h.quantity || 0).toLocaleString(undefined, { maximumFractionDigits: 8 })} ${aType ==="GOLD"?"gram":"unit"}`;

 const hasRealImage = Boolean(h.logo_url || h.image_url);

 const getBadgeStyle = (type: string) => {
 switch (type) {
 case"ETF":
 return"bg-[#388bfd]/15 text-[#58a6ff] border-[#388bfd]/40";
 case"CRYPTO":
 return"bg-[#d29922]/15 text-[#d29922] border-[#d29922]/40";
 case"GOLD":
 return"bg-[#d29922]/15 text-[#d29922] border-[#d29922]/40";
 default:
 return"bg-[#388bfd]/15 text-[#58a6ff] border-[#388bfd]/40";
 }
 };

 return (
 <div className="border-b border-[#30363d] last:border-0 hover:bg-[#161b22] transition-all duration-150">
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
 className="w-9 h-9 rounded-md object-cover shrink-0 border border-[#30363d]/80 bg-[#0d1117]"
 onError={(e) => {
 (e.target as HTMLElement).style.display ="none";
 }}
 />
 ) : (
 <div className={`w-9 h-9 rounded-md border font-bold text-xs flex items-center justify-center shrink-0 ${getBadgeStyle(aType)}`}>
 {h.ticker?.slice(0, 3)}
 </div>
 )}

 <div className="min-w-0">
 <div className="flex items-center gap-2">
 <span className="text-sm sm:text-base font-bold text-[#f0f6fc] tracking-tight">
 {h.ticker}
 </span>
 <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold border ${getBadgeStyle(aType)}`}>
 {aType}
 </span>
 </div>
 <div className="text-xs text-[#8b949e] truncate max-w-[140px] sm:max-w-[220px]">
 {h.company_name || h.ticker}
 </div>
 <div className="text-[11px] text-[#8b949e] font-mono mt-0.5 tabular-nums">
 {isPrivate ?"••••": unitDisplay}
 </div>
 </div>
 </div>

 {/* Center: Mini Sparkline Visual Trend */}
 <div className="hidden sm:block">
 <SparklineMiniChart ticker={h.ticker} isPositive={isUp} width={80} height={30} />
 </div>

 {/* Right: Valuation & Returns */}
 <div className="text-right shrink-0">
 <div className="text-xs sm:text-sm font-bold text-[#f0f6fc] font-mono tabular-nums">
 {isPrivate ?"Rp ••••••••": formatIDR(marketValIdr)}
 </div>
 <div className="text-[11px] text-[#8b949e] font-mono tabular-nums">
 {isPrivate ?"••••": currentPriceDisplay}
 </div>
 <div
 className={`text-xs font-bold font-mono tabular-nums inline-flex items-center gap-0.5 mt-0.5 ${
 isUp ?"text-[#3fb950]":"text-[#f85149]"
 }`}
 >
 {isUp ?"+":""}
 {h.floating_pnl_percent !== undefined ? `${h.floating_pnl_percent}%` :"0%"}
 </div>
 </div>
 </div>

 {/* Expandable Breakdown & Actions Panel */}
 {isExpanded && (
 <div className="px-4 pb-4 pt-2 bg-[#0d1117]/40 border-t border-[#30363d] rounded-b-2xl shadow-inner space-y-3 animate-in fade-in duration-150">
 {/* Multi-Vault Breakdown */}
 {h.wallet_breakdown && h.wallet_breakdown.length > 0 && (
 <div className="space-y-1.5 pt-1">
 <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider flex items-center gap-1.5">
 <Building2 className="w-3.5 h-3.5 text-[#58a6ff]"/>
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
 onOpenCalibrate({
 ...h,
 id: wb.holding_id || h.id,
 portfolio_id: wb.wallet_id,
 quantity: wb.quantity,
 total_shares: wb.total_shares,
 total_lots: wb.total_lots,
 total_invested: wb.total_invested,
 total_invested_idr: wb.total_invested_idr,
 market_value: wb.market_value,
 market_value_idr: wb.market_value_idr,
 floating_pnl: wb.floating_pnl,
 floating_pnl_percent: wb.floating_pnl_percent,
 company_name: `${h.company_name || h.ticker} (${wb.wallet_name})`,
 });
 }}
 className="px-2.5 py-1.5 rounded-md bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] hover:border-[#8b949e] text-xs transition flex items-center gap-1.5 shadow-sm active:scale-95"
 title={`Klik untuk koreksi PnL pada ${wb.wallet_name}`}
 >
 <span className="font-bold text-[#f0f6fc] capitalize">{wb.wallet_name}:</span>
 <span className="font-mono text-[#c9d1d9] tabular-nums">
 {isPrivate
 ?"••••"
 : isStock
 ? `${wb.total_lots} Lot`
 : `${Number(wb.quantity).toLocaleString(undefined, { maximumFractionDigits: 6 })} unit`}
 </span>
 <span className={`text-[10px] font-bold font-mono tabular-nums ${isWbUp ?"text-[#3fb950]":"text-[#f85149]"}`}>
 ({isWbUp ?"+":""}{wb.floating_pnl_percent}%)
 </span>
 <span className="ml-1 px-1.5 py-0.5 rounded bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40 text-[9px] font-semibold">
 Koreksi PnL
 </span>
 </button>
 );
 })}
 </div>
 </div>
 )}

 {/* Quick Action Buttons */}
 <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#30363d] text-xs">
 <div className="text-[11px] text-[#8b949e]">
 Basis Modal Investasi: <strong className="text-[#f0f6fc] font-mono tabular-nums">{isPrivate ?"••••": formatIDR(h.total_invested_idr || h.total_invested || 0)}</strong>
 </div>

 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 onOpenCalibrate(h);
 }}
 className="px-3 py-1.5 rounded-md bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] font-semibold text-xs transition flex items-center gap-1.5 border border-[#30363d] active:scale-95"
 >
 <Sliders className="w-3 h-3 text-[#3fb950]"/>
 <span>Koreksi Presisi PnL / Kalibrasi</span>
 </button>
 </div>
 </div>
 )}
 </div>
 );
}

// Backward compatibility export
export { AssetLedgerRow as PluangAssetRow };
