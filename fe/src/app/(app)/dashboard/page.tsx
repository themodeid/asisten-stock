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

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get("/dashboard/1");
      if (res.data?.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.warn("Failed fetching dashboard metrics:", err);
      // Mock data fallback for standalone UI demo
      setData({
        totalNetWorth: 48500000,
        totalInvested: 42000000,
        totalCash: 2500000,
        totalFloatingPnl: 4000000,
        totalFloatingPnlPercent: 9.52,
        activeHoldingsCount: 3,
        holdings: [
          {
            ticker: "BBCA.JK",
            company_name: "Bank Central Asia Tbk",
            total_lots: 20,
            avg_buy_price: 9200,
            current_price: 9925,
            market_value: 19850000,
            floating_pnl: 1450000,
            floating_pnl_percent: 7.88,
            weight_percent: 40.9,
          },
          {
            ticker: "BBRI.JK",
            company_name: "Bank Rakyat Indonesia Tbk",
            total_lots: 35,
            avg_buy_price: 4400,
            current_price: 4750,
            market_value: 16625000,
            floating_pnl: 1225000,
            floating_pnl_percent: 7.95,
            weight_percent: 34.3,
          },
          {
            ticker: "TLKM.JK",
            company_name: "Telkom Indonesia Tbk",
            total_lots: 34,
            avg_buy_price: 2700,
            current_price: 2820,
            market_value: 9588000,
            floating_pnl: 408000,
            floating_pnl_percent: 4.44,
            weight_percent: 19.8,
          },
        ],
        recentTransactions: [
          {
            id: 1,
            ticker: "BBCA.JK",
            type: "BUY",
            lots: 10,
            price_per_share: 9200,
            total_amount: 9200000,
            transaction_date: new Date().toISOString(),
          },
          {
            id: 2,
            ticker: "BBRI.JK",
            type: "BUY",
            lots: 20,
            price_per_share: 4400,
            total_amount: 8800000,
            transaction_date: new Date().toISOString(),
          },
        ],
      });
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

      <main className="p-8 space-y-8 max-w-7xl w-full mx-auto">
        {/* Banner Welcome with AI Trigger */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900/50 via-indigo-900/40 to-slate-900 border border-blue-500/20 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                Jarvis AI Assistant Siap Membantu
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                Kelola & Analisis Saham Anda Secara Cerdas
              </h1>
              <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                Ketik secara natural lewat Telegram Bot atau AI Simulator untuk
                mencatat beli/jual saham, memantau avg price, atau menganalisis
                laporan emiten.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/playground"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm shadow-lg shadow-blue-600/30 transition flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Tanya Jarvis AI
              </Link>
              <button
                onClick={fetchDashboard}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                title="Refresh Data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Top Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Nilai Portofolio (Net Worth)"
            value={formatIDR(data?.totalNetWorth || 0)}
            subtitle="Nilai Saham + Saldo Kas"
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
            subtitle="Unrealized P/L"
            icon={TrendingUp}
          />
          <StatCard
            title="Jumlah Posisi Saham"
            value={`${data?.activeHoldingsCount || 0} Emiten`}
            subtitle="Diversifikasi Aset Aktif"
            icon={Layers}
          />
        </div>

        {/* Grid 2 Columns: Holdings Table & Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Holdings List (2 cols) */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-100">
                  Posisi Saham Terbesar
                </h3>
                <p className="text-xs text-slate-400">
                  Nilai pasar live dan floating return per emiten
                </p>
              </div>
              <Link
                href="/portfolio"
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                Lihat Semua <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs text-slate-400 border-b border-slate-800 pb-3">
                    <th className="font-semibold pb-3">EMITEN</th>
                    <th className="font-semibold pb-3">JUMLAH LOT</th>
                    <th className="font-semibold pb-3">AVG BUY</th>
                    <th className="font-semibold pb-3">HARGA LIVE</th>
                    <th className="font-semibold pb-3">RETURN</th>
                    <th className="font-semibold pb-3 text-right">BOBOT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {data?.holdings && data.holdings.length > 0 ? (
                    data.holdings.map((h: any) => {
                      const isUp = (h.floating_pnl || 0) >= 0;
                      return (
                        <tr
                          key={h.ticker}
                          className="hover:bg-slate-800/40 transition"
                        >
                          <td className="py-3.5">
                            <div className="font-bold text-slate-100">
                              {h.ticker}
                            </div>
                            <div className="text-xs text-slate-400 truncate max-w-[150px]">
                              {h.company_name}
                            </div>
                          </td>
                          <td className="py-3.5 text-slate-200 font-medium">
                            {h.total_lots} Lot
                          </td>
                          <td className="py-3.5 text-slate-300">
                            {formatIDR(h.avg_buy_price)}
                          </td>
                          <td className="py-3.5 text-slate-200 font-semibold">
                            {formatIDR(h.current_price || h.avg_buy_price)}
                          </td>
                          <td className="py-3.5">
                            <Badge variant={isUp ? "success" : "danger"}>
                              {isUp ? "+" : ""}
                              {h.floating_pnl_percent}%
                            </Badge>
                          </td>
                          <td className="py-3.5 text-right font-medium text-slate-300">
                            {h.weight_percent ? `${h.weight_percent}%` : "-"}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-8 text-slate-500"
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-100">
                  Transaksi Terkini
                </h3>
                <Link
                  href="/transactions"
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300"
                >
                  Riwayat
                </Link>
              </div>

              <div className="space-y-3 mt-4">
                {data?.recentTransactions && data.recentTransactions.length > 0 ? (
                  data.recentTransactions.map((tx: any) => (
                    <div
                      key={tx.id}
                      className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                            tx.type === "BUY"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-rose-500/20 text-rose-400"
                          }`}
                        >
                          {tx.type === "BUY" ? (
                            <ArrowDownRight className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-200">
                            {tx.type} {tx.ticker}
                          </div>
                          <div className="text-xs text-slate-400">
                            {tx.lots} Lot @ {formatIDR(tx.price_per_share)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold text-slate-300">
                          {formatIDR(tx.total_amount)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(tx.transaction_date).toLocaleDateString(
                            "id-ID"
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-6">
                    Belum ada transaksi tercatat.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800">
              <Link
                href="/portfolio"
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-2 border border-slate-700 transition"
              >
                <PlusCircle className="w-4 h-4 text-blue-400" />
                Catat Transaksi Manual
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
