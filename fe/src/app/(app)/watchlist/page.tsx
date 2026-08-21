"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { api, formatIDR } from "@/services/api";
import { Plus, Trash2, Bell, TrendingUp, Sparkles } from "lucide-react";

export default function WatchlistPage() {
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

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      const res = await api.get("/watchlist/1");
      if (res.data?.data) {
        setWatchlist(res.data.data);
      }
    } catch (err) {
      console.warn("Failed fetching watchlist:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const handleAddWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker) return;
    try {
      await api.post("/watchlist", {
        user_id: 1,
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
        user_id: 1,
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
      await api.delete(`/watchlist/${t}?userId=1`);
      fetchWatchlist();
    } catch (err) {
      alert("Gagal menghapus dari watchlist");
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Watchlist & Price Alerts" />

      <main className="p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100">
              Daftar Pantau Saham (Watchlist)
            </h2>
            <p className="text-xs text-slate-400">
              Pantau emiten potensial dan aktifkan notifikasi otomatis ke Telegram
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAlertModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-medium transition flex items-center gap-2"
            >
              <Bell className="w-4 h-4 text-amber-400" /> Pasang Price Alert
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-md shadow-blue-600/30 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Tambah Emiten
            </button>
          </div>
        </div>

        {/* Watchlist Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {watchlist.length > 0 ? (
            watchlist.map((item) => {
              const isUp = (item.day_change_percent || 0) >= 0;
              return (
                <div
                  key={item.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition relative flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-extrabold text-slate-100">
                          {item.ticker}
                        </h3>
                        <p className="text-xs text-slate-400 truncate max-w-[200px]">
                          {item.company_name}
                        </p>
                      </div>
                      <Badge variant={isUp ? "success" : "danger"}>
                        {isUp ? "+" : ""}
                        {(item.day_change_percent || 0).toFixed(2)}%
                      </Badge>
                    </div>

                    <div className="mt-4">
                      <span className="text-xs text-slate-500">Harga Terkini</span>
                      <div className="text-2xl font-bold text-slate-100">
                        {formatIDR(item.current_price || 0)}
                      </div>
                    </div>

                    {/* Targets */}
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-500">Target Buy:</span>
                        <div className="font-semibold text-emerald-400">
                          {item.target_buy_price
                            ? formatIDR(item.target_buy_price)
                            : "-"}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">Target Sell:</span>
                        <div className="font-semibold text-blue-400">
                          {item.target_sell_price
                            ? formatIDR(item.target_sell_price)
                            : "-"}
                        </div>
                      </div>
                    </div>

                    {item.notes && (
                      <p className="text-xs text-slate-400 mt-3 italic bg-slate-800/40 p-2 rounded-lg">
                        "{item.notes}"
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setAlertTicker(item.ticker);
                        setIsAlertModalOpen(true);
                      }}
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <Bell className="w-3.5 h-3.5" /> Pasang Alert
                    </button>
                    <button
                      onClick={() => handleDelete(item.ticker)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-16 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-3xl">
              {loading
                ? "Memuat watchlist..."
                : "Watchlist Anda masih kosong. Tambahkan emiten favorit yang ingin dipantau!"}
            </div>
          )}
        </div>

        {/* Modal Tambah Watchlist */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Tambah Emiten ke Watchlist"
        >
          <form onSubmit={handleAddWatchlist} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                KODE EMITEN (TICKER)
              </label>
              <input
                type="text"
                placeholder="Contoh: BBCA, ASII, BMRI"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-blue-500 uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  TARGET BELI (Rp)
                </label>
                <input
                  type="number"
                  placeholder="9200"
                  value={targetBuy}
                  onChange={(e) => setTargetBuy(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  TARGET JUAL / TP (Rp)
                </label>
                <input
                  type="number"
                  placeholder="10500"
                  value={targetSell}
                  onChange={(e) => setTargetSell(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                CATATAN / ALASAN PANTAU
              </label>
              <input
                type="text"
                placeholder="Misal: Tunggu laporan keuangan Q3 rilis"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md shadow-blue-600/30 transition mt-2"
            >
              Simpan ke Watchlist
            </button>
          </form>
        </Modal>

        {/* Modal Price Alert */}
        <Modal
          isOpen={isAlertModalOpen}
          onClose={() => setIsAlertModalOpen(false)}
          title="Pasang Notifikasi Price Alert"
        >
          <form onSubmit={handleCreateAlert} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                KODE EMITEN (TICKER)
              </label>
              <input
                type="text"
                placeholder="BBCA"
                value={alertTicker}
                onChange={(e) => setAlertTicker(e.target.value.toUpperCase())}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-blue-500 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                KONDISI PEMICU
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAlertCondition("ABOVE")}
                  className={`py-2 rounded-xl font-bold text-xs border transition ${
                    alertCondition === "ABOVE"
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                      : "bg-slate-800 border-slate-700 text-slate-400"
                  }`}
                >
                  NAIK DI ATAS (&gt;=)
                </button>
                <button
                  type="button"
                  onClick={() => setAlertCondition("BELOW")}
                  className={`py-2 rounded-xl font-bold text-xs border transition ${
                    alertCondition === "BELOW"
                      ? "bg-rose-500/20 border-rose-500 text-rose-400"
                      : "bg-slate-800 border-slate-700 text-slate-400"
                  }`}
                >
                  TURUN DI BAWAH (&lt;=)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                TARGET HARGA PEMICU (Rp)
              </label>
              <input
                type="number"
                placeholder="10000"
                value={alertTargetPrice}
                onChange={(e) => setAlertTargetPrice(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-md shadow-amber-600/30 transition mt-2 flex items-center justify-center gap-2"
            >
              <Bell className="w-4 h-4" /> Aktifkan Alert
            </button>
          </form>
        </Modal>
      </main>
    </div>
  );
}
