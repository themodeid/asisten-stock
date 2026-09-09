"use client";

import { useState } from "react";
import { formatIDR } from "@/services/api";
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
} from "lucide-react";
import { PluangPnlBreakdown } from "@/types";

interface PluangProfitLossChartProps {
  data?: PluangPnlBreakdown;
  isPrivate?: boolean;
  holdingPeriodText?: string;
}

export default function PluangProfitLossChart({
  data,
  isPrivate = false,
  holdingPeriodText = "9 bulan 3 hari",
}: PluangProfitLossChartProps) {
  const [viewMode, setViewMode] = useState<"PERCENT" | "NOMINAL">("PERCENT");
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
    <div className="rounded-3xl bg-[#090b0e] border border-white/[0.08] p-4 sm:p-6 shadow-2xl space-y-5 text-white">
      {/* 1. Header: Judul Komponen & Toggle Persentase / Nominal */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-zinc-900 border border-white/[0.08] flex items-center justify-center">
            <Scale className="w-3.5 h-3.5 text-zinc-300" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
              Laba &amp; Rugi Bersih (Net P&amp;L)
            </h3>
            <p className="text-[11px] text-zinc-400">
              Kalkulasi perolehan riil dari performa aset dan pengaruh kurs valas
            </p>
          </div>
        </div>

        {/* Toggle Mode Persentase / Nominal */}
        <button
          type="button"
          onClick={() => setViewMode(viewMode === "PERCENT" ? "NOMINAL" : "PERCENT")}
          className="px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] text-xs font-bold text-[#c6f022] hover:text-lime-300 transition flex items-center gap-1.5 shadow-sm active:scale-95"
          title="Beralih tampilan Persentase (%) atau Nominal (Rp)"
        >
          <span>{viewMode === "PERCENT" ? "Persentase (%)" : "Nominal (Rp)"}</span>
          <ArrowUpDown className="w-3 h-3 text-[#c6f022]" />
        </button>
      </div>

      {/* 2. Hero Net Profit/Loss Summary Card (Opsi 2: Visual Card Ringkas & Elegan) */}
      <div className="rounded-2xl bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 border border-white/[0.07] p-4 sm:p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">
              Total Hasil Bersih Portofolio
            </span>
            <div className="flex items-baseline gap-2.5">
              <span
                className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                  isNetProfit ? "text-[#00e676]" : "text-[#ff5252]"
                }`}
              >
                {isPrivate
                  ? "Rp ••••••••"
                  : viewMode === "PERCENT"
                  ? `${isNetProfit ? "+" : ""}${netPnlPercent.toFixed(2).replace(".", ",")}%`
                  : `${isNetProfit ? "+" : ""}${formatIDR(netPnlIdr)}`}
              </span>

              <span
                className={`text-xs px-2 py-0.5 rounded-md font-bold flex items-center gap-1 ${
                  isNetProfit
                    ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800/50"
                    : "bg-red-950/80 text-red-300 border border-red-800/50"
                }`}
              >
                {isNetProfit ? (
                  <>
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    <span>Laba Bersih</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3 h-3 text-red-400" />
                    <span>Rugi Bersih</span>
                  </>
                )}
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 font-mono">
              {isPrivate
                ? "••••"
                : viewMode === "PERCENT"
                ? `Setara ${isNetProfit ? "+" : ""}${formatIDR(netPnlIdr)}`
                : `Return ${isNetProfit ? "+" : ""}${netPnlPercent.toFixed(2).replace(".", ",")}%`}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-400 sm:text-right">
            <span className="hidden sm:inline">•</span>
            <span>Periode holding: <strong className="text-zinc-200">{holdingPeriodText}</strong></span>
          </div>
        </div>

        {/* 3 Metric Mini Cards: Modal, Nilai Pasar, Hasil Bersih */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <div className="p-3 rounded-xl bg-black/40 border border-white/[0.05]">
            <span className="text-[11px] text-zinc-400 block">Total Modal Disetor</span>
            <span className="text-sm font-bold font-mono text-zinc-100 mt-0.5 block">
              {isPrivate ? "••••••••" : formatIDR(totalInvested)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/[0.05]">
            <span className="text-[11px] text-zinc-400 block">Nilai Pasar Saat Ini</span>
            <span className="text-sm font-bold font-mono text-zinc-100 mt-0.5 block">
              {isPrivate ? "••••••••" : formatIDR(currentMarketValue)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/[0.05]">
            <span className="text-[11px] text-zinc-400 block">Keuntungan/Kerugian</span>
            <span
              className={`text-sm font-bold font-mono mt-0.5 block ${
                isNetProfit ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {isPrivate
                ? "••••"
                : `${isNetProfit ? "+" : ""}${formatIDR(netPnlIdr)} (${isNetProfit ? "+" : ""}${netPnlPercent.toFixed(2)}%)`}
            </span>
          </div>
        </div>

        {/* Visual Contribution Split: Pengaruh Harga Aset vs Selisih Kurs */}
        <div className="space-y-2 pt-1 border-t border-white/[0.05]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-medium flex items-center gap-1.5">
              <span>Dekomposisi Hasil Bersih:</span>
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">
              Harga Pasar vs Kurs IDR/USD
            </span>
          </div>

          {/* Dual Segmented Progress Bar */}
          <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${assetSharePct}%` }}
              className={`h-full transition-all duration-500 ${
                isUnrealizedAssetUp ? "bg-emerald-500" : "bg-red-500"
              }`}
              title={`Fluktuasi Harga Aset: ${assetSharePct}%`}
            />
            <div
              style={{ width: `${fxSharePct}%` }}
              className={`h-full transition-all duration-500 ${
                isUnrealizedFxUp ? "bg-teal-400" : "bg-orange-500"
              }`}
              title={`Selisih Kurs Valas: ${fxSharePct}%`}
            />
          </div>

          {/* Keterangan Dekomposisi */}
          <div className="flex flex-wrap items-center justify-between text-[11px] font-mono gap-2">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isUnrealizedAssetUp ? "bg-emerald-500" : "bg-red-500"
                }`}
              />
              <span className="text-zinc-400">Harga Aset Murni:</span>
              <span
                className={`font-semibold ${
                  isUnrealizedAssetUp ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {isPrivate ? "••••" : `${isUnrealizedAssetUp ? "+" : ""}${formatIDR(unrealizedAsset)}`}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isUnrealizedFxUp ? "bg-teal-400" : "bg-orange-500"
                }`}
              />
              <span className="text-zinc-400">Selisih Kurs (USD/IDR):</span>
              <span
                className={`font-semibold ${
                  isUnrealizedFxUp ? "text-teal-300" : "text-orange-400"
                }`}
              >
                {isPrivate ? "••••" : `${isUnrealizedFxUp ? "+" : ""}${formatIDR(unrealizedFx)}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Unrealized P&L Accordion Card */}
      <div className="rounded-2xl bg-[#12161f] border border-white/[0.06] overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setIsUnrealizedOpen(!isUnrealizedOpen)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-zinc-200">
              Unrealized P&amp;L (Aset Aktif)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-medium">
              Mengambang
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-bold font-mono ${
                unrealizedTotal >= 0 ? "text-[#00e676]" : "text-[#ff5252]"
              }`}
            >
              {isPrivate
                ? "••••"
                : `${unrealizedTotal >= 0 ? "+" : ""}${formatIDR(unrealizedTotal)}`}
            </span>
            {isUnrealizedOpen ? (
              <ChevronUp className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            )}
          </div>
        </button>

        {isUnrealizedOpen && (
          <div className="px-4 pb-4 pt-1 space-y-2.5 text-xs border-t border-white/[0.04]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-zinc-300 font-medium block">Laba Rugi Harga Aset</span>
                <span className="text-[11px] text-zinc-500">Kenaikan / penurunan harga pasar aset</span>
              </div>
              <span
                className={`font-semibold font-mono ${
                  isUnrealizedAssetUp ? "text-[#00e676]" : "text-[#ff5252]"
                }`}
              >
                {isPrivate
                  ? "••••"
                  : `${isUnrealizedAssetUp ? "+" : ""}${formatIDR(unrealizedAsset)}`}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-zinc-300 font-medium block">Laba Rugi Selisih Kurs Valas</span>
                <span className="text-[11px] text-zinc-500">Pengaruh perubahan nilai tukar USD terhadap Rupiah</span>
              </div>
              <span
                className={`font-semibold font-mono ${
                  isUnrealizedFxUp ? "text-[#00e676]" : "text-[#ff5252]"
                }`}
              >
                {isPrivate
                  ? "••••"
                  : `${isUnrealizedFxUp ? "+" : ""}${formatIDR(unrealizedFx)}`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Realized P&L Accordion Card (Opsi 3: Bersih dari Clutter Rp 0) */}
      <div className="rounded-2xl bg-[#12161f] border border-white/[0.06] overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setIsRealizedOpen(!isRealizedOpen)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-zinc-200">
              Realized P&amp;L (Sudah Direalisasikan)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-medium">
              Dicairkan
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-bold font-mono ${
                realizedTotal >= 0 ? "text-zinc-300" : "text-[#ff5252]"
              }`}
            >
              {isPrivate
                ? "••••"
                : `${realizedTotal > 0 ? "+" : ""}${formatIDR(realizedTotal)}`}
            </span>
            {isRealizedOpen ? (
              <ChevronUp className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            )}
          </div>
        </button>

        {isRealizedOpen && (
          <div className="px-4 pb-4 pt-2 text-xs border-t border-white/[0.04]">
            {!hasRealizedTransactions ? (
              // Tampilan bersih saat belum ada transaksi jual / dividen terealisasi
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-white/[0.04] flex items-center gap-2.5 text-zinc-400">
                <Info className="w-4 h-4 text-zinc-500 shrink-0" />
                <span>
                  Belum ada laba atau rugi yang dicairkan. Semua hasil saat ini masih bersifat mengambang (*unrealized*) pada aset aktif Anda.
                </span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {realizedAsset !== 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Laba Rugi Penjualan Aset</span>
                    <span className="font-semibold font-mono text-[#00e676]">
                      {isPrivate ? "••••" : `+${formatIDR(realizedAsset)}`}
                    </span>
                  </div>
                )}
                {realizedFx !== 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Realisasi Selisih Kurs</span>
                    <span className="font-semibold font-mono text-zinc-300">
                      {isPrivate ? "••••" : formatIDR(realizedFx)}
                    </span>
                  </div>
                )}
                {realizedDividend > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Dividen Diterima</span>
                    <span className="font-semibold font-mono text-[#00e676]">
                      {isPrivate ? "••••" : `+${formatIDR(realizedDividend)}`}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Catatan Kaki */}
      <div className="text-[11px] text-zinc-500 italic pt-1">
        *Data dihitung secara otomatis berdasarkan transaksi modal beli, kurs referensi USD/IDR, dan valuasi pasar *live*.
      </div>
    </div>
  );
}
