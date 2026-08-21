"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { api, formatIDR, formatPercent } from "@/services/api";
import { Plus, ArrowDownRight, ArrowUpRight, RefreshCw, Sparkles } from "lucide-react";

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [ticker, setTicker] = useState("");
  const [type, setType] = useState<"BUY" | "SELL">("BUY");
  const [lots, setLots] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const res = await api.get("/portfolio/summary/1");
      if (res.data?.data) {
        setPortfolio(res.data.data);
      }
    } catch (err) {
      console.warn("Failed fetching portfolio:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker || !lots || !price) return;

    try {
      setSubmitting(true);
      await api.post("/transactions", {
        portfolio_id: portfolio?.portfolio_id || 1,
        ticker,
        type,
        lots: Number(lots),
        price_per_share: Number(price),
        notes,
      });
      setIsModalOpen(false);
      // Reset form
      setTicker("");
      setLots("");
      setPrice("");
      setNotes("");
      fetchPortfolio();
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal mencatat transaksi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Manajemen Portofolio Saham" />

      <main className="p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100">
              {portfolio?.portfolio_name || "Portofolio Utama"}
            </h2>
            <p className="text-xs text-slate-400">
              Total Posisi: {portfolio?.holdings_count || 0} Saham | Kas:{" "}
              {formatIDR(portfolio?.cash_balance || 0)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchPortfolio}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Refresh Quotes"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm shadow-md shadow-blue-600/20 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Catat Transaksi Baru
            </button>
          </div>
        </div>

        {/* Holdings Table Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-xs text-slate-400">
                <tr>
                  <th className="py-3.5 px-6 font-semibold">TICKER & NAMA</th>
                  <th className="py-3.5 px-4 font-semibold">TOTAL LOT</th>
                  <th className="py-3.5 px-4 font-semibold">AVG BUY</th>
                  <th className="py-3.5 px-4 font-semibold">HARGA PASAR</th>
                  <th className="py-3.5 px-4 font-semibold">TOTAL MODAL</th>
                  <th className="py-3.5 px-4 font-semibold">NILAI PASAR</th>
                  <th className="py-3.5 px-4 font-semibold">FLOATING P/L</th>
                  <th className="py-3.5 px-6 font-semibold text-right">BOBOT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {portfolio?.holdings && portfolio.holdings.length > 0 ? (
                  portfolio.holdings.map((h: any) => {
                    const isUp = (h.floating_pnl || 0) >= 0;
                    return (
                      <tr
                        key={h.ticker}
                        className="hover:bg-slate-800/40 transition"
                      >
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-100 text-base">
                            {h.ticker}
                          </div>
                          <div className="text-xs text-slate-400 truncate max-w-[180px]">
                            {h.company_name}
                          </div>
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-200">
                          {h.total_lots} Lot
                          <div className="text-[11px] text-slate-400 font-normal">
                            {h.total_shares} lembar
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-300 font-medium">
                          {formatIDR(h.avg_buy_price)}
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-100">
                          {formatIDR(h.current_price || h.avg_buy_price)}
                        </td>
                        <td className="py-4 px-4 text-slate-300">
                          {formatIDR(h.total_invested)}
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-100">
                          {formatIDR(h.market_value || h.total_invested)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <Badge variant={isUp ? "success" : "danger"}>
                              {isUp ? "+" : ""}
                              {h.floating_pnl_percent}%
                            </Badge>
                            <span className="text-[11px] text-slate-400 mt-1">
                              {formatIDR(h.floating_pnl)}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-slate-200">
                          {h.weight_percent ? `${h.weight_percent}%` : "-"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-500">
                      {loading
                        ? "Memuat data portofolio..."
                        : "Portofolio masih kosong. Catat transaksi pertama Anda!"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Entry Transaksi */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Catat Transaksi Saham"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Transaction Type Radio */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">
                JENIS TRANSAKSI
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType("BUY")}
                  className={`py-2.5 rounded-xl font-bold text-sm border flex items-center justify-center gap-2 transition ${
                    type === "BUY"
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4" /> BELI (BUY)
                </button>
                <button
                  type="button"
                  onClick={() => setType("SELL")}
                  className={`py-2.5 rounded-xl font-bold text-sm border flex items-center justify-center gap-2 transition ${
                    type === "SELL"
                      ? "bg-rose-500/20 border-rose-500 text-rose-400"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" /> JUAL (SELL)
                </button>
              </div>
            </div>

            {/* Ticker Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                KODE EMITEN / TICKER
              </label>
              <input
                type="text"
                placeholder="Contoh: BBCA, BBRI, TLKM"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-blue-500 uppercase"
              />
            </div>

            {/* Lots and Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  JUMLAH LOT (1 Lot = 100 lembar)
                </label>
                <input
                  type="number"
                  placeholder="10"
                  min="0.01"
                  step="any"
                  value={lots}
                  onChange={(e) => setLots(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  HARGA BELI / LEMBAR (Rp)
                </label>
                <input
                  type="number"
                  placeholder="9850"
                  min="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                CATATAN (OPSIONAL)
              </label>
              <input
                type="text"
                placeholder="Misal: Akumulasi support, swing trade"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
              >
                {submitting ? "Menyimpan Transaksi..." : "Simpan Transaksi"}
              </button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
}
