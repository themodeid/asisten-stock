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
        {/* Multi-Vault & Execution Ledger Filter Bar (Sovereign Terminal Style) */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
                    TERMINAL EXECUTION LEDGER &bull; MULTI-VAULT
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                    {wallets.length} VAULTS
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Filter histori order dan transaksi institusional per entitas vault atau konsolidasi agregat.
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
                  ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/25 font-bold ring-1 ring-blue-400/40"
                  : "bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-blue-300" />
              <span>Semua Vault</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${selectedWalletId === "all" ? "bg-blue-700/60 text-white" : "bg-slate-800 text-slate-400"}`}>
                Konsolidasi
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
                      ? "bg-blue-600/20 border-blue-500/50 text-blue-300 shadow-md ring-1 ring-blue-500/30 font-bold"
                      : "bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                  }`}
                >
                  <Building2 className={`w-3.5 h-3.5 ${isSelected ? "text-blue-400" : "text-slate-500"}`} />
                  <span className="capitalize">{w.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Top Metric Summary Cards (Terminal Style) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-lg flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold">Total Order Tercatat</div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-100 mt-1">{stats.count} Eksekusi</div>
            </div>
            <Clock className="w-7 h-7 text-slate-700" />
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-lg flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold">Akumulasi Pembelian (BUY)</div>
              <div className="text-xl font-bold font-mono tabular-nums text-emerald-400 mt-1">{formatIDR(stats.totalBuy)}</div>
            </div>
            <TrendingDown className="w-7 h-7 text-emerald-500/30" />
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-lg flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold">Realisasi Penjualan (SELL)</div>
              <div className="text-xl font-bold font-mono tabular-nums text-amber-400 mt-1">{formatIDR(stats.totalSell)}</div>
            </div>
            <TrendingUp className="w-7 h-7 text-amber-500/30" />
          </div>
        </div>

        {/* Filter Controls Bar (Terminal Console Style) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
          {/* Row 1: Time Range Presets */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 text-xs font-mono font-semibold mr-1 flex items-center gap-1 uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-blue-400" /> TIMEFRAME:
              </span>
              {[
                { id: "ALL", label: "ALL" },
                { id: "TODAY", label: "TODAY" },
                { id: "7D", label: "7D" },
                { id: "30D", label: "30D" },
                { id: "THIS_MONTH", label: "MTD" },
                { id: "YTD", label: "YTD" },
                { id: "CUSTOM", label: "CUSTOM..." },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTimeRange(t.id as TimeRangeFilter)}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold transition whitespace-nowrap ${
                    timeRange === t.id
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 border border-blue-400/30"
                      : "bg-slate-950/70 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
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
                className="px-3 py-1.5 rounded-lg bg-slate-950/70 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono transition flex items-center gap-1.5"
                title="Ubah Urutan Waktu"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-blue-400" />
                {sortOrder === "DESC" ? "TIMESTAMP: DESC" : "TIMESTAMP: ASC"}
              </button>

              <button
                onClick={() => fetchTransactions()}
                className="p-1.5 rounded-lg bg-slate-950/70 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
                title="Refresh Riwayat"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
              </button>
            </div>
          </div>

          {/* Row 2: Custom Date Picker Inputs (Shown if CUSTOM selected) */}
          {timeRange === "CUSTOM" && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center gap-4 text-xs">
              <span className="font-semibold text-slate-300 font-mono">Rentang Kustom:</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono">Dari:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono">Sampai:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="text-slate-400 hover:text-rose-400 underline ml-auto font-mono"
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
                <Filter className="w-4 h-4 text-blue-400" />
                <input
                  type="text"
                  placeholder="FILTER SIMBOL (BBCA, BTC, VT)..."
                  value={filterTicker}
                  onChange={(e) => setFilterTicker(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 w-full sm:w-60 uppercase font-mono"
                />
              </div>

              {/* Asset Class Filter */}
              <select
                value={filterAsset}
                onChange={(e) => setFilterAsset(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 w-full sm:w-auto font-mono"
              >
                <option value="ALL">SEMUA KELAS ASET</option>
                <option value="STOCK">SAHAM (IDX)</option>
                <option value="CRYPTO">KRIPTO (CRYPTO)</option>
                <option value="ETF">ETF GLOBAL</option>
                <option value="BOND">OBLIGASI / SBN</option>
                <option value="GOLD">EMAS</option>
                <option value="MUTUAL_FUND">REKSADANA</option>
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {(["ALL", "BUY", "SELL"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                    filterType === t
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 border border-blue-400/30"
                      : "bg-slate-950/70 text-slate-400 border border-slate-800 hover:text-slate-200"
                  }`}
                >
                  {t === "ALL" ? "SEMUA ORDER" : t === "BUY" ? "BUY (BELI)" : "SELL (JUAL)"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Transactions Table (Sovereign Order Ledger) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider font-mono font-bold">
                <tr>
                  <th className="py-3.5 px-6">TIMESTAMP</th>
                  <th className="py-3.5 px-4">SIDE</th>
                  <th className="py-3.5 px-4">INSTRUMENT</th>
                  <th className="py-3.5 px-4">VAULT</th>
                  <th className="py-3.5 px-4">FILL QTY</th>
                  <th className="py-3.5 px-4">AVG PRICE</th>
                  <th className="py-3.5 px-4">SETTLEMENT VALUE</th>
                  <th className="py-3.5 px-4">MEMO</th>
                  <th className="py-3.5 px-6 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filtered.length > 0 ? (
                  filtered.map((tx) => {
                    const aType = tx.asset_type || "STOCK";
                    const isStock = aType === "STOCK";
                    const txDate = new Date(tx.transaction_date || tx.created_at);

                    return (
                      <tr key={tx.id} className="hover:bg-slate-800/50 transition">
                        <td className="py-3.5 px-6 text-slate-300 text-xs whitespace-nowrap font-mono">
                          <div className="font-bold text-slate-100">
                            {txDate.toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {txDate.toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })} WIB
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold font-mono tracking-wide ${
                              tx.type === "BUY"
                                ? "bg-emerald-950/80 border border-emerald-800/60 text-emerald-400"
                                : "bg-rose-950/80 border border-rose-800/60 text-rose-400"
                            }`}
                          >
                            {tx.type === "BUY" ? (
                              <>
                                <ArrowDownRight className="w-3 h-3" /> BUY
                              </>
                            ) : (
                              <>
                                <ArrowUpRight className="w-3 h-3" /> SELL
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2 font-sans">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${
                                aType === "ETF"
                                  ? "bg-blue-950/60 text-blue-400 border-blue-800/50"
                                  : aType === "CRYPTO"
                                  ? "bg-amber-950/60 text-amber-400 border-amber-800/50"
                                  : aType === "GOLD"
                                  ? "bg-yellow-950/60 text-yellow-400 border-yellow-800/50"
                                  : "bg-cyan-950/60 text-cyan-400 border-cyan-800/50"
                              }`}
                            >
                              {aType}
                            </span>
                            <span className="font-bold text-slate-100 font-mono tracking-tight">{tx.ticker}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {tx.wallet_name ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-950 border border-slate-800 text-slate-300 capitalize">
                              <Building2 className="w-3 h-3 text-blue-400" />
                              {tx.wallet_name}
                            </span>
                          ) : (
                            <span className="text-slate-600 text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-200 tabular-nums">
                          {isStock ? (
                            <>
                              <span className="font-bold">{tx.lots}</span> <span className="text-[10px] text-slate-500">Lot</span>{" "}
                              <span className="text-[10px] text-slate-500">
                                ({tx.shares || tx.quantity} lbr)
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="font-bold">{tx.quantity || tx.shares}</span>{" "}
                              <span className="text-slate-500 text-[10px]">
                                {aType === "GOLD" ? "gram" : "unit"}
                              </span>
                            </>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-200 tabular-nums">
                          {formatPriceVal(tx.price_per_share, tx.currency)}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-100 tabular-nums">
                          {formatIDR(tx.currency === "USD" ? tx.total_amount * fxRate : tx.total_amount)}
                          {tx.currency === "USD" && (
                            <div className="text-[10px] text-slate-500 font-normal">
                              ${Number(tx.total_amount).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-sans text-slate-400 max-w-[200px] truncate">
                          {tx.notes || "-"}
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <button
                            onClick={() => handleDelete(tx.id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 transition"
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
                    <td colSpan={9} className="text-center py-14 text-slate-500 font-sans">
                      {loading
                        ? "Sinkronisasi riwayat eksekusi..."
                        : "Tidak ada transaksi yang cocok dengan filter parameter ini."}
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
