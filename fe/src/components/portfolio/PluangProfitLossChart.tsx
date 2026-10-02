"use client";

import { useState } from"react";
import { formatIDR } from"@/services/api";
import {
 ChevronUp,
 ChevronDown,
 Info,
 ArrowUpDown,
 TrendingUp,
 TrendingDown,
 Scale,
 ShieldCheck,
 CheckCircle2,
 DollarSign,
} from"lucide-react";
import { PluangPnlBreakdown } from"@/types";

interface PluangProfitLossChartProps {
 data?: PluangPnlBreakdown;
 isPrivate?: boolean;
 holdingPeriodText?: string;
}

export default function PluangProfitLossChart({
 data,
 isPrivate = false,
 holdingPeriodText ="9 bulan 3 hari",
}: PluangProfitLossChartProps) {
 const [viewMode, setViewMode] = useState<"PERCENT"|"NOMINAL">("PERCENT");
 const [isUnrealizedOpen, setIsUnrealizedOpen] = useState(true);
 const [isRealizedOpen, setIsRealizedOpen] = useState(true);

 // Perhitungan Angka Bersih (Net Profit & Loss)
 const totalInvested = Math.round(data?.total_invested ?? 0);
 const currentMarketValue = Math.round(data?.current_market_value ?? 0);

 const unrealizedTotal = Math.round(data?.total_unrealized_pnl_idr ?? 0);
 const unrealizedPercent = Number(data?.total_unrealized_pnl_percent ?? 0);

 const unrealizedAsset = Math.round(data?.pure_asset_gain_idr ?? (data?.asset_pnl_idr ?? 0));
 const isUnrealizedAssetUp = unrealizedAsset >= 0;

 const unrealizedFx = Math.round(data?.fx_gain_idr ?? (data?.fx_pnl_idr ?? 0));
 const isUnrealizedFxUp = unrealizedFx >= 0;

 // Realized PnL figures
 const realizedTotal = 0;
 const realizedAsset = 0;
 const realizedFx = 0;
 const realizedDividend = 0;
 const hasRealizedTransactions = realizedTotal !== 0 || realizedAsset !== 0 || realizedDividend > 0;

 // Net Profit & Loss Bersih Total (Unrealized + Realized)
 const netPnlIdr = unrealizedTotal + realizedTotal;
 const netPnlPercent = totalInvested > 0 ? (netPnlIdr / totalInvested) * 100 : unrealizedPercent;
 const isNetProfit = netPnlIdr >= 0;

 // Proporsi kontribusi untuk Visual Breakdown Bar
 const absAsset = Math.abs(unrealizedAsset);
 const absFx = Math.abs(unrealizedFx);
 const totalAbsContr = Math.max(1, absAsset + absFx);
 const assetSharePct = Math.round((absAsset / totalAbsContr) * 100);
 const fxSharePct = 100 - assetSharePct;

 return (
 <div className="rounded-md bg-[#0d1117] border border-[#30363d] shadow-none p-4 sm:p-6 space-y-5 text-[#f0f6fc]">
 {/* 1. Header: Judul Komponen & Toggle Persentase / Nominal */}
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="w-7 h-7 rounded-md bg-[#161b22] border border-[#30363d]/80 flex items-center justify-center">
 <Scale className="w-3.5 h-3.5 text-[#58a6ff]"/>
 </div>
 <div>
 <h3 className="text-base sm:text-lg font-bold text-[#f0f6fc] tracking-tight">
 Laba &amp; Rugi Bersih (Net P&amp;L)
 </h3>
 <p className="text-[11px] text-[#8b949e]">
 Kalkulasi perolehan riil dari performa aset dan pengaruh kurs valas
 </p>
 </div>
 </div>

 {/* Toggle Mode Persentase / Nominal */}
 <button
 type="button"
 onClick={() => setViewMode(viewMode ==="PERCENT"?"NOMINAL":"PERCENT")}
 className="px-3 py-1.5 rounded-md bg-[#0d1117]/80 hover:bg-[#161b22] border border-[#30363d] text-xs font-mono font-bold text-[#58a6ff] hover:text-[#58a6ff] transition flex items-center gap-1.5 shadow-sm active:scale-95"
 title="Beralih tampilan Persentase (%) atau Nominal (Rp)"
 >
 <span>{viewMode ==="PERCENT"?"PERCENT (%)":"NOMINAL (Rp)"}</span>
 <ArrowUpDown className="w-3 h-3 text-[#58a6ff]"/>
 </button>
 </div>

 {/* 2. Hero Net Profit/Loss Summary Card (Opsi 2: Visual Card Ringkas & Elegan) */}
 <div className="rounded-md bg-gradient-to-br from-white/[0.04] via-black/40 to-transparent border border-[#30363d] shadow-none p-4 sm:p-5 space-y-4">
 <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
 <div className="space-y-1">
 <span className="text-xs font-semibold text-[#8b949e] tracking-wider uppercase">
 Total Hasil Bersih Portofolio
 </span>
 <div className="flex items-baseline gap-2.5">
 <span
 className={`text-2xl sm:text-3xl font-black font-mono tracking-tight tabular-nums ${
 isNetProfit ?"text-[#3fb950]":"text-[#f85149]"
 }`}
 >
 {isPrivate
 ?"Rp ••••••••"
 : viewMode ==="PERCENT"
 ? `${isNetProfit ?"+":""}${netPnlPercent.toFixed(2).replace(".",",")}%`
 : `${isNetProfit ?"+":""}${formatIDR(netPnlIdr)}`}
 </span>

 <span
 className={`text-xs px-2.5 py-0.5 rounded font-bold font-mono flex items-center gap-1 ${
 isNetProfit
 ?"bg-emerald-950/80 text-[#3fb950] border border-[#238636]/40"
 :"bg-rose-950/80 text-[#f85149] border border-[#da3633]/40"
 }`}
 >
 {isNetProfit ? (
 <>
 <TrendingUp className="w-3 h-3 text-[#3fb950]"/>
 <span>NET PROFIT</span>
 </>
 ) : (
 <>
 <TrendingDown className="w-3 h-3 text-[#f85149]"/>
 <span>NET LOSS</span>
 </>
 )}
 </span>
 </div>
 <div className="text-[11px] text-[#8b949e] font-mono">
 {isPrivate
 ?"••••"
 : viewMode ==="PERCENT"
 ? `Setara ${isNetProfit ?"+":""}${formatIDR(netPnlIdr)}`
 : `Return ${isNetProfit ?"+":""}${netPnlPercent.toFixed(2).replace(".",",")}%`}
 </div>
 </div>

 <div className="flex items-center gap-2 text-xs text-[#8b949e] sm:text-right font-mono">
 <span className="hidden sm:inline">•</span>
 <span>Holding Period: <strong className="text-[#c9d1d9]">{holdingPeriodText}</strong></span>
 </div>
 </div>

 {/* 3 Metric Mini Cards: Modal, Nilai Pasar, Hasil Bersih */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
 <div className="p-3 rounded-md bg-[#161b22] border border-[#30363d] hover:border-[#30363d]">
 <span className="text-[10px] font-mono uppercase tracking-wider text-[#8b949e] block">Total Capital Invested</span>
 <span className="text-sm font-bold font-mono text-[#f0f6fc] mt-0.5 block tabular-nums">
 {isPrivate ?"••••••••": formatIDR(totalInvested)}
 </span>
 </div>

 <div className="p-3 rounded-md bg-[#161b22] border border-[#30363d] hover:border-[#30363d]">
 <span className="text-[10px] font-mono uppercase tracking-wider text-[#8b949e] block">Current Market Valuation</span>
 <span className="text-sm font-bold font-mono text-[#f0f6fc] mt-0.5 block tabular-nums">
 {isPrivate ?"••••••••": formatIDR(currentMarketValue)}
 </span>
 </div>

 <div className="p-3 rounded-md bg-[#161b22] border border-[#30363d] hover:border-[#30363d]">
 <span className="text-[10px] font-mono uppercase tracking-wider text-[#8b949e] block">Net Gain / Drawdown</span>
 <span
 className={`text-sm font-bold font-mono mt-0.5 block tabular-nums ${
 isNetProfit ?"text-[#3fb950]":"text-[#f85149]"
 }`}
 >
 {isPrivate
 ?"••••"
 : `${isNetProfit ?"+":""}${formatIDR(netPnlIdr)} (${isNetProfit ?"+":""}${netPnlPercent.toFixed(2)}%)`}
 </span>
 </div>
 </div>

 {/* Visual Contribution Split: Pengaruh Harga Aset vs Selisih Kurs */}
 <div className="space-y-2 pt-1 border-t border-[#30363d]">
 <div className="flex items-center justify-between text-xs">
 <span className="text-[#8b949e] font-mono font-medium flex items-center gap-1.5">
 <span>RETURN DECOMPOSITION:</span>
 </span>
 <span className="text-[11px] text-[#8b949e] font-mono">
 Asset Drift vs FX Hedging
 </span>
 </div>

 {/* Dual Segmented Progress Bar */}
 <div className="h-2 w-full bg-[#161b22] rounded-full overflow-hidden flex">
 <div
 style={{ width: `${assetSharePct}%` }}
 className={`h-full transition-all duration-500 ${
 isUnrealizedAssetUp ?"bg-emerald-500":"bg-rose-500"
 }`}
 title={`Fluktuasi Harga Aset: ${assetSharePct}%`}
 />
 <div
 style={{ width: `${fxSharePct}%` }}
 className={`h-full transition-all duration-500 ${
 isUnrealizedFxUp ?"bg-blue-500":"bg-amber-500"
 }`}
 title={`Selisih Kurs Valas: ${fxSharePct}%`}
 />
 </div>

 {/* Keterangan Dekomposisi */}
 <div className="flex flex-wrap items-center justify-between text-[11px] font-mono gap-2">
 <div className="flex items-center gap-1.5">
 <span
 className={`w-2 h-2 rounded-full ${
 isUnrealizedAssetUp ?"bg-emerald-500":"bg-rose-500"
 }`}
 />
 <span className="text-[#8b949e]">Pure Asset Price:</span>
 <span
 className={`font-semibold tabular-nums ${
 isUnrealizedAssetUp ?"text-[#3fb950]":"text-[#f85149]"
 }`}
 >
 {isPrivate ?"••••": `${isUnrealizedAssetUp ?"+":""}${formatIDR(unrealizedAsset)}`}
 </span>
 </div>

 <div className="flex items-center gap-1.5">
 <span
 className={`w-2 h-2 rounded-full ${
 isUnrealizedFxUp ?"bg-blue-500":"bg-amber-500"
 }`}
 />
 <span className="text-[#8b949e]">USD/IDR FX Drift:</span>
 <span
 className={`font-semibold tabular-nums ${
 isUnrealizedFxUp ?"text-[#58a6ff]":"text-[#d29922]"
 }`}
 >
 {isPrivate ?"••••": `${isUnrealizedFxUp ?"+":""}${formatIDR(unrealizedFx)}`}
 </span>
 </div>
 </div>
 </div>
 </div>

 {/* 3. Unrealized P&L Accordion Card */}
 <div className="rounded-md bg-[#161b22] hover:bg-[#161b22] border border-[#30363d] overflow-hidden transition-all">
 <button
 type="button"
 onClick={() => setIsUnrealizedOpen(!isUnrealizedOpen)}
 className="w-full p-4 flex items-center justify-between text-left hover:bg-[#161b22]/40 transition"
 >
 <div className="flex items-center gap-2">
 <span className="text-sm font-bold text-[#c9d1d9]">
 Unrealized P&amp;L (Aset Aktif)
 </span>
 <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-[#388bfd]/15 text-[#58a6ff] border border-[#388bfd]/40">
 MARK-TO-MARKET
 </span>
 </div>

 <div className="flex items-center gap-2">
 <span
 className={`text-sm font-bold font-mono tabular-nums ${
 unrealizedTotal >= 0 ?"text-[#3fb950]":"text-[#f85149]"
 }`}
 >
 {isPrivate
 ?"••••"
 : `${unrealizedTotal >= 0 ?"+":""}${formatIDR(unrealizedTotal)}`}
 </span>
 {isUnrealizedOpen ? (
 <ChevronUp className="w-4 h-4 text-[#8b949e]"/>
 ) : (
 <ChevronDown className="w-4 h-4 text-[#8b949e]"/>
 )}
 </div>
 </button>

 {isUnrealizedOpen && (
 <div className="px-4 pb-4 pt-1 space-y-2.5 text-xs border-t border-[#30363d]">
 <div className="flex items-center justify-between">
 <div>
 <span className="text-[#c9d1d9] font-medium block">Laba Rugi Harga Aset</span>
 <span className="text-[11px] text-[#8b949e]">Kenaikan / penurunan harga pasar aset</span>
 </div>
 <span
 className={`font-semibold font-mono ${
 isUnrealizedAssetUp ?"text-[#3fb950]":"text-[#f85149]"
 }`}
 >
 {isPrivate
 ?"••••"
 : `${isUnrealizedAssetUp ?"+":""}${formatIDR(unrealizedAsset)}`}
 </span>
 </div>

 <div className="flex items-center justify-between">
 <div>
 <span className="text-[#c9d1d9] font-medium block">Laba Rugi Selisih Kurs Valas</span>
 <span className="text-[11px] text-[#8b949e]">Pengaruh perubahan nilai tukar USD terhadap Rupiah</span>
 </div>
 <span
 className={`font-semibold font-mono tabular-nums ${
 isUnrealizedFxUp ?"text-[#3fb950]":"text-[#f85149]"
 }`}
 >
 {isPrivate
 ?"••••"
 : `${isUnrealizedFxUp ?"+":""}${formatIDR(unrealizedFx)}`}
 </span>
 </div>
 </div>
 )}
 </div>

 {/* 4. Realized P&L Accordion Card */}
 <div className="rounded-md bg-[#161b22] hover:bg-[#161b22] border border-[#30363d] overflow-hidden transition-all">
 <button
 type="button"
 onClick={() => setIsRealizedOpen(!isRealizedOpen)}
 className="w-full p-4 flex items-center justify-between text-left hover:bg-[#161b22]/40 transition"
 >
 <div className="flex items-center gap-2">
 <span className="text-sm font-bold text-[#c9d1d9]">
 Realized P&amp;L (Sudah Direalisasikan)
 </span>
 <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-[#161b22] text-[#8b949e] border border-[#30363d]">
 SETTLED
 </span>
 </div>

 <div className="flex items-center gap-2">
 <span
 className={`text-sm font-bold font-mono tabular-nums ${
 realizedTotal >= 0 ?"text-[#c9d1d9]":"text-[#f85149]"
 }`}
 >
 {isPrivate
 ?"••••"
 : `${realizedTotal > 0 ?"+":""}${formatIDR(realizedTotal)}`}
 </span>
 {isRealizedOpen ? (
 <ChevronUp className="w-4 h-4 text-[#8b949e]"/>
 ) : (
 <ChevronDown className="w-4 h-4 text-[#8b949e]"/>
 )}
 </div>
 </button>

 {isRealizedOpen && (
 <div className="px-4 pb-4 pt-2 text-xs border-t border-[#30363d] font-mono">
 {!hasRealizedTransactions ? (
 <div className="p-3 rounded-md bg-[#0d1117]/60 border border-[#30363d]/80 flex items-center gap-2.5 text-[#8b949e] font-sans">
 <Info className="w-4 h-4 text-[#58a6ff] shrink-0"/>
 <span>
 Belum ada laba atau rugi yang dicairkan. Semua hasil saat ini masih bersifat mengambang (*unrealized mark-to-market*) pada aset aktif Anda.
 </span>
 </div>
 ) : (
 <div className="space-y-2.5">
 {realizedAsset !== 0 && (
 <div className="flex items-center justify-between">
 <span className="text-[#8b949e] font-sans">Laba Rugi Penjualan Aset</span>
 <span className="font-semibold font-mono text-[#3fb950] tabular-nums">
 {isPrivate ?"••••": `+${formatIDR(realizedAsset)}`}
 </span>
 </div>
 )}
 {realizedFx !== 0 && (
 <div className="flex items-center justify-between">
 <span className="text-[#8b949e] font-sans">Realisasi Selisih Kurs</span>
 <span className="font-semibold font-mono text-[#c9d1d9] tabular-nums">
 {isPrivate ?"••••": formatIDR(realizedFx)}
 </span>
 </div>
 )}
 {realizedDividend > 0 && (
 <div className="flex items-center justify-between">
 <span className="text-[#8b949e] font-sans">Dividen Diterima</span>
 <span className="font-semibold font-mono text-[#3fb950] tabular-nums">
 {isPrivate ?"••••": `+${formatIDR(realizedDividend)}`}
 </span>
 </div>
 )}
 </div>
 )}
 </div>
 )}
 </div>

 {/* 5. Catatan Kaki */}
 <div className="text-[11px] text-[#8b949e] font-mono italic pt-1">
 *Data dihitung secara deterministik berdasarkan settlement modal, kurs referensi USD/IDR live, dan mark-to-market ledger.
 </div>
 </div>
 );
}
