"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/layout/Header";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { api, formatIDR } from "@/services/api";
import {
 Plus,
 Trash2,
 Bell,
 TrendingUp,
 Sparkles,
 Radar,
 Percent,
 CheckCircle2,
 AlertTriangle,
 ArrowUpRight,
 ArrowDownRight,
 Layers,
 Filter,
 RefreshCw,
 ExternalLink,
 Landmark,
 Building2,
 Globe,
 Coins,
} from "lucide-react";
import { AssetType } from "@/types";

export default function WatchlistPage() {
 const { user } = useAuth();
 const [activeTab, setActiveTab] = useState<"WATCHLIST" | "DIP_RADAR">("WATCHLIST");

 // Watchlist state
 const [watchlist, setWatchlist] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

 // Form states
 const [ticker, setTicker] = useState("");
 const [targetBuy, setTargetBuy] = useState("");
 const [targetSell, setTargetSell] = useState("");
 const [notes, setNotes] = useState("");

 // Alert form states
 const [alertTicker, setAlertTicker] = useState("");
 const [alertTargetPrice, setAlertTargetPrice] = useState("");
 const [alertCondition, setAlertCondition] = useState<"ABOVE" | "BELOW">("ABOVE");

 // Dip Radar state
 const [dipRadarItems, setDipRadarItems] = useState<any[]>([]);
 const [dipLoading, setDipLoading] = useState(false);
 const [radarFilterAsset, setRadarFilterAsset] = useState<"ALL" | "STOCK" | "STOCK_US" | "ETF" | "CRYPTO">("ALL");
 const [watchlistCategory, setWatchlistCategory] = useState<"ALL" | "US" | "IDX" | "CRYPTO">("ALL");
 const [targetCurrency, setTargetCurrency] = useState<"USD" | "IDR">("USD");
 const [onlyStrongAccumulate, setOnlyStrongAccumulate] = useState(false);

 const fetchWatchlist = async () => {
 try {
 setLoading(true);
 const res = await api.get(`/watchlist/${user?.id || 1}`);
 if (res.data?.data) {
 setWatchlist(res.data.data);
 }
 } catch (err) {
 console.warn("Failed fetching watchlist:", err);
 } finally {
 setLoading(false);
 }
 };

 const fetchDipRadar = async () => {
 try {
 setDipLoading(true);
 const res = await api.get("/watchlist/screener/dip-radar");
 if (res.data?.data) {
 setDipRadarItems(res.data.data);
 }
 } catch (err) {
 console.warn("Failed fetching dip radar:", err);
 } finally {
 setDipLoading(false);
 }
 };

 useEffect(() => {
 fetchWatchlist();
 }, []);

 useEffect(() => {
 if (activeTab === "DIP_RADAR" && dipRadarItems.length === 0) {
 fetchDipRadar();
 }
 }, [activeTab]);

 const handleAddWatchlist = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!ticker) return;
 try {
 await api.post("/watchlist", {
 user_id: user?.id || 1,
 ticker,
 target_buy_price: targetBuy ? Number(targetBuy) : undefined,
 target_sell_price: targetSell ? Number(targetSell) : undefined,
 notes,
 });
 setIsModalOpen(false);
 setTicker("");
 setTargetBuy("");
 setTargetSell("");
 setNotes("");
 fetchWatchlist();
 } catch (err) {
 alert("Gagal menambahkan ke watchlist");
 }
 };

 const handleCreateAlert = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!alertTicker || !alertTargetPrice) return;
 try {
 await api.post("/watchlist/alert", {
 user_id: user?.id || 1,
 ticker: alertTicker,
 target_price: Number(alertTargetPrice),
 condition: alertCondition,
 });
 setIsAlertModalOpen(false);
 alert(`Alert untuk ${alertTicker} berhasil dipasang! Bot Telegram akan memberi notifikasi saat target tercapai.`);
 } catch (err) {
 alert("Gagal memasang price alert");
 }
 };

 const handleDelete = async (t: string) => {
 if (!confirm(`Hapus ${t} dari watchlist?`)) return;
 try {
 await api.delete(`/watchlist/${t}?userId=${user?.id || 1}`);
 fetchWatchlist();
 } catch (err) {
 alert("Gagal menghapus dari watchlist");
 }
 };

 const filteredWatchlist = useMemo(() => {
 return watchlist.filter((item) => {
 if (watchlistCategory === "ALL") return true;
 const isIdx = item.ticker?.endsWith(".JK") || item.currency === "IDR";
 const isCrypto = item.ticker?.includes("-USD") || item.asset_type === "CRYPTO";
 const isUs = !isIdx && !isCrypto;
 if (watchlistCategory === "US") return isUs;
 if (watchlistCategory === "IDX") return isIdx;
 if (watchlistCategory === "CRYPTO") return isCrypto;
 return true;
 });
 }, [watchlist, watchlistCategory]);

 const filteredRadarItems = useMemo(() => {
 return dipRadarItems.filter((item) => {
 if (radarFilterAsset !== "ALL") {
 if (radarFilterAsset === "STOCK_US") {
 if (item.currency !== "USD" || item.asset_type !== "STOCK") return false;
 } else if (radarFilterAsset === "STOCK") {
 if (item.currency === "USD" || item.asset_type !== "STOCK") return false;
 } else if (item.asset_type !== radarFilterAsset) {
 return false;
 }
 }
 if (onlyStrongAccumulate && item.buy_confidence_score < 70) return false;
 return true;
 });
 }, [dipRadarItems, radarFilterAsset, onlyStrongAccumulate]);

 const formatPrice = (price: number, cur?: string) => {
 if (cur === "USD") {
 return `$${Number(price || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
 }
 return formatIDR(price || 0);
 };

 return (
 <div className="flex-1 flex flex-col">
 <Header title="Watchlist & Radar Aset Diskon (AI Screener)" />

 <main className="p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
 {/* Primary View Switcher */}
 <div className="flex border-b border-[#30363d] gap-6 text-sm font-medium">
 <button
 onClick={() => setActiveTab("WATCHLIST")}
 className={`pb-3 flex items-center gap-2 border-b-2 transition ${
 activeTab === "WATCHLIST"
 ? "border-zinc-100 text-[#f0f6fc] font-semibold"
 : "border-transparent text-[#8b949e] hover:text-[#c9d1d9]"
 }`}
 >
 <Layers className="w-4 h-4" />
 Daftar Pantau & Price Alerts ({watchlist.length})
 </button>

 <button
 onClick={() => setActiveTab("DIP_RADAR")}
 className={`pb-3 flex items-center gap-2 border-b-2 transition ${
 activeTab === "DIP_RADAR"
 ? "border-zinc-100 text-[#f0f6fc] font-semibold"
 : "border-transparent text-[#8b949e] hover:text-[#c9d1d9]"
 }`}
 >
 <Radar className="w-4 h-4 text-[#3fb950]" />
 Radar Aset Diskon (AI Dip Screener)
 <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#238636]/15 text-[#3fb950] font-bold border border-[#238636]/40">
 Graham & Buffett AI
 </span>
 </button>
 </div>

 {/* TAB 1: WATCHLIST & ALERTS */}
 {activeTab === "WATCHLIST" && (
 <div className="space-y-6">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h2 className="text-base font-semibold text-[#f0f6fc]">
 Daftar Pantau Saham & Aset Kustom
 </h2>
 <p className="text-xs text-[#8b949e] mt-0.5">
 Pantau emiten potensial dan aktifkan notifikasi otomatis ke Telegram saat menyentuh target beli/jual.
 </p>
 </div>

 <div className="flex items-center gap-3">
 <button
 onClick={() => setIsAlertModalOpen(true)}
 className="px-3.5 py-2 rounded-md bg-[#161b22] hover:bg-[#21262d] text-[#c9d1d9] border border-[#30363d] text-xs font-medium transition flex items-center gap-2"
 >
 <Bell className="w-3.5 h-3.5 text-[#c9d1d9]" /> Pasang Price Alert
 </button>
 <button
 onClick={() => setIsModalOpen(true)}
 className="px-4 py-2 rounded-md bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold shadow-[0_1px_0_rgba(27,31,36,0.1)] transition flex items-center gap-2 border border-[rgba(240,246,252,0.1)] active:scale-[0.98]"
 >
 <Plus className="w-4 h-4 text-zinc-900" /> Tambah Emiten
 </button>
 </div>
 </div>

 {/* Watchlist Market Filters */}
 <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
 {[
 { key: "ALL", label: `Semua Aset (${watchlist.length})`, icon: Layers },
 { key: "US", label: "Saham AS & Global", icon: Landmark },
 { key: "IDX", label: "Saham IDX", icon: Building2 },
 { key: "CRYPTO", label: "Kripto", icon: Coins },
 ].map((f) => {
 const IconComp = f.icon;
 return (
 <button
 key={f.key}
 type="button"
 onClick={() => setWatchlistCategory(f.key as any)}
 className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition border ${
 watchlistCategory === f.key
 ? "bg-white text-zinc-950 border-white font-bold shadow-sm"
 : "bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:text-[#f0f6fc]"
 }`}
 >
 <IconComp className="w-3.5 h-3.5" />
 {f.label}
 </button>
 );
 })}
 </div>

 {/* Watchlist Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {filteredWatchlist.length > 0 ? (
 filteredWatchlist.map((item) => {
 const isUp = (item.day_change_percent || 0) >= 0;
 const itemCur = item.currency || (item.ticker.endsWith(".JK") ? "IDR" : "USD");
 const isUs = !item.ticker.endsWith(".JK") && !item.ticker.includes("-USD") && item.asset_type !== "CRYPTO";
 const isCrypto = item.ticker.includes("-USD") || item.asset_type === "CRYPTO";

 return (
 <div
 key={item.id}
 className="bg-[#161b22] border border-[#30363d] rounded-md p-5 hover:border-[#8b949e] transition relative flex flex-col justify-between shadow-sm"
 >
 <div>
 <div className="flex items-start justify-between">
 <div>
 <div className="flex items-center gap-2">
 <span className="text-base">
 {isUs ? "🇺🇸" : isCrypto ? "🪙" : "🇮🇩"}
 </span>
 <h3 className="text-lg font-bold text-[#f0f6fc]">
 {item.ticker}
 </h3>
 <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#161b22] text-[#8b949e] border border-[#30363d]">
 {itemCur}
 </span>
 </div>
 <div className="text-xs text-[#8b949e] truncate max-w-[200px] mt-0.5">
 {item.company_name}
 </div>
 </div>
 <button
 onClick={() => handleDelete(item.ticker)}
 className="text-[#8b949e] hover:text-[#f85149] transition p-1"
 title="Hapus dari watchlist"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>

 <div className="mt-4 flex items-baseline gap-2">
 <span className="text-2xl font-black text-[#f0f6fc] font-mono">
 {formatPrice(item.current_price || 0, itemCur)}
 </span>
 <Badge variant={isUp ? "success" : "danger"}>
 {isUp ? "+" : ""}
 {item.day_change_percent}%
 </Badge>
 </div>

 {/* Price Targets */}
 <div className="mt-4 pt-3 border-t border-[#30363d]/80 grid grid-cols-2 gap-2 text-xs">
 <div>
 <span className="text-[10px] text-[#8b949e] uppercase font-semibold">Target Beli</span>
 <div className="font-semibold text-[#3fb950] mt-0.5 font-mono">
 {item.target_buy_price ? formatPrice(item.target_buy_price, itemCur) : "-"}
 </div>
 </div>
 <div>
 <span className="text-[10px] text-[#8b949e] uppercase font-semibold">Target Jual</span>
 <div className="font-semibold text-[#d29922] mt-0.5 font-mono">
 {item.target_sell_price ? formatPrice(item.target_sell_price, itemCur) : "-"}
 </div>
 </div>
 </div>

 {item.notes && (
 <div className="mt-3 text-[11px] text-[#8b949e] italic bg-[#0d1117]/60 p-2 rounded-md border border-[#30363d]/60">
 &ldquo;{item.notes}&rdquo;
 </div>
 )}
 </div>

 <div className="mt-4 pt-3 border-t border-[#30363d] flex items-center justify-between text-[11px]">
 <button
 onClick={() => {
 setAlertTicker(item.ticker);
 setAlertTargetPrice(String(item.target_buy_price || item.current_price || ""));
 setIsAlertModalOpen(true);
 }}
 className="text-[#8b949e] hover:text-[#c9d1d9] flex items-center gap-1 font-medium transition"
 >
 <Bell className="w-3 h-3 text-[#8b949e]" /> Atur Alert
 </button>
 <span className="text-[#8b949e] text-[10px]">
 Update Live
 </span>
 </div>
 </div>
 );
 })
 ) : (
 <div className="col-span-full py-12 text-center text-[#8b949e] text-xs">
 {loading ? "Memuat watchlist..." : "Belum ada emiten di watchlist. Tambahkan emiten favorit Anda!"}
 </div>
 )}
 </div>
 </div>
 )}

 {/* TAB 2: AI DIP RADAR & VALUE SCREENER */}
 {activeTab === "DIP_RADAR" && (
 <div className="space-y-6">
 {/* Header & Filter Controls */}
 <div className="bg-[#161b22] border border-[#30363d] rounded-md p-5 shadow-sm space-y-4">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <h3 className="text-base font-bold text-[#f0f6fc] flex items-center gap-2">
 <Radar className="w-5 h-5 text-[#3fb950]" />
 Radar Aset Diskon & Value Screener
 </h3>
 <p className="text-xs text-[#8b949e] mt-1 max-w-3xl leading-relaxed">
 AI memindai saham Blue-Chip IHSG, ETF Global, dan Kripto untuk menemukan aset berfundamental kuat yang posisinya berada di area bawah 52-Week Range (Benjamin Graham Margin of Safety & Warren Buffett ROE Filters).
 </p>
 </div>

 <button
 onClick={fetchDipRadar}
 disabled={dipLoading}
 className="px-3.5 py-2 rounded-md bg-[#161b22] hover:bg-[#21262d] text-[#c9d1d9] border border-[#30363d] text-xs font-semibold transition flex items-center gap-1.5 shrink-0"
 >
 <RefreshCw className={`w-3.5 h-3.5 ${dipLoading ? "animate-spin" : ""}`} />
 {dipLoading ? "Memindai Pasar..." : "Scan Ulang Pasar"}
 </button>
 </div>

 {/* Filters Bar */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#30363d]/80">
 <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
 {[
 { key: "ALL", label: "SEMUA INSTRUMEN", icon: Layers },
 { key: "STOCK_US", label: "SAHAM AS", icon: Landmark },
 { key: "STOCK", label: "SAHAM IDX", icon: Building2 },
 { key: "ETF", label: "GLOBAL ETF", icon: Globe },
 { key: "CRYPTO", label: "KRIPTO", icon: Coins },
 ].map((tab) => {
 const IconComp = tab.icon;
 return (
 <button
 key={tab.key}
 onClick={() => setRadarFilterAsset(tab.key as any)}
 className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition whitespace-nowrap ${
 radarFilterAsset === tab.key
 ? "bg-zinc-100 text-zinc-900 font-bold shadow-sm"
 : "bg-[#161b22] border border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9]"
 }`}
 >
 <IconComp className="w-3.5 h-3.5" />
 {tab.label}
 </button>
 );
 })}
 </div>

 <label className="flex items-center gap-2 cursor-pointer text-xs text-[#c9d1d9] select-none">
 <input
 type="checkbox"
 checked={onlyStrongAccumulate}
 onChange={(e) => setOnlyStrongAccumulate(e.target.checked)}
 className="rounded bg-[#0d1117] border-[#30363d] text-[#3fb950] focus:ring-0"
 />
 <span>Hanya Peluang Emas (Score &ge; 70%)</span>
 </label>
 </div>
 </div>

 {/* Dip Radar Cards Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {filteredRadarItems.length > 0 ? (
 filteredRadarItems.map((item) => {
 const isStrong = item.recommendation_tag === "STRONG_ACCUMULATE";
 const isModerate = item.recommendation_tag === "MODERATE_BUY";

 return (
 <div
 key={item.ticker}
 className={`rounded-md p-5 border transition flex flex-col justify-between shadow-sm ${
 isStrong
 ? "bg-[#161b22] border-[#238636]/40 shadow-[0_0_25px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30"
 : "bg-[#161b22] border-[#30363d] hover:border-[#8b949e]"
 }`}
 >
 <div>
 {/* Header card */}
 <div className="flex items-start justify-between">
 <div>
 <div className="flex items-center gap-2">
 <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#161b22] text-[#c9d1d9] border border-[#30363d]/60">
 {item.asset_type}
 </span>
 <h3 className="text-lg font-bold text-[#f0f6fc]">{item.ticker}</h3>
 </div>
 <div className="text-xs text-[#8b949e] truncate max-w-[200px] mt-0.5">
 {item.name}
 </div>
 </div>

 {/* Buy Confidence Gauge */}
 <div className="text-right">
 <div className="text-[10px] text-[#8b949e] uppercase font-semibold">
 Confidence
 </div>
 <div className={`text-lg font-black ${
 isStrong ? "text-[#3fb950]" : isModerate ? "text-[#d29922]" : "text-[#8b949e]"
 }`}>
 {item.buy_confidence_score}%
 </div>
 </div>
 </div>

 {/* Live Price & Tag */}
 <div className="mt-4 flex items-center justify-between">
 <div>
 <span className="text-xl font-black text-[#f0f6fc]">
 {formatPrice(item.current_price, item.currency)}
 </span>
 </div>
 <span
 className={`px-2 py-0.5 rounded text-[10px] font-bold ${
 isStrong
 ? "bg-[#238636]/15 text-[#3fb950] border border-[#238636]/40"
 : isModerate
 ? "bg-[#d29922]/15 text-[#d29922] border border-[#d29922]/40"
 : "bg-[#161b22] text-[#8b949e] border border-[#30363d]"
 }`}
 >
 {isStrong ? "STRONG ACCUMULATE" : isModerate ? "MODERATE BUY" : "WAIT FOR DIP"}
 </span>
 </div>

 {/* 52-Week Range Visual Progress Bar */}
 <div className="mt-4 space-y-1.5">
 <div className="flex justify-between text-[10px] text-[#8b949e]">
 <span>52W Low: {formatPrice(item.fifty_two_week_low, item.currency)}</span>
 <span className="font-semibold text-[#c9d1d9]">
 Posisi: {item.fifty_two_week_position_percent}%
 </span>
 <span>52W High: {formatPrice(item.fifty_two_week_high, item.currency)}</span>
 </div>
 <div className="w-full h-2 rounded-full bg-[#161b22] relative overflow-hidden">
 <div
 className={`h-full rounded-full transition-all ${
 item.fifty_two_week_position_percent <= 35
 ? "bg-emerald-400"
 : item.fifty_two_week_position_percent <= 70
 ? "bg-amber-400"
 : "bg-red-400"
 }`}
 style={{ width: `${Math.max(5, item.fifty_two_week_position_percent)}%` }}
 />
 </div>
 </div>

 {/* Key Valuation Stats Grid */}
 <div className="mt-4 pt-3 border-t border-[#30363d]/80 grid grid-cols-3 gap-2 text-center text-xs">
 <div className="p-2 rounded-md bg-[#161b22] border border-[#30363d]">
 <div className="text-[10px] text-[#8b949e] uppercase font-semibold">Diskon ATH</div>
 <div className="font-bold text-[#3fb950] mt-0.5">
 -{item.discount_from_high_percent}%
 </div>
 </div>

 <div className="p-2 rounded-md bg-[#161b22] border border-[#30363d]">
 <div className="text-[10px] text-[#8b949e] uppercase font-semibold">Upside 52W</div>
 <div className="font-bold text-[#c9d1d9] mt-0.5">
 +{item.potential_upside_percent}%
 </div>
 </div>

 <div className="p-2 rounded-md bg-[#161b22] border border-[#30363d]">
 <div className="text-[10px] text-[#8b949e] uppercase font-semibold">Valuasi</div>
 <div className="font-bold text-[#c9d1d9] mt-0.5 truncate">
 {item.valuation_status}
 </div>
 </div>
 </div>

 {/* Analysis Narrative */}
 <div className="mt-3 p-2.5 rounded-md bg-[#0d1117] border border-[#30363d] text-[11px] text-[#8b949e] leading-relaxed">
 {item.analysis_summary}
 </div>
 </div>

 {/* Card Action Buttons */}
 <div className="mt-4 pt-3 border-t border-[#30363d] flex items-center justify-between text-xs gap-2">
 <button
 type="button"
 onClick={() => {
 setAlertTicker(item.ticker);
 setAlertTargetPrice(String(item.current_price));
 setIsAlertModalOpen(true);
 }}
 className="flex-1 py-1.5 rounded-md bg-[#161b22] hover:bg-[#21262d] text-[#c9d1d9] font-medium transition flex items-center justify-center gap-1.5"
 >
 <Bell className="w-3.5 h-3.5" /> Pasang Alert
 </button>

 <button
 type="button"
 onClick={() => {
 setTicker(item.ticker);
 setTargetBuy(String(item.current_price));
 setIsModalOpen(true);
 }}
 className="flex-1 py-1.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold transition flex items-center justify-center gap-1.5"
 >
 <Plus className="w-3.5 h-3.5" /> Catat Beli
 </button>
 </div>
 </div>
 );
 })
 ) : (
 <div className="col-span-full py-16 text-center text-[#8b949e] text-xs">
 {dipLoading ? "Memindai radar diskon..." : "Tidak ada instrumen yang cocok dengan kriteria filter."}
 </div>
 )}
 </div>
 </div>
 )}

 {/* Modal 1: Tambah Emiten */}
 <Modal
 isOpen={isModalOpen}
 onClose={() => setIsModalOpen(false)}
 title="Tambah Emiten ke Watchlist"
 >
 <form onSubmit={handleAddWatchlist} className="space-y-4 text-xs sm:text-sm">
 <div>
 <label className="block text-xs font-medium text-[#8b949e] mb-1.5">
 KODE SIMBOL / TICKER
 </label>
 <input
 type="text"
 placeholder="Contoh: AAPL, TSLA, NVDA, VT, BTC, BBCA"
 value={ticker}
 onChange={(e) => setTicker(e.target.value.toUpperCase())}
 required
 className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-[#f0f6fc] text-xs focus:outline-none focus:border-[#58a6ff] uppercase font-mono"
 />
 <div className="flex flex-wrap items-center gap-1.5 mt-2">
 <span className="text-[10px] text-[#8b949e] mr-1">Rekomendasi Cepat:</span>
 {[
 { sym: "AAPL", label: "Apple", icon: Landmark },
 { sym: "NVDA", label: "Nvidia", icon: Landmark },
 { sym: "TSLA", label: "Tesla", icon: Landmark },
 { sym: "VT", label: "Global ETF", icon: Globe },
 { sym: "BTC", label: "Bitcoin", icon: Coins },
 { sym: "BBCA", label: "BCA", icon: Building2 },
 ].map((s) => {
 const IconComp = s.icon;
 return (
 <button
 key={s.sym}
 type="button"
 onClick={() => setTicker(s.sym)}
 className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#0d1117] hover:bg-[#161b22] text-[#c9d1d9] border border-[#30363d] text-[10px] transition"
 >
 <IconComp className="w-2.5 h-2.5 text-[#8b949e]" />
 {s.label}
 </button>
 );
 })}
 </div>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-medium text-[#8b949e] mb-1.5">
 TARGET BELI
 </label>
 <input
 type="number"
 placeholder="Misal: 9500"
 value={targetBuy}
 onChange={(e) => setTargetBuy(e.target.value)}
 className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-[#f0f6fc] text-xs focus:outline-none focus:border-[#58a6ff]"
 />
 </div>
 <div>
 <label className="block text-xs font-medium text-[#8b949e] mb-1.5">
 TARGET JUAL
 </label>
 <input
 type="number"
 placeholder="Misal: 11000"
 value={targetSell}
 onChange={(e) => setTargetSell(e.target.value)}
 className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-[#f0f6fc] text-xs focus:outline-none focus:border-[#58a6ff]"
 />
 </div>
 </div>

 <div>
 <label className="block text-xs font-medium text-[#8b949e] mb-1.5">
 CATATAN ANALISIS
 </label>
 <textarea
 placeholder="Alasan memantau saham ini (misal: valuasi murah, dividen jumbo, dll)"
 value={notes}
 onChange={(e) => setNotes(e.target.value)}
 rows={3}
 className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-[#f0f6fc] text-xs focus:outline-none focus:border-[#58a6ff]"
 />
 </div>

 <div className="pt-2">
 <button
 type="submit"
 className="w-full py-2.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold text-xs transition active:scale-[0.98]"
 >
 Simpan ke Watchlist
 </button>
 </div>
 </form>
 </Modal>

 {/* Modal 2: Pasang Price Alert */}
 <Modal
 isOpen={isAlertModalOpen}
 onClose={() => setIsAlertModalOpen(false)}
 title="Pasang Notifikasi Harga (Price Alert)"
 >
 <form onSubmit={handleCreateAlert} className="space-y-4 text-xs sm:text-sm">
 <div>
 <label className="block text-xs font-medium text-[#8b949e] mb-1.5">
 KODE SIMBOL / TICKER
 </label>
 <input
 type="text"
 placeholder="BBCA"
 value={alertTicker}
 onChange={(e) => setAlertTicker(e.target.value.toUpperCase())}
 required
 className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-[#f0f6fc] text-xs focus:outline-none focus:border-[#58a6ff] uppercase"
 />
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-medium text-[#8b949e] mb-1.5">
 KONDISI ALERT
 </label>
 <select
 value={alertCondition}
 onChange={(e) => setAlertCondition(e.target.value as any)}
 className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-[#f0f6fc] text-xs focus:outline-none focus:border-[#58a6ff]"
 >
 <option value="BELOW">Harga Turun Di Bawah (&le;)</option>
 <option value="ABOVE">Harga Naik Di Atas (&ge;)</option>
 </select>
 </div>

 <div>
 <label className="block text-xs font-medium text-[#8b949e] mb-1.5">
 TARGET HARGA
 </label>
 <input
 type="number"
 placeholder="9500"
 value={alertTargetPrice}
 onChange={(e) => setAlertTargetPrice(e.target.value)}
 required
 className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-[#f0f6fc] text-xs focus:outline-none focus:border-[#58a6ff]"
 />
 </div>
 </div>

 <div className="p-3 rounded-md bg-[#0d1117] border border-[#30363d] text-xs text-[#8b949e] flex items-start gap-2">
 <Bell className="w-4 h-4 text-[#3fb950] shrink-0 mt-0.5" />
 <span>
 Notifikasi instan akan dikirimkan langsung oleh bot Telegram Asisten+Stock saat harga pasar menyentuh target ini.
 </span>
 </div>

 <div className="pt-2">
 <button
 type="submit"
 className="w-full py-2.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold text-xs transition active:scale-[0.98]"
 >
 Pasang Alert Telegram
 </button>
 </div>
 </form>
 </Modal>
 </main>
 </div>
 );
}
