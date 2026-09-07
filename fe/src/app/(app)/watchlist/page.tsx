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
  const [radarFilterAsset, setRadarFilterAsset] = useState<"ALL" | AssetType>("ALL");
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

  const filteredRadarItems = useMemo(() => {
    return dipRadarItems.filter((item) => {
      if (radarFilterAsset !== "ALL" && item.asset_type !== radarFilterAsset) return false;
      if (onlyStrongAccumulate && item.buy_confidence_score < 70) return false;
      return true;
    });
  }, [dipRadarItems, radarFilterAsset, onlyStrongAccumulate]);

  const formatPrice = (price: number, cur: string) => {
    if (cur === "USD") return `$${Number(price).toLocaleString()}`;
    return formatIDR(price);
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Watchlist & Radar Aset Diskon (AI Screener)" />

      <main className="p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Primary View Switcher */}
        <div className="flex border-b border-zinc-800 gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab("WATCHLIST")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === "WATCHLIST"
                ? "border-zinc-100 text-zinc-100 font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Layers className="w-4 h-4" />
            Daftar Pantau & Price Alerts ({watchlist.length})
          </button>

          <button
            onClick={() => setActiveTab("DIP_RADAR")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === "DIP_RADAR"
                ? "border-zinc-100 text-zinc-100 font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Radar className="w-4 h-4 text-emerald-400" />
            Radar Aset Diskon (AI Dip Screener)
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-800/60">
              Graham & Buffett AI
            </span>
          </button>
        </div>

        {/* TAB 1: WATCHLIST & ALERTS */}
        {activeTab === "WATCHLIST" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-100">
                  Daftar Pantau Saham & Aset Kustom
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Pantau emiten potensial dan aktifkan notifikasi otomatis ke Telegram saat menyentuh target beli/jual.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsAlertModalOpen(true)}
                  className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700 text-xs font-medium transition flex items-center gap-2"
                >
                  <Bell className="w-3.5 h-3.5 text-zinc-300" /> Pasang Price Alert
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-semibold shadow-sm transition flex items-center gap-2 active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4 text-zinc-900" /> Tambah Emiten
                </button>
              </div>
            </div>

            {/* Watchlist Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {watchlist.length > 0 ? (
                watchlist.map((item) => {
                  const isUp = (item.day_change_percent || 0) >= 0;
                  return (
                    <div
                      key={item.id}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition relative flex flex-col justify-between shadow-sm"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-zinc-100">
                              {item.ticker}
                            </h3>
                            <div className="text-xs text-zinc-400 truncate max-w-[200px]">
                              {item.company_name}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDelete(item.ticker)}
                            className="text-zinc-500 hover:text-red-400 transition p-1"
                            title="Hapus dari watchlist"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="mt-4 flex items-baseline gap-2">
                          <span className="text-2xl font-black text-zinc-100">
                            {formatIDR(item.current_price || 0)}
                          </span>
                          <Badge variant={isUp ? "success" : "danger"}>
                            {isUp ? "+" : ""}
                            {item.day_change_percent}%
                          </Badge>
                        </div>

                        {/* Price Targets */}
                        <div className="mt-4 pt-3 border-t border-zinc-800/80 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Target Beli</span>
                            <div className="font-semibold text-emerald-400 mt-0.5">
                              {item.target_buy_price ? formatIDR(item.target_buy_price) : "-"}
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Target Jual</span>
                            <div className="font-semibold text-amber-400 mt-0.5">
                              {item.target_sell_price ? formatIDR(item.target_sell_price) : "-"}
                            </div>
                          </div>
                        </div>

                        {item.notes && (
                          <div className="mt-3 text-[11px] text-zinc-400 italic bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/60">
                            &ldquo;{item.notes}&rdquo;
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-[11px]">
                        <button
                          onClick={() => {
                            setAlertTicker(item.ticker);
                            setAlertTargetPrice(String(item.target_buy_price || item.current_price || ""));
                            setIsAlertModalOpen(true);
                          }}
                          className="text-zinc-400 hover:text-zinc-200 flex items-center gap-1 font-medium transition"
                        >
                          <Bell className="w-3 h-3 text-zinc-400" /> Atur Alert
                        </button>
                        <span className="text-zinc-500 text-[10px]">
                          Update Live
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-12 text-center text-zinc-500 text-xs">
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
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                    <Radar className="w-5 h-5 text-emerald-400" />
                    Radar Aset Diskon & Value Screener
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-3xl leading-relaxed">
                    AI memindai saham Blue-Chip IHSG, ETF Global, dan Kripto untuk menemukan aset berfundamental kuat yang posisinya berada di area bawah 52-Week Range (Benjamin Graham Margin of Safety & Warren Buffett ROE Filters).
                  </p>
                </div>

                <button
                  onClick={fetchDipRadar}
                  disabled={dipLoading}
                  className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700 text-xs font-semibold transition flex items-center gap-1.5 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${dipLoading ? "animate-spin" : ""}`} />
                  {dipLoading ? "Memindai Pasar..." : "Scan Ulang Pasar"}
                </button>
              </div>

              {/* Filters Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-800/80">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  {[
                    { key: "ALL", label: "SEMUA INSTRUMEN" },
                    { key: "STOCK", label: "SAHAM IDX" },
                    { key: "ETF", label: "GLOBAL ETF" },
                    { key: "CRYPTO", label: "KRIPTO" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setRadarFilterAsset(tab.key as any)}
                      className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
                        radarFilterAsset === tab.key
                          ? "bg-zinc-100 text-zinc-900 font-bold shadow-sm"
                          : "bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300 select-none">
                  <input
                    type="checkbox"
                    checked={onlyStrongAccumulate}
                    onChange={(e) => setOnlyStrongAccumulate(e.target.checked)}
                    className="rounded bg-zinc-950 border-zinc-700 text-emerald-500 focus:ring-0"
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
                      className={`rounded-xl p-5 border transition flex flex-col justify-between shadow-sm ${
                        isStrong
                          ? "bg-zinc-900 border-emerald-500/50 ring-1 ring-emerald-500/30"
                          : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      <div>
                        {/* Header card */}
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                                {item.asset_type}
                              </span>
                              <h3 className="text-lg font-bold text-zinc-100">{item.ticker}</h3>
                            </div>
                            <div className="text-xs text-zinc-400 truncate max-w-[200px] mt-0.5">
                              {item.name}
                            </div>
                          </div>

                          {/* Buy Confidence Gauge */}
                          <div className="text-right">
                            <div className="text-[10px] text-zinc-500 uppercase font-semibold">
                              Confidence
                            </div>
                            <div className={`text-lg font-black ${
                              isStrong ? "text-emerald-400" : isModerate ? "text-amber-400" : "text-zinc-400"
                            }`}>
                              {item.buy_confidence_score}%
                            </div>
                          </div>
                        </div>

                        {/* Live Price & Tag */}
                        <div className="mt-4 flex items-center justify-between">
                          <div>
                            <span className="text-xl font-black text-zinc-100">
                              {formatPrice(item.current_price, item.currency)}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isStrong
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-800/60"
                                : isModerate
                                ? "bg-amber-950 text-amber-300 border border-amber-800/60"
                                : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                            }`}
                          >
                            {isStrong ? "STRONG ACCUMULATE" : isModerate ? "MODERATE BUY" : "WAIT FOR DIP"}
                          </span>
                        </div>

                        {/* 52-Week Range Visual Progress Bar */}
                        <div className="mt-4 space-y-1.5">
                          <div className="flex justify-between text-[10px] text-zinc-400">
                            <span>52W Low: {formatPrice(item.fifty_two_week_low, item.currency)}</span>
                            <span className="font-semibold text-zinc-300">
                              Posisi: {item.fifty_two_week_position_percent}%
                            </span>
                            <span>52W High: {formatPrice(item.fifty_two_week_high, item.currency)}</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-zinc-800 relative overflow-hidden">
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
                        <div className="mt-4 pt-3 border-t border-zinc-800/80 grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="p-2 rounded-lg bg-zinc-850 border border-zinc-800">
                            <div className="text-[10px] text-zinc-500 uppercase font-semibold">Diskon ATH</div>
                            <div className="font-bold text-emerald-400 mt-0.5">
                              -{item.discount_from_high_percent}%
                            </div>
                          </div>

                          <div className="p-2 rounded-lg bg-zinc-850 border border-zinc-800">
                            <div className="text-[10px] text-zinc-500 uppercase font-semibold">Upside 52W</div>
                            <div className="font-bold text-zinc-200 mt-0.5">
                              +{item.potential_upside_percent}%
                            </div>
                          </div>

                          <div className="p-2 rounded-lg bg-zinc-850 border border-zinc-800">
                            <div className="text-[10px] text-zinc-500 uppercase font-semibold">Valuasi</div>
                            <div className="font-bold text-zinc-300 mt-0.5 truncate">
                              {item.valuation_status}
                            </div>
                          </div>
                        </div>

                        {/* Analysis Narrative */}
                        <div className="mt-3 p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800 text-[11px] text-zinc-400 leading-relaxed">
                          {item.analysis_summary}
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAlertTicker(item.ticker);
                            setAlertTargetPrice(String(item.current_price));
                            setIsAlertModalOpen(true);
                          }}
                          className="flex-1 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition flex items-center justify-center gap-1.5"
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
                          className="flex-1 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold transition flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" /> Catat Beli
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-16 text-center text-zinc-500 text-xs">
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
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                KODE SIMBOL / TICKER
              </label>
              <input
                type="text"
                placeholder="Contoh: BBCA, BBRI, VT, BTC"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                required
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-zinc-400 uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  TARGET BELI
                </label>
                <input
                  type="number"
                  placeholder="Misal: 9500"
                  value={targetBuy}
                  onChange={(e) => setTargetBuy(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-zinc-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  TARGET JUAL
                </label>
                <input
                  type="number"
                  placeholder="Misal: 11000"
                  value={targetSell}
                  onChange={(e) => setTargetSell(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-zinc-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                CATATAN ANALISIS
              </label>
              <textarea
                placeholder="Alasan memantau saham ini (misal: valuasi murah, dividen jumbo, dll)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-zinc-400"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold text-xs transition active:scale-[0.98]"
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
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                KODE SIMBOL / TICKER
              </label>
              <input
                type="text"
                placeholder="BBCA"
                value={alertTicker}
                onChange={(e) => setAlertTicker(e.target.value.toUpperCase())}
                required
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-zinc-400 uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  KONDISI ALERT
                </label>
                <select
                  value={alertCondition}
                  onChange={(e) => setAlertCondition(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-zinc-400"
                >
                  <option value="BELOW">Harga Turun Di Bawah (&le;)</option>
                  <option value="ABOVE">Harga Naik Di Atas (&ge;)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  TARGET HARGA
                </label>
                <input
                  type="number"
                  placeholder="9500"
                  value={alertTargetPrice}
                  onChange={(e) => setAlertTargetPrice(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-zinc-400"
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 flex items-start gap-2">
              <Bell className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Notifikasi instan akan dikirimkan langsung oleh bot Telegram Asisten+Stock saat harga pasar menyentuh target ini.
              </span>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold text-xs transition active:scale-[0.98]"
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
