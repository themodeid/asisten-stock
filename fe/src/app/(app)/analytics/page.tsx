"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import Badge from "@/components/ui/Badge";
import { api, formatIDR } from "@/services/api";
import { Search, Sparkles, TrendingUp, DollarSign, Activity, Percent, ShieldCheck } from "lucide-react";

const POPULAR_TICKERS = ["BBCA", "BBRI", "BMRI", "TLKM", "ASII", "GOTO", "ICBP", "UNVR"];

export default function AnalyticsPage() {
  const [ticker, setTicker] = useState("BBCA");
  const [quote, setQuote] = useState<any>(null);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const fetchQuote = async (searchTicker: string) => {
    try {
      setLoading(true);
      setAiReport(null);
      const res = await api.get(`/market/quote/${searchTicker}`);
      if (res.data?.data) {
        setQuote(res.data.data);
      }
    } catch (err) {
      console.warn("Failed fetching quote:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker) return;
    fetchQuote(ticker);
  };

  const runAiAnalysis = async () => {
    if (!quote) return;
    try {
      setAnalyzing(true);
      const res = await api.post("/gemini/chat", {
        user_id: 1,
        message: `Tolong berikan analisis fundamental dan valuasi mendalam untuk saham ${quote.ticker}. Apakah valuasinya wajar, undervalued, atau overvalued? Berikan ringkasan prospeknya.`,
      });
      if (res.data?.data?.replyText) {
        setAiReport(res.data.data.replyText);
      }
    } catch (err) {
      alert("Gagal menjalankan analisa AI");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header title="AI Stock Analyst & Research Hub" />

      <main className="p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Search & Popular Tickers */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Masukkan Kode Saham (contoh: BBCA, BBRI, BMRI, TLKM)..."
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-9 pr-4 py-2 text-zinc-100 placeholder-zinc-500 font-medium text-xs focus:outline-none focus:border-zinc-400 uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold text-xs shadow-sm transition flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Search className="w-3.5 h-3.5 text-zinc-900" /> Cari Emiten
            </button>
          </form>

          {/* Quick Ticker Chips */}
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-zinc-800">
            <span className="text-[11px] text-zinc-400 font-medium mr-1">
              Emiten Populer:
            </span>
            {POPULAR_TICKERS.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTicker(t);
                  fetchQuote(t);
                }}
                className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700/80 text-[11px] font-medium text-zinc-300 transition"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Stock Overview Card */}
        {quote && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header info */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
                    {quote.ticker}
                  </h1>
                  <Badge
                    variant={
                      quote.regularMarketChange >= 0 ? "success" : "danger"
                    }
                  >
                    {quote.regularMarketChange >= 0 ? "+" : ""}
                    {quote.regularMarketChangePercent?.toFixed(2)}%
                  </Badge>
                </div>
                <p className="text-zinc-400 text-xs mt-1">{quote.name}</p>
                <div className="text-2xl font-bold text-zinc-100 mt-3">
                  {formatIDR(quote.regularMarketPrice)}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={runAiAnalysis}
                  disabled={analyzing}
                  className="px-5 py-2.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold text-xs shadow-sm transition flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4 text-zinc-900" />
                  {analyzing ? "Gemini Sedang Menganalisis..." : "Analisis Mendalam AI"}
                </button>
              </div>
            </div>

            {/* Valuation Ratios Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                  <Activity className="w-3.5 h-3.5 text-zinc-400" />
                  P/E RATIO (PER)
                </div>
                <div className="text-xl font-bold text-zinc-100 mt-2">
                  {quote.trailingPE ? `${quote.trailingPE.toFixed(1)}x` : "N/A"}
                </div>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Valuasi Laba Bersih
                </p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                  <DollarSign className="w-3.5 h-3.5 text-zinc-400" />
                  PRICE TO BOOK (PBV)
                </div>
                <div className="text-xl font-bold text-zinc-100 mt-2">
                  {quote.priceToBook ? `${quote.priceToBook.toFixed(1)}x` : "N/A"}
                </div>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Valuasi Nilai Buku
                </p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                  <Percent className="w-3.5 h-3.5 text-zinc-400" />
                  RETURN ON EQUITY (ROE)
                </div>
                <div className="text-xl font-bold text-zinc-100 mt-2">
                  {quote.returnOnEquity ? `${quote.returnOnEquity.toFixed(1)}%` : "N/A"}
                </div>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Efisiensi Profitabilitas
                </p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                  DIVIDEND YIELD
                </div>
                <div className="text-xl font-bold text-zinc-100 mt-2">
                  {quote.dividendYield ? `${quote.dividendYield.toFixed(1)}%` : "N/A"}
                </div>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Imbal Hasil Dividen
                </p>
              </div>
            </div>

            {/* AI Report Card */}
            {aiReport && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm relative overflow-hidden animate-scaleUp">
                <div className="flex items-center gap-2 text-zinc-200 font-semibold text-xs mb-3">
                  <Sparkles className="w-4 h-4 text-zinc-300" />
                  Laporan Analisis AI Gemini 2.5 Flash
                </div>
                <div className="text-zinc-300 text-xs leading-relaxed whitespace-pre-wrap font-sans">
                  {aiReport}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
