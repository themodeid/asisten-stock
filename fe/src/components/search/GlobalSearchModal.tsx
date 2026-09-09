"use client";

import { useState, useEffect, useRef } from "react";
import { api, formatIDR } from "@/services/api";
import {
  Search,
  X,
  TrendingUp,
  TrendingDown,
  Plus,
  Check,
  Globe,
  Coins,
  Building2,
  Layers,
  ArrowRight,
} from "lucide-react";

export interface SearchResultItem {
  ticker: string;
  name: string;
  market: "US" | "IDX" | "CRYPTO" | "GLOBAL_ETF";
  asset_type: string;
  currency: "USD" | "IDR";
  price?: number;
  change_percent?: number;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTicker?: (ticker: string) => void;
}

export default function GlobalSearchModal({
  isOpen,
  onClose,
  onSelectTicker,
}: GlobalSearchModalProps) {
  const [query, setQuery] = useState("");
  const [marketFilter, setMarketFilter] = useState<"ALL" | "US" | "IDX" | "CRYPTO" | "GLOBAL_ETF">("ALL");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedTickers, setAddedTickers] = useState<Record<string, boolean>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      fetchResults("");
    } else {
      setQuery("");
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      fetchResults(query);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const fetchResults = async (q: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/market/search?q=${encodeURIComponent(q)}`);
      if (res.data?.data) {
        setResults(res.data.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWatchlist = async (e: React.MouseEvent, item: SearchResultItem) => {
    e.stopPropagation();
    try {
      await api.post("/watchlist", {
        user_id: 1,
        ticker: item.ticker,
        notes: `Ditambahkan dari Pencarian Global (${item.market})`,
      });
      setAddedTickers((prev) => ({ ...prev, [item.ticker]: true }));
      setTimeout(() => {
        setAddedTickers((prev) => ({ ...prev, [item.ticker]: false }));
      }, 2500);
    } catch {
      alert(`Gagal menambahkan ${item.ticker} ke watchlist`);
    }
  };

  const filteredResults = results.filter((item) => {
    if (marketFilter === "ALL") return true;
    return item.market === marketFilter;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-[#0c0e14] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Search Header Bar */}
        <div className="p-4 border-b border-white/[0.08] flex items-center gap-3 bg-white/[0.015]">
          <Search className="w-5 h-5 text-emerald-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari saham AS (AAPL, TSLA), Saham IDX (BBCA), Kripto (BTC), ETF..."
            className="flex-1 bg-transparent text-white text-sm sm:text-base outline-none placeholder:text-zinc-500 font-medium"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 rounded-full text-zinc-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline px-2 py-0.5 rounded-lg bg-zinc-800 border border-zinc-700 text-[11px] text-zinc-400 font-mono">
            ESC
          </kbd>
        </div>

        {/* Market Filter Chips */}
        <div className="px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.01] flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
          {[
            { key: "ALL", label: "Semua Aset" },
            { key: "US", label: "🇺🇸 Saham AS" },
            { key: "IDX", label: "🇮🇩 Saham IDX" },
            { key: "GLOBAL_ETF", label: "🌐 Global ETF" },
            { key: "CRYPTO", label: "🪙 Kripto" },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setMarketFilter(f.key as any)}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap transition border text-xs font-semibold ${
                marketFilter === f.key
                  ? "bg-white text-zinc-950 border-white shadow-sm font-bold"
                  : "bg-zinc-900 border-white/[0.06] text-zinc-400 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04] p-2">
          {loading ? (
            <div className="p-8 text-center text-xs text-zinc-400">
              <div className="inline-block w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mb-2" />
              <div>Memindai bursa global & IDX...</div>
            </div>
          ) : filteredResults.length > 0 ? (
            filteredResults.map((item) => {
              const isUp = (item.change_percent || 0) >= 0;
              const isAdded = addedTickers[item.ticker];

              return (
                <div
                  key={item.ticker}
                  onClick={() => {
                    if (onSelectTicker) onSelectTicker(item.ticker);
                    onClose();
                  }}
                  className="p-3 sm:p-3.5 rounded-2xl hover:bg-white/[0.04] transition flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Market Icon Badge */}
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/[0.08] flex items-center justify-center text-sm font-bold shrink-0">
                      {item.market === "US"
                        ? "🇺🇸"
                        : item.market === "IDX"
                        ? "🇮🇩"
                        : item.market === "CRYPTO"
                        ? "🪙"
                        : "🌐"}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm group-hover:text-emerald-300 transition">
                          {item.ticker}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.06] text-zinc-400 border border-white/[0.05]">
                          {item.market === "US"
                            ? "Saham AS"
                            : item.market === "IDX"
                            ? "Saham ID"
                            : item.market === "CRYPTO"
                            ? "Kripto"
                            : "Global ETF"}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 truncate max-w-[200px] sm:max-w-xs mt-0.5">
                        {item.name}
                      </div>
                    </div>
                  </div>

                  {/* Price & Action Button */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-black font-mono text-white">
                        {item.currency === "USD"
                          ? `$${Number(item.price || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : formatIDR(item.price || 0)}
                      </div>
                      {item.change_percent !== undefined && (
                        <div
                          className={`text-[11px] font-bold font-mono ${
                            isUp ? "text-[#00e676]" : "text-[#ff5252]"
                          }`}
                        >
                          {isUp ? "+" : ""}
                          {item.change_percent}%
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleAddToWatchlist(e, item)}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 border ${
                        isAdded
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border-white/[0.08]"
                      }`}
                      title="Pantau di Watchlist"
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="hidden sm:inline">Terpantau</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Pantau</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-zinc-500">
              Tidak ada aset yang cocok dengan &quot;{query}&quot;.
              <div className="mt-1 text-zinc-600">
                Coba cari ticker seperti AAPL, TSLA, NVDA, VT, BTC, atau BBCA.
              </div>
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-4 py-2.5 bg-white/[0.02] border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-500">
          <span>💡 Ketik nama atau kode emiten luar/dalam negeri</span>
          <span>Bursa US, Global ETF, Crypto & IDX</span>
        </div>
      </div>
    </div>
  );
}
