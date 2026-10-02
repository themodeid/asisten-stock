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

 <main className="p-6 md:p-8 space-y-5 max-w-7xl w-full mx-auto">
 {/* Multi-Vault & Execution Ledger Filter Bar (GitHub Primer Box) */}
 <div className="p-4 rounded-md bg-[#161b22] border border-[#30363d] shadow-sm space-y-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2.5">
 <div className="p-1.5 rounded-md bg-[#21262d] border border-[#30363d] text-[#58a6ff]">
 <Wallet className="w-4 h-4" />
 </div>
 <div>
 <div className="flex items-center gap-2">
 <h3 className="text-xs font-semibold text-[#f0f6fc] tracking-tight">
 Multi-Vault Execution Ledger
 </h3>
 <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium bg-[#21262d] text-[#8b949e] border border-[#30363d]">
 {wallets.length} vaults
 </span>
 </div>
 <p className="text-[11px] text-[#8b949e]">
 Filter histori order dan transaksi institusional per entitas vault atau konsolidasi agregat.
 </p>
 </div>
 </div>
 </div>

 <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
 {/* Pill: Semua Dompet (Total Konsolidasi) */}
 <button
 type="button"
 onClick={() => setSelectedWalletId("all")}
 className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 border transition shrink-0 ${
 selectedWalletId === "all"
 ? "bg-[#21262d] text-[#f0f6fc] border-[#8b949e] font-semibold"
 : "bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#161b22]"
 }`}
 >
 <Globe className="w-3.5 h-3.5 text-[#58a6ff]" />
 <span>Semua Vault</span>
 <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${selectedWalletId === "all" ? "bg-[#30363d] text-[#f0f6fc]" : "bg-[#21262d] text-[#8b949e]"}`}>
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
 className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 border transition shrink-0 ${
 isSelected
 ? "bg-[#21262d] text-[#f0f6fc] border-[#8b949e] font-semibold"
 : "bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#161b22]"
 }`}
 >
 <Building2 className={`w-3.5 h-3.5 ${isSelected ? "text-[#58a6ff]" : "text-[#8b949e]"}`} />
 <span className="capitalize">{w.name}</span>
 </button>
 );
 })}
 </div>
 </div>

 {/* Top Metric Summary Cards (GitHub Primer Style) */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <div className="p-4 rounded-md bg-[#161b22] border border-[#30363d] shadow-sm flex items-center justify-between">
 <div>
 <div className="text-[11px] font-medium text-[#8b949e]">Total Order Tercatat</div>
 <div className="text-xl font-bold font-mono tabular-nums text-[#f0f6fc] mt-1">{stats.count} Eksekusi</div>
 </div>
 <Clock className="w-6 h-6 text-[#8b949e]" />
 </div>

 <div className="p-4 rounded-md bg-[#161b22] border border-[#30363d] shadow-sm flex items-center justify-between">
 <div>
 <div className="text-[11px] font-medium text-[#8b949e]">Akumulasi Pembelian (BUY)</div>
 <div className="text-xl font-bold font-mono tabular-nums text-[#3fb950] mt-1">{formatIDR(stats.totalBuy)}</div>
 </div>
 <TrendingDown className="w-6 h-6 text-[#238636]" />
 </div>

 <div className="p-4 rounded-md bg-[#161b22] border border-[#30363d] shadow-sm flex items-center justify-between">
 <div>
 <div className="text-[11px] font-medium text-[#8b949e]">Realisasi Penjualan (SELL)</div>
 <div className="text-xl font-bold font-mono tabular-nums text-[#d29922] mt-1">{formatIDR(stats.totalSell)}</div>
 </div>
 <TrendingUp className="w-6 h-6 text-[#9e6a03]" />
 </div>
 </div>

 {/* Filter Controls Bar (GitHub Toolbar Style) */}
 <div className="bg-[#161b22] border border-[#30363d] rounded-md p-4 space-y-3.5 shadow-sm">
 {/* Row 1: Time Range Presets */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#30363d] pb-3.5">
 <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
 <span className="text-[#8b949e] text-xs font-semibold mr-1 flex items-center gap-1">
 <Calendar className="w-3.5 h-3.5 text-[#58a6ff]" /> Rentang:
 </span>
 {[
 { id: "ALL", label: "All" },
 { id: "TODAY", label: "Hari Ini" },
 { id: "7D", label: "7 Hari" },
 { id: "30D", label: "30 Hari" },
 { id: "THIS_MONTH", label: "Bulan Ini" },
 { id: "YTD", label: "YTD" },
 { id: "CUSTOM", label: "Kustom..." },
 ].map((t) => (
 <button
 key={t.id}
 type="button"
 onClick={() => setTimeRange(t.id as TimeRangeFilter)}
 className={`px-2.5 py-1 rounded-md text-xs font-medium transition whitespace-nowrap border ${
 timeRange === t.id
 ? "bg-[#21262d] text-[#f0f6fc] border-[#8b949e] font-semibold"
 : "bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]"
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
 className="px-2.5 py-1 rounded-md bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] text-xs font-medium transition flex items-center gap-1.5"
 title="Ubah Urutan Waktu"
 >
 <ArrowUpDown className="w-3.5 h-3.5 text-[#58a6ff]" />
 {sortOrder === "DESC" ? "Waktu: Terbaru" : "Waktu: Terlama"}
 </button>

 <button
 onClick={() => fetchTransactions()}
 className="p-1.5 rounded-md bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] transition"
 title="Refresh Riwayat"
 >
 <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#58a6ff]" : ""}`} />
 </button>
 </div>
 </div>

 {/* Row 2: Custom Date Picker Inputs (Shown if CUSTOM selected) */}
 {timeRange === "CUSTOM" && (
 <div className="p-3 rounded-md bg-[#0d1117] border border-[#30363d] flex flex-wrap items-center gap-4 text-xs">
 <span className="font-semibold text-[#c9d1d9]">Rentang Tanggal:</span>
 <div className="flex items-center gap-2">
 <span className="text-[#8b949e]">Dari:</span>
 <input
 type="date"
 value={startDate}
 onChange={(e) => setStartDate(e.target.value)}
 className="bg-[#161b22] border border-[#30363d] text-[#f0f6fc] rounded-md px-2.5 py-1 focus:outline-none focus:border-[#58a6ff]"
 />
 </div>
 <div className="flex items-center gap-2">
 <span className="text-[#8b949e]">Sampai:</span>
 <input
 type="date"
 value={endDate}
 onChange={(e) => setEndDate(e.target.value)}
 className="bg-[#161b22] border border-[#30363d] text-[#f0f6fc] rounded-md px-2.5 py-1 focus:outline-none focus:border-[#58a6ff]"
 />
 </div>
 {(startDate || endDate) && (
 <button
 type="button"
 onClick={() => {
 setStartDate("");
 setEndDate("");
 }}
 className="text-[#8b949e] hover:text-[#f85149] underline ml-auto text-xs"
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
 <Filter className="w-3.5 h-3.5 text-[#8b949e]" />
 <input
 type="text"
 placeholder="Filter ticker (BBCA, BTC, VT)..."
 value={filterTicker}
 onChange={(e) => setFilterTicker(e.target.value)}
 className="bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] text-xs rounded-md px-3 py-1.5 focus:outline-none focus:border-[#58a6ff] w-full sm:w-60"
 />
 </div>

 {/* Asset Class Filter */}
 <select
 value={filterAsset}
 onChange={(e) => setFilterAsset(e.target.value as any)}
 className="bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] text-xs rounded-md px-3 py-1.5 focus:outline-none focus:border-[#58a6ff] w-full sm:w-auto"
 >
 <option value="ALL">Semua Kelas Aset</option>
 <option value="STOCK">Saham (IDX)</option>
 <option value="CRYPTO">Kripto (Crypto)</option>
 <option value="ETF">ETF Global</option>
 <option value="BOND">Obligasi / SBN</option>
 <option value="GOLD">Emas Fisik</option>
 <option value="MUTUAL_FUND">Reksadana</option>
 </select>
 </div>

 <div className="flex items-center gap-1.5 w-full sm:w-auto">
 {(["ALL", "BUY", "SELL"] as const).map((t) => (
 <button
 key={t}
 onClick={() => setFilterType(t)}
 className={`px-3 py-1 rounded-md text-xs font-medium transition border ${
 filterType === t
 ? "bg-[#21262d] text-[#f0f6fc] border-[#8b949e] font-semibold"
 : "bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:bg-[#21262d] hover:text-[#c9d1d9]"
 }`}
 >
 {t === "ALL" ? "Semua Order" : t === "BUY" ? "Beli (BUY)" : "Jual (SELL)"}
 </button>
 ))}
 </div>
 </div>
 </div>

 {/* Transactions Table (GitHub Primer Box Ledger) */}
 <div className="bg-[#0d1117] border border-[#30363d] rounded-md overflow-hidden shadow-sm">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead className="bg-[#161b22] border-b border-[#30363d] text-[11px] text-[#8b949e] font-semibold tracking-wider font-mono">
 <tr>
 <th className="py-2.5 px-4">TIMESTAMP</th>
 <th className="py-2.5 px-3">SIDE</th>
 <th className="py-2.5 px-4">INSTRUMENT</th>
 <th className="py-2.5 px-3">VAULT</th>
 <th className="py-2.5 px-3">FILL QTY</th>
 <th className="py-2.5 px-3">AVG PRICE</th>
 <th className="py-2.5 px-4">SETTLEMENT VALUE</th>
 <th className="py-2.5 px-4">MEMO</th>
 <th className="py-2.5 px-4 text-right">ACTION</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#21262d] font-mono">
 {filtered.length > 0 ? (
 filtered.map((tx) => {
 const aType = tx.asset_type || "STOCK";
 const isStock = aType === "STOCK";
 const txDate = new Date(tx.transaction_date || tx.created_at);

 return (
 <tr key={tx.id} className="hover:bg-[#161b22]/60 transition-colors">
 <td className="py-3 px-4 text-[#c9d1d9] text-xs whitespace-nowrap">
 <div className="font-semibold text-[#f0f6fc]">
 {txDate.toLocaleDateString("id-ID", {
 day: "numeric",
 month: "short",
 year: "numeric",
 })}
 </div>
 <div className="text-[10px] text-[#8b949e] mt-0.5">
 {txDate.toLocaleTimeString("id-ID", {
 hour: "2-digit",
 minute: "2-digit",
 })} WIB
 </div>
 </td>
 <td className="py-3 px-3">
 <span
 className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wide ${
 tx.type === "BUY"
 ? "bg-[#238636]/20 border border-[#238636]/40 text-[#3fb950]"
 : "bg-[#da3633]/20 border border-[#da3633]/40 text-[#f85149]"
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
 <td className="py-3 px-4">
 <div className="flex items-center gap-2 font-sans">
 <span
 className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-medium border ${
 aType === "ETF"
 ? "bg-[#58a6ff]/10 text-[#58a6ff] border-[#58a6ff]/30"
 : aType === "CRYPTO"
 ? "bg-[#d29922]/10 text-[#d29922] border-[#d29922]/30"
 : aType === "GOLD"
 ? "bg-[#e3b341]/10 text-[#e3b341] border-[#e3b341]/30"
 : "bg-[#21262d] text-[#c9d1d9] border-[#30363d]"
 }`}
 >
 {aType}
 </span>
 <span className="font-bold text-[#f0f6fc] font-mono">{tx.ticker}</span>
 </div>
 </td>
 <td className="py-3 px-3">
 {tx.wallet_name ? (
 <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#161b22] border border-[#30363d] text-[#c9d1d9] capitalize">
 <Building2 className="w-3 h-3 text-[#58a6ff]" />
 {tx.wallet_name}
 </span>
 ) : (
 <span className="text-[#8b949e] text-[11px]">-</span>
 )}
 </td>
 <td className="py-3 px-3 text-[#c9d1d9] tabular-nums">
 {isStock ? (
 <>
 <span className="font-semibold text-[#f0f6fc]">{tx.lots}</span>{" "}
 <span className="text-[10px] text-[#8b949e]">Lot</span>{" "}
 <span className="text-[10px] text-[#8b949e]">
 ({tx.shares || tx.quantity} lbr)
 </span>
 </>
 ) : (
 <>
 <span className="font-semibold text-[#f0f6fc]">{tx.quantity || tx.shares}</span>{" "}
 <span className="text-[#8b949e] text-[10px]">
 {aType === "GOLD" ? "gram" : "unit"}
 </span>
 </>
 )}
 </td>
 <td className="py-3 px-3 font-mono font-medium text-[#c9d1d9] tabular-nums">
 {formatPriceVal(tx.price_per_share, tx.currency)}
 </td>
 <td className="py-3 px-4 font-mono font-bold text-[#f0f6fc] tabular-nums">
 {formatIDR(tx.currency === "USD" ? tx.total_amount * fxRate : tx.total_amount)}
 {tx.currency === "USD" && (
 <div className="text-[10px] text-[#8b949e] font-normal">
 ${Number(tx.total_amount).toLocaleString(undefined, {
 minimumFractionDigits: 2,
 maximumFractionDigits: 2,
 })}
 </div>
 )}
 </td>
 <td className="py-3 px-4 text-xs font-sans text-[#8b949e] max-w-[200px] truncate">
 {tx.notes || "-"}
 </td>
 <td className="py-3 px-4 text-right">
 <button
 onClick={() => handleDelete(tx.id)}
 className="p-1 rounded text-[#8b949e] hover:text-[#f85149] transition"
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
 <td colSpan={9} className="text-center py-12 text-[#8b949e] font-sans">
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
