"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Badge from "@/components/ui/Badge";
import { api, formatIDR } from "@/services/api";
import { ArrowDownRight, ArrowUpRight, Trash2, Filter } from "lucide-react";
import { AssetType } from "@/types";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTicker, setFilterTicker] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "BUY" | "SELL">("ALL");
  const [filterAsset, setFilterAsset] = useState<"ALL" | AssetType>("ALL");

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
    const matchAsset = filterAsset === "ALL" ? true : (tx.asset_type || "STOCK") === filterAsset;
    return matchTicker && matchType && matchAsset;
  });

  const formatPriceVal = (val: number, cur?: string) => {
    if (cur === "USD") return `$${Number(val).toLocaleString()}`;
    return formatIDR(val);
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Riwayat Transaksi Multi-Aset" />

      <main className="p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Filters */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Filter Simbol / Ticker..."
                value={filterTicker}
                onChange={(e) => setFilterTicker(e.target.value)}
                className="bg-zinc-950 border border-zinc-700 text-zinc-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-400 w-full sm:w-48"
              />
            </div>

            {/* Asset Class Filter */}
            <select
              value={filterAsset}
              onChange={(e) => setFilterAsset(e.target.value as any)}
              className="bg-zinc-950 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-400 w-full sm:w-auto"
            >
              <option value="ALL">Semua Kelas Aset</option>
              <option value="STOCK">Saham</option>
              <option value="CRYPTO">Kripto (Crypto)</option>
              <option value="ETF">ETF</option>
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
                    : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {t === "ALL" ? "SEMUA" : t === "BUY" ? "BELI (BUY)" : "JUAL (SELL)"}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-850 border-b border-zinc-800 text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-6">TANGGAL</th>
                  <th className="py-3 px-4">TIPE</th>
                  <th className="py-3 px-4">KELAS & ASET</th>
                  <th className="py-3 px-4">KUANTITAS</th>
                  <th className="py-3 px-4">HARGA / UNIT</th>
                  <th className="py-3 px-4">TOTAL NILAI</th>
                  <th className="py-3 px-4">CATATAN</th>
                  <th className="py-3 px-6 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {filtered.length > 0 ? (
                  filtered.map((tx) => {
                    const aType = tx.asset_type || "STOCK";
                    const isStock = aType === "STOCK";

                    return (
                      <tr key={tx.id} className="hover:bg-zinc-800/40 transition">
                        <td className="py-3.5 px-6 text-zinc-400 text-xs whitespace-nowrap">
                          {new Date(tx.transaction_date).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
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
                            <span className="font-semibold text-zinc-100">{tx.ticker}</span>
                          </div>
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
                          {formatPriceVal(tx.total_amount, tx.currency)}
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
                    <td colSpan={8} className="text-center py-12 text-zinc-500">
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

