"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { api, formatIDR, formatPercent } from "@/services/api";
import { Plus, ArrowDownRight, ArrowUpRight, RefreshCw, Sparkles, Filter } from "lucide-react";
import { AssetType } from "@/types";

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALL" | AssetType>("ALL");

  // Form state
  const [assetType, setAssetType] = useState<AssetType>("STOCK");
  const [ticker, setTicker] = useState("");
  const [type, setType] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState<"IDR" | "USD">("IDR");
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

  const handleAssetTypeChange = (newType: AssetType) => {
    setAssetType(newType);
    if (newType === "CRYPTO" || newType === "ETF") {
      setCurrency("USD");
    } else {
      setCurrency("IDR");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker || !quantity || !price) return;

    try {
      setSubmitting(true);
      const isStock = assetType === "STOCK";
      await api.post("/transactions", {
        portfolio_id: portfolio?.portfolio_id || 1,
        ticker,
        asset_type: assetType,
        type,
        lots: isStock ? Number(quantity) : undefined,
        quantity: isStock ? undefined : Number(quantity),
        price_per_share: Number(price),
        currency,
        notes,
      });
      setIsModalOpen(false);
      // Reset form
      setTicker("");
      setQuantity("");
      setPrice("");
      setNotes("");
      fetchPortfolio();
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal mencatat transaksi");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredHoldings = (portfolio?.holdings || []).filter((h: any) => {
    if (activeTab === "ALL") return true;
    return (h.asset_type || "STOCK") === activeTab;
  });

  const getUnitLabel = (type: AssetType) => {
    switch (type) {
      case "STOCK":
        return "JUMLAH LOT (1 Lot = 100 lembar)";
      case "CRYPTO":
        return "JUMLAH UNIT / KOIN (misal: 0.05 BTC)";
      case "GOLD":
        return "BERAT (GRAM)";
      case "BOND":
        return "NOMINAL / UNIT (Rp)";
      case "ETF":
      case "MUTUAL_FUND":
        return "JUMLAH UNIT PENYERTAAN";
      default:
        return "JUMLAH KUANTITAS";
    }
  };

  const getTickerPlaceholder = (type: AssetType) => {
    switch (type) {
      case "STOCK":
        return "Contoh: BBCA, BBRI, AAPL";
      case "CRYPTO":
        return "Contoh: BTC, ETH, SOL, USDT";
      case "GOLD":
        return "Contoh: EMAS, ANTAM, UBS";
      case "BOND":
        return "Contoh: ORI024, SR019, FR0096";
      case "ETF":
        return "Contoh: SPY, QQQ, VOO";
      case "MUTUAL_FUND":
        return "Contoh: RDPU SUCOR, RDPT MANULIFE";
      default:
        return "Kode Simbol / Nama Aset";
    }
  };

  const formatPriceVal = (val: number, cur?: string) => {
    if (cur === "USD") return `$${val.toLocaleString()}`;
    return formatIDR(val);
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Manajemen Portofolio Multi-Aset" />

      <main className="p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">
              {portfolio?.portfolio_name || "Portofolio Utama"}
            </h2>
            <p className="text-xs text-zinc-400">
              Total Posisi: {portfolio?.holdings_count || 0} Aset | Kas:{" "}
              {formatIDR(portfolio?.cash_balance || 0)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchPortfolio}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 text-zinc-300 border border-zinc-700/80 transition"
              title="Refresh Quotes"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold text-xs shadow-sm transition flex items-center gap-2 active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 text-zinc-900" />
              Catat Transaksi Aset Baru
            </button>
          </div>
        </div>

        {/* Asset Class Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { key: "ALL", label: "SEMUA ASET" },
            { key: "STOCK", label: "SAHAM" },
            { key: "CRYPTO", label: "KRIPTO" },
            { key: "ETF", label: "ETF" },
            { key: "BOND", label: "OBLIGASI / SBN" },
            { key: "GOLD", label: "EMAS" },
            { key: "MUTUAL_FUND", label: "REKSADANA" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-zinc-100 text-zinc-900 font-semibold shadow-sm"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Holdings Table Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-850 border-b border-zinc-800 text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-6">KELAS ASET & SIMBOL</th>
                  <th className="py-3 px-4">KUANTITAS / UNIT</th>
                  <th className="py-3 px-4">AVG BUY</th>
                  <th className="py-3 px-4">HARGA PASAR</th>
                  <th className="py-3 px-4">TOTAL MODAL</th>
                  <th className="py-3 px-4">NILAI PASAR</th>
                  <th className="py-3 px-4">FLOATING P/L</th>
                  <th className="py-3 px-6 text-right">BOBOT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {filteredHoldings.length > 0 ? (
                  filteredHoldings.map((h: any) => {
                    const isUp = (h.floating_pnl || 0) >= 0;
                    const aType = h.asset_type || "STOCK";
                    const isStock = aType === "STOCK";

                    return (
                      <tr
                        key={`${h.ticker}-${aType}`}
                        className="hover:bg-zinc-800/40 transition"
                      >
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                              {aType}
                            </span>
                            <div className="font-semibold text-zinc-100 text-sm">
                              {h.ticker}
                            </div>
                          </div>
                          <div className="text-[11px] text-zinc-400 truncate max-w-[180px] mt-0.5">
                            {h.company_name}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-zinc-200">
                          {isStock ? (
                            <>
                              {h.total_lots} Lot
                              <div className="text-[10px] text-zinc-500 font-normal">
                                {h.total_shares || h.quantity} lembar
                              </div>
                            </>
                          ) : (
                            <>
                              {h.quantity}{" "}
                              <span className="text-zinc-500 font-normal">
                                {aType === "GOLD" ? "gram" : "unit"}
                              </span>
                            </>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-zinc-300">
                          {formatPriceVal(h.avg_buy_price, h.currency)}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-zinc-100">
                          {formatPriceVal(h.current_price || h.avg_buy_price, h.currency)}
                        </td>
                        <td className="py-3.5 px-4 text-zinc-300">
                          {formatPriceVal(h.total_invested, h.currency)}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-zinc-100">
                          {formatPriceVal(h.market_value || h.total_invested, h.currency)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <Badge variant={isUp ? "success" : "danger"}>
                              {isUp ? "+" : ""}
                              {h.floating_pnl_percent}%
                            </Badge>
                            <span className="text-[10px] text-zinc-400 mt-1">
                              {formatPriceVal(h.floating_pnl, h.currency)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-6 text-right font-medium text-zinc-200">
                          {h.weight_percent ? `${h.weight_percent}%` : "-"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-zinc-500">
                      {loading
                        ? "Memuat data portofolio..."
                        : "Tidak ada aset di kategori ini. Catat transaksi pertama Anda!"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Entry Transaksi Multi-Aset */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Catat Transaksi Multi-Aset"
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
            {/* Asset Class Selection */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">
                PILIH KELAS ASET
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { key: "STOCK", label: "Saham" },
                    { key: "CRYPTO", label: "Kripto" },
                    { key: "ETF", label: "ETF" },
                    { key: "BOND", label: "Obligasi / SBN" },
                    { key: "GOLD", label: "Emas" },
                    { key: "MUTUAL_FUND", label: "Reksadana" },
                  ] as const
                ).map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => handleAssetTypeChange(a.key)}
                    className={`py-1.5 rounded-lg text-xs font-medium border transition ${
                      assetType === a.key
                        ? "bg-zinc-100 text-zinc-900 font-semibold border-zinc-200"
                        : "bg-zinc-850 border-zinc-700/80 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Transaction Type Radio */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">
                JENIS TRANSAKSI
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType("BUY")}
                  className={`py-2 rounded-lg font-medium text-xs border flex items-center justify-center gap-2 transition ${
                    type === "BUY"
                      ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300 font-semibold"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700"
                  }`}
                >
                  <ArrowDownRight className="w-3.5 h-3.5" /> BELI (BUY)
                </button>
                <button
                  type="button"
                  onClick={() => setType("SELL")}
                  className={`py-2 rounded-lg font-medium text-xs border flex items-center justify-center gap-2 transition ${
                    type === "SELL"
                      ? "bg-red-950/40 border-red-800/60 text-red-300 font-semibold"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700"
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" /> JUAL (SELL)
                </button>
              </div>
            </div>

            {/* Ticker and Currency */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  KODE SIMBOL / TICKER
                </label>
                <input
                  type="text"
                  placeholder={getTickerPlaceholder(assetType)}
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  required
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-zinc-400 uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  MATA UANG
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-zinc-400"
                >
                  <option value="IDR">IDR (Rp)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>

            {/* Quantity and Price */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  {getUnitLabel(assetType)}
                </label>
                <input
                  type="number"
                  placeholder={assetType === "STOCK" ? "10" : "0.05"}
                  min="0.00000001"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-zinc-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  HARGA / UNIT ({currency})
                </label>
                <input
                  type="number"
                  placeholder={currency === "USD" ? "64500" : "9850"}
                  min="0.00000001"
                  step="any"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-zinc-400"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                CATATAN (OPSIONAL)
              </label>
              <input
                type="text"
                placeholder="Misal: DCA mingguan, target yield 6%, dll"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-zinc-400"
              />
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold text-xs shadow-sm transition disabled:opacity-50 active:scale-[0.98]"
              >
                {submitting ? "Menyimpan Transaksi..." : "Simpan Transaksi Multi-Aset"}
              </button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
}

