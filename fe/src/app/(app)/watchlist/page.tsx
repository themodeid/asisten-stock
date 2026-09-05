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

      <main className="p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">
              Daftar Pantau Saham (Watchlist)
            </h2>
            <p className="text-xs text-zinc-400">
              Pantau emiten potensial dan aktifkan notifikasi otomatis ke Telegram
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAlertModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 text-zinc-200 border border-zinc-700/80 text-xs font-medium transition flex items-center gap-2"
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
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700/80 transition relative flex flex-col justify-between shadow-sm"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-zinc-100">
                          {item.ticker}
                        </h3>
                        <p className="text-[11px] text-zinc-400 truncate max-w-[200px]">
                          {item.company_name}
                        </p>
                      </div>
                      <Badge variant={isUp ? "success" : "danger"}>
                        {isUp ? "+" : ""}
                        {(item.day_change_percent || 0).toFixed(2)}%
                      </Badge>
                    </div>

                    <div className="mt-3">
                      <span className="text-[11px] text-zinc-500">Harga Terkini</span>
                      <div className="text-xl font-bold text-zinc-100">
                        {formatIDR(item.current_price || 0)}
                      </div>
                    </div>

                    {/* Targets */}
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-zinc-800 text-xs">
                      <div>
                        <span className="text-zinc-500 text-[11px]">Target Buy:</span>
                        <div className="font-semibold text-emerald-400">
                          {item.target_buy_price
                            ? formatIDR(item.target_buy_price)
                            : "-"}
                        </div>
                      </div>
                      <div>
                        <span className="text-zinc-500 text-[11px]">Target Sell:</span>
                        <div className="font-semibold text-zinc-200">
                          {item.target_sell_price
                            ? formatIDR(item.target_sell_price)
                            : "-"}
                        </div>
                      </div>
                    </div>

                    {item.notes && (
                      <p className="text-xs text-zinc-400 mt-3 italic bg-zinc-850 p-2 rounded-lg border border-zinc-800">
                        "{item.notes}"
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setAlertTicker(item.ticker);
                        setIsAlertModalOpen(true);
                      }}
                      className="text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-1"
                    >
                      <Bell className="w-3.5 h-3.5" /> Pasang Alert
                    </button>
                    <button
                      onClick={() => handleDelete(item.ticker)}
                      className="p-1 text-zinc-500 hover:text-red-400 transition"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-xl">
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
          <form onSubmit={handleAddWatchlist} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                KODE EMITEN (TICKER)
              </label>
              <input
                type="text"
                placeholder="Contoh: BBCA, ASII, BMRI"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                required
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-zinc-400 uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  TARGET BELI (Rp)
                </label>
                <input
                  type="number"
                  placeholder="9200"
                  value={targetBuy}
                  onChange={(e) => setTargetBuy(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-zinc-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  TARGET JUAL / TP (Rp)
                </label>
                <input
                  type="number"
                  placeholder="10500"
                  value={targetSell}
                  onChange={(e) => setTargetSell(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-zinc-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                CATATAN / ALASAN PANTAU
              </label>
              <input
                type="text"
                placeholder="Misal: Tunggu laporan keuangan Q3 rilis"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-zinc-400"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold text-xs shadow-sm transition mt-2 active:scale-[0.98]"
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
          <form onSubmit={handleCreateAlert} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                KODE EMITEN (TICKER)
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

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                KONDISI PEMICU
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAlertCondition("ABOVE")}
                  className={`py-2 rounded-lg font-medium text-xs border transition ${
                    alertCondition === "ABOVE"
                      ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300 font-semibold"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400"
                  }`}
                >
                  NAIK DI ATAS (&gt;=)
                </button>
                <button
                  type="button"
                  onClick={() => setAlertCondition("BELOW")}
                  className={`py-2 rounded-lg font-medium text-xs border transition ${
                    alertCondition === "BELOW"
                      ? "bg-red-950/40 border-red-800/60 text-red-300 font-semibold"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400"
                  }`}
                >
                  TURUN DI BAWAH (&lt;=)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                TARGET HARGA PEMICU (Rp)
              </label>
              <input
                type="number"
                placeholder="10000"
                value={alertTargetPrice}
                onChange={(e) => setAlertTargetPrice(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-zinc-400"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold text-xs shadow-sm transition mt-2 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Bell className="w-3.5 h-3.5 text-zinc-900" /> Aktifkan Alert
            </button>
          </form>
        </Modal>
      </main>
    </div>
  );
}
