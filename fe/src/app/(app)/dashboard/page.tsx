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
  PlusCircle,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import PortfolioChartCard from "@/components/portfolio/PortfolioChartCard";

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

      <main className="p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Banner Welcome with AI Trigger */}
        <div className="relative overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-zinc-800 border border-zinc-700/60 text-zinc-300 text-xs font-medium mb-3">
                <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
                Jarvis AI Assistant Siap Membantu
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-zinc-100">
                Kelola & Analisis Saham Anda Secara Cerdas
              </h1>
              <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                Ketik secara natural lewat Telegram Bot, unggah struk transaksi/screenshot,
                atau gunakan AI Simulator untuk optimasi portofolio otomatis.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/playground"
                className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold text-xs shadow-sm transition flex items-center gap-2 active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4 text-zinc-900" />
                Tanya Jarvis AI
              </Link>
              <button
                onClick={fetchDashboard}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 text-zinc-300 border border-zinc-700/80 transition"
                title="Refresh Data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Top Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Nilai Portofolio (Net Worth)"
            value={formatIDR(data?.totalNetWorth || 0)}
            subtitle="Nilai Seluruh Aset + Saldo Kas"
            icon={Wallet}
          />
          <StatCard
            title="Total Modal Ditanam"
            value={formatIDR(data?.totalInvested || 0)}
            subtitle="Harga Beli Kumulatif"
            icon={Coins}
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
          />
          <StatCard
            title="Jumlah Posisi Aset"
            value={`${data?.activeHoldingsCount || 0} Aset`}
            subtitle="Diversifikasi Multi-Aset"
            icon={Layers}
          />
        </div>

        {/* Reku-Style Glowing Line Portfolio Chart */}
        <PortfolioChartCard
          portfolioId={1}
          totalNetWorth={data?.totalNetWorth}
          totalInvested={data?.totalInvested}
          cashBalance={data?.cashBalance}
        />

        {/* Smart AI Metrics Row: Health Score & Passive Income Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Health Score Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <h3 className="text-sm font-semibold text-zinc-100">
                    AI Portfolio Health Score
                  </h3>
                </div>
                <Link
                  href="/portfolio?tab=health"
                  className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 font-medium"
                >
                  Analisis Detail <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="flex items-center gap-4 my-2">
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-3xl font-extrabold ${
                    (healthData?.health_score || 0) >= 70
                      ? "text-emerald-400"
                      : (healthData?.health_score || 0) >= 50
                      ? "text-amber-400"
                      : "text-red-400"
                  }`}>
                    {healthData?.health_score ?? "--"}
                  </span>
                  <span className="text-xs text-zinc-500 font-semibold">/100</span>
                </div>
                <div className="space-y-0.5">
                  <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                    (healthData?.health_score || 0) >= 70
                      ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/60"
                      : (healthData?.health_score || 0) >= 50
                      ? "bg-amber-950/60 text-amber-300 border border-amber-800/60"
                      : "bg-red-950/60 text-red-300 border border-red-800/60"
                  }`}>
                    {healthData?.rating || "Evaluasi"}
                  </span>
                  <div className="text-[11px] text-zinc-400">
                    Profil: <span className="text-zinc-200 font-medium">{healthData?.risk_profile || "Agresif"}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed mt-2 line-clamp-2">
                {healthData?.summary || "Sistem AI memantau konsentrasi risiko, rasio diversifikasi, dan bantalan likuiditas Anda secara real-time."}
              </p>
            </div>

            {healthData?.rebalancing_actions && healthData.rebalancing_actions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-300">
                <span className="text-zinc-400 text-[11px]">Saran Utama:</span>
                <span className="font-medium text-amber-300 truncate max-w-[280px]">
                  {healthData.rebalancing_actions[0]?.reason}
                </span>
              </div>
            )}
          </div>

          {/* Dividend & Passive Income Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-zinc-100">
                    Proyeksi Passive Income & Dividen
                  </h3>
                </div>
                <Link
                  href="/portfolio?tab=dividends"
                  className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 font-medium"
                >
                  Kalender Dividen <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 my-2">
                <div className="p-2.5 rounded-lg bg-zinc-850 border border-zinc-800">
                  <div className="text-[10px] text-zinc-400 uppercase font-semibold">Estimasi Tahunan</div>
                  <div className="text-base font-bold text-emerald-400 mt-0.5">
                    {formatIDR(dividendData?.annual_passive_income_idr || 0)}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">
                    Yield: {dividendData?.portfolio_dividend_yield_percent || 0}% / thn
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-zinc-850 border border-zinc-800">
                  <div className="text-[10px] text-zinc-400 uppercase font-semibold">Rata-rata Bulanan</div>
                  <div className="text-base font-bold text-zinc-100 mt-0.5">
                    {formatIDR(dividendData?.average_monthly_income_idr || 0)}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">
                    Cash flow pasif reguler
                  </div>
                </div>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                {dividendData?.holdings?.length
                  ? `Dihasilkan dari ${dividendData.holdings.length} aset penghasil dividen/bunga (misal: ${dividendData.holdings.map((h: any) => h.ticker).join(", ")})`
                  : "Tambahkan saham berdividen (BBCA, BBRI) atau SBN untuk mengoptimalkan passive income tahunan Anda."}
              </p>
            </div>

            <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
              <span className="text-[11px]">Bulan Pembagian Terdekat:</span>
              <span className="text-zinc-200 font-medium">
                {dividendData?.monthly_projections?.find((m: any) => m.estimated_income_idr > 0)?.month_name || "Maret / Juni"}
              </span>
            </div>
          </div>
        </div>

        {/* Asset Class Allocation Breakdown */}
        {data?.assetAllocations && data.assetAllocations.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">
                  Alokasi Portofolio Berdasarkan Kelas Aset
                </h3>
                <p className="text-xs text-zinc-400">
                  Komposisi diversifikasi investasi Anda (Saham, Kripto, ETF, SBN, Emas, Kas)
                </p>
              </div>
            </div>

            {/* Visual multi-segment progress bar */}
            <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden flex mb-4">
              {data.assetAllocations.map((alloc: any, idx: number) => {
                const colors = [
                  "bg-blue-500",
                  "bg-amber-500",
                  "bg-emerald-500",
                  "bg-purple-500",
                  "bg-yellow-400",
                  "bg-cyan-500",
                  "bg-zinc-500",
                ];
                const color = colors[idx % colors.length];
                return (
                  <div
                    key={alloc.asset_type}
                    style={{ width: `${Math.max(alloc.percentage, 2)}%` }}
                    className={`${color} h-full transition-all`}
                    title={`${alloc.label}: ${alloc.percentage}%`}
                  />
                );
              })}
            </div>

            {/* Badges and Values */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {data.assetAllocations.map((alloc: any, idx: number) => {
                const dotColors = [
                  "bg-blue-500",
                  "bg-amber-500",
                  "bg-emerald-500",
                  "bg-purple-500",
                  "bg-yellow-400",
                  "bg-cyan-500",
                  "bg-zinc-500",
                ];
                const dotColor = dotColors[idx % dotColors.length];

                return (
                  <div
                    key={alloc.asset_type}
                    className="p-3 rounded-lg bg-zinc-850 border border-zinc-800 flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                      <span className="text-xs text-zinc-300 font-medium truncate">
                        {alloc.label}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-zinc-100">
                        {alloc.percentage}%
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {formatIDR(alloc.total_value)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Grid 2 Columns: Holdings Table & Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Holdings List (2 cols) */}
          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-zinc-100">
                  Posisi Aset Terbesar
                </h3>
                <p className="text-xs text-zinc-400">
                  Nilai pasar live dan floating return per aset
                </p>
              </div>
              <Link
                href="/portfolio"
                className="text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-1"
              >
                Lihat Semua <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[11px] text-zinc-400 border-b border-zinc-800 pb-3 uppercase tracking-wider font-semibold">
                    <th className="pb-3">ASET & KELAS</th>
                    <th className="pb-3">KUANTITAS</th>
                    <th className="pb-3">AVG BUY</th>
                    <th className="pb-3">HARGA PASAR</th>
                    <th className="pb-3">RETURN</th>
                    <th className="pb-3 text-right">BOBOT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80">
                  {data?.holdings && data.holdings.length > 0 ? (
                    data.holdings.map((h: any) => {
                      const isUp = (h.floating_pnl || 0) >= 0;
                      const aType = h.asset_type || "STOCK";
                      const isStock = aType === "STOCK";
                      const isUSD = h.currency === "USD";

                      return (
                        <tr
                          key={`${h.ticker}-${aType}`}
                          className="hover:bg-zinc-800/40 transition"
                        >
                          <td className="py-3">
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                                {aType}
                              </span>
                              <span className="font-semibold text-zinc-100">{h.ticker}</span>
                            </div>
                            <div className="text-[11px] text-zinc-400 truncate max-w-[150px] mt-0.5">
                              {h.company_name}
                            </div>
                          </td>
                          <td className="py-3 text-zinc-200 font-medium">
                            {isStock ? (
                              `${h.total_lots} Lot`
                            ) : (
                              `${h.quantity} ${aType === "GOLD" ? "gr" : "unit"}`
                            )}
                          </td>
                          <td className="py-3 text-zinc-300">
                            {isUSD ? `$${h.avg_buy_price}` : formatIDR(h.avg_buy_price)}
                          </td>
                          <td className="py-3 text-zinc-200 font-semibold">
                            {isUSD
                              ? `$${h.current_price || h.avg_buy_price}`
                              : formatIDR(h.current_price || h.avg_buy_price)}
                          </td>
                          <td className="py-3">
                            <Badge variant={isUp ? "success" : "danger"}>
                              {isUp ? "+" : ""}
                              {h.floating_pnl_percent}%
                            </Badge>
                          </td>
                          <td className="py-3 text-right font-medium text-zinc-300">
                            {h.weight_percent ? `${h.weight_percent}%` : "-"}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-8 text-zinc-500"
                      >
                        Belum ada data saham. Gunakan chat atau tombol tambah
                        transaksi.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Activity Log (1 col) */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-zinc-100">
                  Transaksi Terkini
                </h3>
                <Link
                  href="/transactions"
                  className="text-xs font-medium text-zinc-300 hover:text-white"
                >
                  Riwayat
                </Link>
              </div>

              <div className="space-y-2 mt-3">
                {data?.recentTransactions && data.recentTransactions.length > 0 ? (
                  data.recentTransactions.map((tx: any) => (
                    <div
                      key={tx.id}
                      className="p-2.5 rounded-lg bg-zinc-850 border border-zinc-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs ${
                            tx.type === "BUY"
                              ? "bg-emerald-950/40 text-emerald-300 border border-emerald-800/60"
                              : "bg-red-950/40 text-red-300 border border-red-800/60"
                          }`}
                        >
                          {tx.type === "BUY" ? (
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-zinc-200">
                            {tx.type} {tx.ticker}
                          </div>
                          <div className="text-[11px] text-zinc-400">
                            {tx.lots} Lot @ {formatIDR(tx.price_per_share)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium text-zinc-300">
                          {formatIDR(tx.total_amount)}
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          {new Date(tx.transaction_date).toLocaleDateString(
                            "id-ID"
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-500 text-center py-6">
                    Belum ada transaksi tercatat.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-zinc-800">
              <Link
                href="/portfolio"
                className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 text-zinc-200 font-medium text-xs flex items-center justify-center gap-2 border border-zinc-700/80 transition"
              >
                <PlusCircle className="w-3.5 h-3.5 text-zinc-300" />
                Catat Transaksi Manual
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
