"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Badge from "@/components/ui/Badge";
import { api, formatIDR } from "@/services/api";
import { ArrowDownRight, ArrowUpRight, Trash2, Filter } from "lucide-react";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTicker, setFilterTicker] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "BUY" | "SELL">("ALL");

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get("/transactions/1");
      if (res.data?.data) {
        setTransactions(res.data.data);
      }
    } catch (err) {
      console.warn("Failed fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus catatan transaksi ini?")) return;
    try {
      await api.delete(`/transactions/${id}`);
      fetchTransactions();
    } catch (err) {
      alert("Gagal menghapus transaksi");
    }
  };

  const filtered = transactions.filter((tx) => {
    const matchTicker = filterTicker
      ? tx.ticker.toLowerCase().includes(filterTicker.toLowerCase())
      : true;
    const matchType = filterType === "ALL" ? true : tx.type === filterType;
    return matchTicker && matchType;
  });

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Riwayat Transaksi Saham" />

      <main className="p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Filters */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filter Ticker (misal: BBCA)..."
              value={filterTicker}
              onChange={(e) => setFilterTicker(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500 w-full sm:w-60"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {(["ALL", "BUY", "SELL"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  filterType === t
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {t === "ALL" ? "SEMUA" : t === "BUY" ? "BELI (BUY)" : "JUAL (SELL)"}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-xs text-slate-400">
                <tr>
                  <th className="py-3.5 px-6 font-semibold">TANGGAL</th>
                  <th className="py-3.5 px-4 font-semibold">TIPE</th>
                  <th className="py-3.5 px-4 font-semibold">EMITEN</th>
                  <th className="py-3.5 px-4 font-semibold">LOT (LEMBAR)</th>
                  <th className="py-3.5 px-4 font-semibold">HARGA / LEMBAR</th>
                  <th className="py-3.5 px-4 font-semibold">TOTAL NILAI</th>
                  <th className="py-3.5 px-4 font-semibold">CATATAN</th>
                  <th className="py-3.5 px-6 font-semibold text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.length > 0 ? (
                  filtered.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-4 px-6 text-slate-400 text-xs whitespace-nowrap">
                        {new Date(tx.transaction_date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-4 px-4">
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
                      <td className="py-4 px-4 font-bold text-slate-100">
                        {tx.ticker}
                      </td>
                      <td className="py-4 px-4 text-slate-200">
                        {tx.lots} Lot{" "}
                        <span className="text-xs text-slate-500">
                          ({tx.shares} lbr)
                        </span>
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-200">
                        {formatIDR(tx.price_per_share)}
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-100">
                        {formatIDR(tx.total_amount)}
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-400 max-w-[200px] truncate">
                        {tx.notes || "-"}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="Hapus Transaksi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-500">
                      {loading
                        ? "Memuat riwayat transaksi..."
                        : "Tidak ada transaksi yang cocok dengan filter."}
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
