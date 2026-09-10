"use client";

import { useEffect, useState, useMemo } from "react";
import { useFxRate } from "@/services/fxRate";
import Header from "@/components/layout/Header";
import Badge from "@/components/ui/Badge";
import { api, formatIDR } from "@/services/api";
import {
  ArrowDownRight,
  ArrowUpRight,
  Trash2,
  Filter,
  Calendar,
  Clock,
  ArrowUpDown,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
  Globe,
  Building2,
} from "lucide-react";
import { AssetType } from "@/types";

type TimeRangeFilter = "ALL" | "TODAY" | "7D" | "30D" | "THIS_MONTH" | "YTD" | "CUSTOM";

export default function TransactionsPage() {
  const { rate: fxRate } = useFxRate();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTicker, setFilterTicker] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "BUY" | "SELL">("ALL");
  const [filterAsset, setFilterAsset] = useState<"ALL" | AssetType>("ALL");
  
  // Multi-Dompet Filter State
  const [wallets, setWallets] = useState<any[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<number | "all">("all");

  // Time filters & sorting
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"DESC" | "ASC">("DESC");

  const fetchWallets = async () => {
    try {
      const res = await api.get("/portfolio/wallets");
      if (res.data?.data) {
        setWallets(res.data.data);
      }
    } catch (err) {
      console.warn("Failed fetching wallets:", err);
    }
  };

  const fetchTransactions = async (targetWalletId = selectedWalletId) => {
    try {
      setLoading(true);
      const endpoint =
        targetWalletId === "all" || !targetWalletId
          ? "/transactions"
          : `/transactions/${targetWalletId}`;
      const res = await api.get(endpoint);
      if (res.data?.data) {
        setTransactions(res.data.data);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.warn("Failed fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  useEffect(() => {
    fetchTransactions(selectedWalletId);
  }, [selectedWalletId]);

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus catatan transaksi ini?")) return;
    try {
      await api.delete(`/transactions/${id}`);
      fetchTransactions(selectedWalletId);
    } catch (err) {
      alert("Gagal menghapus transaksi");
    }
  };

  // Filter & Sort computation
  const filtered = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

    return transactions
      .filter((tx) => {
        // Ticker filter
        const matchTicker = filterTicker
          ? tx.ticker.toLowerCase().includes(filterTicker.toLowerCase())
          : true;

        // Type filter
        const matchType = filterType === "ALL" ? true : tx.type === filterType;

        // Asset filter
        const matchAsset = filterAsset === "ALL" ? true : (tx.asset_type || "STOCK") === filterAsset;

        // Timeframe filter
        const txTime = new Date(tx.transaction_date || tx.created_at).getTime();
        let matchTime = true;

        if (timeRange === "TODAY") {
          matchTime = txTime >= startOfToday;
        } else if (timeRange === "7D") {
          matchTime = txTime >= sevenDaysAgo;
        } else if (timeRange === "30D") {
          matchTime = txTime >= thirtyDaysAgo;
        } else if (timeRange === "THIS_MONTH") {
          matchTime = txTime >= startOfMonth;
        } else if (timeRange === "YTD") {
          matchTime = txTime >= startOfYear;
        } else if (timeRange === "CUSTOM") {
          if (startDate) {
            const startParsed = new Date(startDate).getTime();
            if (txTime < startParsed) matchTime = false;
          }
          if (endDate) {
            const endParsed = new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1;
            if (txTime > endParsed) matchTime = false;
          }
        }

        return matchTicker && matchType && matchAsset && matchTime;
      })
      .sort((a, b) => {
        const timeA = new Date(a.transaction_date || a.created_at).getTime();
        const timeB = new Date(b.transaction_date || b.created_at).getTime();
        return sortOrder === "DESC" ? timeB - timeA : timeA - timeB;
      });
  }, [transactions, filterTicker, filterType, filterAsset, timeRange, startDate, endDate, sortOrder]);

  // Aggregate stats for current view
  const stats = useMemo(() => {
    let totalBuy = 0;
    let totalSell = 0;
    filtered.forEach((tx) => {
      const val = tx.currency === "USD" ? Number(tx.total_amount || 0) * fxRate : Number(tx.total_amount || 0);
      if (tx.type === "BUY") totalBuy += val;
      if (tx.type === "SELL") totalSell += val;
    });
    return {
      count: filtered.length,
      totalBuy,
      totalSell,
    };
  }, [filtered]);

  const formatPriceVal = (val: number, cur?: string) => {
    if (cur === "USD") return `$${Number(val).toLocaleString()}`;
    return formatIDR(val);
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Riwayat Transaksi Multi-Waktu & Multi-Aset" />

      <main className="p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Multi-Dompet Selector Bar */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wide">
                    Multi-Dompet & Akun Platform
                  </h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
                    {wallets.length} Dompet
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Filter riwayat transaksi berdasarkan dompet atau exchange tertentu.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {/* Pill: Semua Dompet (Total Konsolidasi) */}
            <button
              type="button"
              onClick={() => setSelectedWalletId("all")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition shrink-0 ${
                selectedWalletId === "all"
                  ? "bg-zinc-100 text-zinc-950 border-zinc-200 shadow-md font-bold ring-2 ring-zinc-100/20"
                  : "bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>Semua Dompet</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-medium">
                Total Konsolidasi
              </span>
            </button>

            {/* Individual Wallets */}
            {wallets.map((w: any) => {
              const isSelected = selectedWalletId === w.id;
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setSelectedWalletId(w.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition shrink-0 ${
                    isSelected
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-md ring-2 ring-emerald-500/20 font-bold"
                      : "bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                  }`}
                >
                  <Building2 className={`w-3.5 h-3.5 ${isSelected ? "text-emerald-400" : "text-zinc-500"}`} />
                  <span className="capitalize">{w.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Top Summary Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[11px] text-zinc-400 uppercase font-semibold">Total Transaksi Terpilih</div>
              <div className="text-xl font-bold text-zinc-100 mt-0.5">{stats.count} Transaksi</div>
            </div>
            <Clock className="w-8 h-8 text-zinc-700" />
          </div>

          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[11px] text-zinc-400 uppercase font-semibold">Total Nilai Pembelian (BUY)</div>
              <div className="text-xl font-bold text-emerald-400 mt-0.5">{formatIDR(stats.totalBuy)}</div>
            </div>
            <TrendingDown className="w-8 h-8 text-emerald-950/60" />
          </div>

          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[11px] text-zinc-400 uppercase font-semibold">Total Nilai Penjualan (SELL)</div>
              <div className="text-xl font-bold text-amber-400 mt-0.5">{formatIDR(stats.totalSell)}</div>
            </div>
            <TrendingUp className="w-8 h-8 text-amber-950/60" />
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4 shadow-sm">
          {/* Row 1: Time Range Presets */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-zinc-400 text-xs font-semibold mr-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" /> Periode:
              </span>
              {[
                { id: "ALL", label: "Semua Waktu" },
                { id: "TODAY", label: "Hari Ini" },
                { id: "7D", label: "7 Hari Terakhir" },
                { id: "30D", label: "30 Hari Terakhir" },
                { id: "THIS_MONTH", label: "Bulan Ini" },
                { id: "YTD", label: "Tahun Ini (YTD)" },
                { id: "CUSTOM", label: "Rentang Kustom..." },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTimeRange(t.id as TimeRangeFilter)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
                    timeRange === t.id
                      ? "bg-zinc-100 text-zinc-900 font-bold shadow-sm"
                      : "bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Sort Order Toggle & Refresh */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === "DESC" ? "ASC" : "DESC")}
                className="px-3 py-1.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/80 text-xs font-medium transition flex items-center gap-1.5"
                title="Ubah Urutan Waktu"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                {sortOrder === "DESC" ? "Waktu: Terbaru &rarr; Terlama" : "Waktu: Terlama &rarr; Terbaru"}
              </button>

              <button
                onClick={() => fetchTransactions()}
                className="p-1.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/80 transition"
                title="Refresh Riwayat"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Row 2: Custom Date Picker Inputs (Shown if CUSTOM selected) */}
          {timeRange === "CUSTOM" && (
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-wrap items-center gap-4 text-xs">
              <span className="font-semibold text-zinc-300">Pilih Rentang Waktu:</span>
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">Dari:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-zinc-400"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">Sampai:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-zinc-400"
                />
              </div>
              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="text-zinc-400 hover:text-red-400 underline ml-auto"
                >
                  Reset Tanggal
                </button>
              )}
            </div>
          )}

          {/* Row 3: Ticker, Asset Class & Transaction Type Filters */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Cari Simbol (BBCA, BTC, VT)..."
                  value={filterTicker}
                  onChange={(e) => setFilterTicker(e.target.value)}
                  className="bg-zinc-950 border border-zinc-700 text-zinc-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-400 w-full sm:w-56 uppercase"
                />
              </div>

              {/* Asset Class Filter */}
              <select
                value={filterAsset}
                onChange={(e) => setFilterAsset(e.target.value as any)}
                className="bg-zinc-950 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-400 w-full sm:w-auto"
              >
                <option value="ALL">Semua Kelas Aset</option>
                <option value="STOCK">Saham (IDX)</option>
                <option value="CRYPTO">Kripto (Crypto)</option>
                <option value="ETF">ETF Global</option>
                <option value="BOND">Obligasi / SBN</option>
                <option value="GOLD">Emas</option>
                <option value="MUTUAL_FUND">Reksadana</option>
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {(["ALL", "BUY", "SELL"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    filterType === t
                      ? "bg-zinc-100 text-zinc-900 shadow-sm"
                      : "bg-zinc-850 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {t === "ALL" ? "SEMUA TIPE" : t === "BUY" ? "BELI (BUY)" : "JUAL (SELL)"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-850 border-b border-zinc-800 text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-6">TANGGAL & WAKTU</th>
                  <th className="py-3.5 px-4">TIPE</th>
                  <th className="py-3.5 px-4">KELAS & ASET</th>
                  <th className="py-3.5 px-4">DOMPET</th>
                  <th className="py-3.5 px-4">KUANTITAS</th>
                  <th className="py-3.5 px-4">HARGA / UNIT</th>
                  <th className="py-3.5 px-4">TOTAL NILAI</th>
                  <th className="py-3.5 px-4">CATATAN</th>
                  <th className="py-3.5 px-6 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {filtered.length > 0 ? (
                  filtered.map((tx) => {
                    const aType = tx.asset_type || "STOCK";
                    const isStock = aType === "STOCK";
                    const txDate = new Date(tx.transaction_date || tx.created_at);

                    return (
                      <tr key={tx.id} className="hover:bg-zinc-800/40 transition">
                        <td className="py-3.5 px-6 text-zinc-300 text-xs whitespace-nowrap">
                          <div className="font-semibold text-zinc-100">
                            {txDate.toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                            {txDate.toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })} WIB
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant={tx.type === "BUY" ? "success" : "danger"}>
                            {tx.type === "BUY" ? (
                              <span className="flex items-center gap-1">
                                <ArrowDownRight className="w-3 h-3" /> BUY
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <ArrowUpRight className="w-3 h-3" /> SELL
                              </span>
                            )}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                              {aType}
                            </span>
                            <span className="font-bold text-zinc-100">{tx.ticker}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {tx.wallet_name ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 capitalize">
                              <Building2 className="w-3 h-3 text-emerald-400" />
                              {tx.wallet_name}
                            </span>
                          ) : (
                            <span className="text-zinc-500 text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-zinc-200">
                          {isStock ? (
                            <>
                              {tx.lots} Lot{" "}
                              <span className="text-[10px] text-zinc-500">
                                ({tx.shares || tx.quantity} lbr)
                              </span>
                            </>
                          ) : (
                            <>
                              {tx.quantity || tx.shares}{" "}
                              <span className="text-zinc-500 text-[10px]">
                                {aType === "GOLD" ? "gram" : "unit"}
                              </span>
                            </>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-zinc-200">
                          {formatPriceVal(tx.price_per_share, tx.currency)}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-zinc-100">
                          {formatIDR(tx.currency === "USD" ? tx.total_amount * fxRate : tx.total_amount)}
                          {tx.currency === "USD" && (
                            <div className="text-[10px] text-zinc-500 font-normal">
                              ${Number(tx.total_amount).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-zinc-400 max-w-[200px] truncate">
                          {tx.notes || "-"}
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <button
                            onClick={() => handleDelete(tx.id)}
                            className="p-1 rounded-md text-zinc-500 hover:text-red-400 transition"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-zinc-500">
                      {loading
                        ? "Memuat riwayat transaksi..."
                        : "Tidak ada transaksi yang cocok dengan filter waktu atau simbol ini."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
