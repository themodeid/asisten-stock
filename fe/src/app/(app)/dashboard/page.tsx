"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import { api, formatIDR, formatPercent } from "@/services/api";
import {
  Wallet,
  TrendingUp,
  Coins,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  RefreshCw,
  Activity,
  Calendar,
  ShieldCheck,
  Zap,
} from "lucide-react";
import Link from "next/link";
import PortfolioChartCard from "@/components/portfolio/PortfolioChartCard";
import MarketTickerRibbon from "@/components/dashboard/MarketTickerRibbon";
import QuickActionHub from "@/components/dashboard/QuickActionHub";
import AssetAllocationBar from "@/components/dashboard/AssetAllocationBar";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [healthData, setHealthData] = useState<any>(null);
  const [dividendData, setDividendData] = useState<any>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [dashRes, healthRes, divRes] = await Promise.allSettled([
        api.get("/dashboard/1"),
        api.get("/portfolio/health/1"),
        api.get("/portfolio/dividends/1"),
      ]);

      if (dashRes.status === "fulfilled" && dashRes.value.data?.data) {
        setData(dashRes.value.data.data);
      }
      if (healthRes.status === "fulfilled" && healthRes.value.data?.data) {
        setHealthData(healthRes.value.data.data);
      }
      if (divRes.status === "fulfilled" && divRes.value.data?.data) {
        setDividendData(divRes.value.data.data);
      }
    } catch (err) {
      console.warn("Failed fetching dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const pnlIsPositive = (data?.totalFloatingPnl || 0) >= 0;

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Dashboard Ringkasan" />

      <main className="p-3.5 sm:p-5 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* 1. Live Market Ticker Ribbon (Pluang / Bloomberg Style) */}
        <MarketTickerRibbon />

        {/* 2. Interactive Glowing Line Portfolio Hero Chart */}
        <PortfolioChartCard
          portfolioId={1}
          totalNetWorth={data?.totalNetWorth}
          totalInvested={data?.totalInvested}
          cashBalance={data?.cashBalance}
        />

        {/* 3. Quick Action Hub (Pluang / Revolut Style Action Dock) */}
        <QuickActionHub />

        {/* 4. Top Key Metrics - 4 Elevated Stat Cards with Glassmorphism */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Nilai Portofolio (Net Worth)"
            value={formatIDR(data?.totalNetWorth || 0)}
            subtitle="Nilai Seluruh Aset + Saldo Kas"
            icon={Wallet}
            accentColor="emerald"
          />
          <StatCard
            title="Total Modal Ditanam"
            value={formatIDR(data?.totalInvested || 0)}
            subtitle="Harga Beli Kumulatif"
            icon={Coins}
            accentColor="blue"
          />
          <StatCard
            title="Floating Profit / Loss"
            value={formatIDR(data?.totalFloatingPnl || 0)}
            trend={{
              value: formatPercent(data?.totalFloatingPnlPercent || 0),
              isPositive: pnlIsPositive,
            }}
            subtitle="Unrealized P/L Multi-Aset"
            icon={TrendingUp}
            accentColor={pnlIsPositive ? "emerald" : "amber"}
          />
          <StatCard
            title="Jumlah Posisi Aset"
            value={`${data?.activeHoldingsCount || 0} Aset`}
            subtitle="Diversifikasi Multi-Aset"
            icon={Layers}
            accentColor="purple"
          />
        </div>

        {/* 5. Asset Allocation Segmented Bar */}
        {data?.assetAllocations && (
          <AssetAllocationBar
            allocations={data.assetAllocations}
            totalValue={data.totalNetWorth}
          />
        )}

        {/* 6. Smart AI Metrics Row: Health Score & Passive Income Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Health Score Card */}
          <div className="rounded-2xl bg-zinc-900/70 border border-white/[0.06] p-5 flex flex-col justify-between shadow-lg backdrop-blur-xl glass-card glass-card-hover">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
                  <h3 className="text-sm font-bold text-zinc-100 tracking-tight">
                    AI Portfolio Health Score
                  </h3>
                </div>
                <Link
                  href="/portfolio?tab=health"
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
                >
                  Analisis Detail <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="flex items-center gap-4 my-3">
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-4xl font-black font-mono tracking-tight ${
                      (healthData?.health_score || 0) >= 70
                        ? "text-emerald-400"
                        : (healthData?.health_score || 0) >= 50
                        ? "text-amber-400"
                        : "text-rose-400"
                    }`}
                  >
                    {healthData?.health_score ?? "--"}
                  </span>
                  <span className="text-xs text-zinc-500 font-bold">/100</span>
                </div>
                <div className="space-y-1">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                      (healthData?.health_score || 0) >= 70
                        ? "bg-emerald-950/70 text-emerald-300 border border-emerald-800/60"
                        : (healthData?.health_score || 0) >= 50
                        ? "bg-amber-950/70 text-amber-300 border border-amber-800/60"
                        : "bg-rose-950/70 text-rose-300 border border-rose-800/60"
                    }`}
                  >
                    {healthData?.rating || "Evaluasi"}
                  </span>
                  <div className="text-[11px] text-zinc-400 font-medium">
                    Profil Risiko: <span className="text-zinc-200 font-semibold">{healthData?.risk_profile || "Agresif"}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                {healthData?.summary ||
                  "Sistem AI memantau konsentrasi risiko, rasio diversifikasi, dan bantalan likuiditas Anda secara real-time."}
              </p>
            </div>

            {healthData?.rebalancing_actions && healthData.rebalancing_actions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-300">
                <span className="text-zinc-400 text-[11px] font-semibold uppercase tracking-wider">
                  Saran AI:
                </span>
                <span className="font-medium text-amber-300 truncate max-w-[280px]">
                  {healthData.rebalancing_actions[0]?.reason}
                </span>
              </div>
            )}
          </div>

          {/* Dividend & Passive Income Card */}
          <div className="rounded-2xl bg-zinc-900/70 border border-white/[0.06] p-5 flex flex-col justify-between shadow-lg backdrop-blur-xl glass-card glass-card-hover">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-zinc-100 tracking-tight">
                    Proyeksi Dividen & Passive Income
                  </h3>
                </div>
                <Link
                  href="/portfolio?tab=dividends"
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
                >
                  Kalender Dividen <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 my-3">
                <div className="p-3 rounded-xl bg-zinc-850/60 border border-white/[0.04]">
                  <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                    Estimasi Tahunan
                  </div>
                  <div className="text-base font-black text-emerald-400 font-mono mt-0.5">
                    {formatIDR(dividendData?.annual_passive_income_idr || 0)}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">
                    Yield: {dividendData?.portfolio_dividend_yield_percent || 0}% / thn
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-850/60 border border-white/[0.04]">
                  <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                    Rata-rata Bulanan
                  </div>
                  <div className="text-base font-black text-zinc-100 font-mono mt-0.5">
                    {formatIDR(dividendData?.average_monthly_income_idr || 0)}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">
                    Cash flow pasif reguler
                  </div>
                </div>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                {dividendData?.holdings?.length
                  ? `Dihasilkan dari ${dividendData.holdings.length} aset dividen (misal: ${dividendData.holdings.map((h: any) => h.ticker).join(", ")})`
                  : "Tambahkan saham berdividen (BBCA, BBRI) atau SBN untuk mengoptimalkan passive income tahunan Anda."}
              </p>
            </div>

            <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                Pembagian Terdekat:
              </span>
              <span className="text-zinc-200 font-medium">
                {dividendData?.monthly_projections?.find((m: any) => m.estimated_income_idr > 0)?.month_name || "Maret / Juni"}
              </span>
            </div>
          </div>
        </div>

        {/* 7. Grid 2 Columns: Holdings Table & Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Holdings List (2 cols) */}
          <div className="lg:col-span-2 rounded-2xl bg-zinc-900/70 border border-white/[0.06] p-5 shadow-lg backdrop-blur-xl glass-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-100 tracking-tight">
                  Posisi Aset Terbesar
                </h3>
                <p className="text-xs text-zinc-400">
                  Nilai pasar live dan floating return per aset
                </p>
              </div>
              <Link
                href="/portfolio"
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
              >
                Lihat Semua <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="pb-3 font-semibold">Instrumen</th>
                    <th className="pb-3 font-semibold">Tipe</th>
                    <th className="pb-3 font-semibold text-right">Nilai Pasar</th>
                    <th className="pb-3 font-semibold text-right">P/L (%)</th>
                    <th className="pb-3 font-semibold text-right">Bobot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {data?.topHoldings && data.topHoldings.length > 0 ? (
                    data.topHoldings.map((item: any) => {
                      const isProfit = (item.floating_pnl || 0) >= 0;
                      return (
                        <tr
                          key={item.ticker}
                          className="hover:bg-white/[0.02] transition"
                        >
                          <td className="py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-white/[0.08] flex items-center justify-center font-bold text-[10px] text-zinc-200">
                                {item.ticker.slice(0, 3)}
                              </div>
                              <div>
                                <span className="font-bold text-zinc-100 block">
                                  {item.ticker}
                                </span>
                                <span className="text-[10px] text-zinc-400 block line-clamp-1 max-w-[120px]">
                                  {item.company_name}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 border border-white/[0.06] font-mono">
                              {item.asset_type || "STOCK"}
                            </span>
                          </td>
                          <td className="py-3 text-right font-medium text-zinc-200 font-mono">
                            {formatIDR(item.market_value_idr || item.market_value)}
                          </td>
                          <td className="py-3 text-right font-mono font-semibold">
                            <span
                              className={`${
                                isProfit ? "text-emerald-400" : "text-rose-400"
                              }`}
                            >
                              {formatPercent(item.floating_pnl_percent || 0)}
                            </span>
                          </td>
                          <td className="py-3 text-right text-zinc-400 font-mono">
                            {(item.weight_percent || 0).toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-zinc-500">
                        Belum ada aset dalam portofolio
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Activity (1 col) */}
          <div className="rounded-2xl bg-zinc-900/70 border border-white/[0.06] p-5 shadow-lg backdrop-blur-xl glass-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-zinc-100 tracking-tight">
                    Aktivitas Terbaru
                  </h3>
                  <p className="text-xs text-zinc-400">Log mutasi transaksi</p>
                </div>
                <Link
                  href="/transactions"
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
                >
                  Riwayat <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-2.5">
                {data?.recentTransactions && data.recentTransactions.length > 0 ? (
                  data.recentTransactions.map((tx: any) => {
                    const isBuy = tx.type === "BUY";
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-850/50 hover:bg-zinc-850/90 border border-white/[0.04] transition"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isBuy
                                ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/60"
                                : "bg-rose-950/60 text-rose-400 border border-rose-800/60"
                            }`}
                          >
                            {isBuy ? "B" : "S"}
                          </div>
                          <div>
                            <span className="font-bold text-zinc-100 text-xs block">
                              {tx.ticker}
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              {new Date(tx.transaction_date).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-xs font-semibold text-zinc-200 block">
                            {formatIDR(tx.total_amount_idr || tx.total_amount)}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {tx.quantity ? `${tx.quantity} unit` : `${tx.lots} lot`}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center py-6 text-zinc-500 text-xs">
                    Belum ada riwayat transaksi
                  </p>
                )}
              </div>
            </div>

            {/* Quick Action Footer */}
            <div className="pt-4 border-t border-white/[0.06] mt-4">
              <Link
                href="/portfolio"
                className="w-full py-2 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 border border-white/[0.08] text-xs font-semibold transition flex items-center justify-center gap-2"
              >
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                Catat Transaksi Baru
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
