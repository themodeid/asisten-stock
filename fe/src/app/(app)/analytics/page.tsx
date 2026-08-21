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

      <main className="p-8 space-y-8 max-w-7xl w-full mx-auto">
        {/* Search & Popular Tickers */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Masukkan Kode Saham (contoh: BBCA, BBRI, BMRI, TLKM)..."
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl pl-12 pr-4 py-3 text-slate-100 placeholder-slate-500 font-medium focus:outline-none focus:border-blue-500 uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md shadow-blue-600/30 transition flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" /> Cari Emiten
            </button>
          </form>

          {/* Quick Ticker Chips */}
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-800/80">
            <span className="text-xs text-slate-400 font-semibold mr-1">
              Emiten Populer:
            </span>
            {POPULAR_TICKERS.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTicker(t);
                  fetchQuote(t);
                }}
                className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300 transition"
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
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-extrabold text-white tracking-tight">
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
                <p className="text-slate-400 text-sm mt-1">{quote.name}</p>
                <div className="text-3xl font-bold text-slate-100 mt-4">
                  {formatIDR(quote.regularMarketPrice)}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={runAiAnalysis}
                  disabled={analyzing}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-500/20 transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {analyzing ? "Gemini Sedang Menganalisis..." : "Analisis Mendalam AI"}
                </button>
              </div>
            </div>

            {/* Valuation Ratios Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <Activity className="w-4 h-4 text-blue-400" />
                  P/E RATIO (PER)
                </div>
                <div className="text-2xl font-bold text-slate-100 mt-2">
                  {quote.trailingPE ? `${quote.trailingPE.toFixed(1)}x` : "N/A"}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Valuasi Laba Bersih
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <DollarSign className="w-4 h-4 text-indigo-400" />
                  PRICE TO BOOK (PBV)
                </div>
                <div className="text-2xl font-bold text-slate-100 mt-2">
                  {quote.priceToBook ? `${quote.priceToBook.toFixed(1)}x` : "N/A"}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Valuasi Nilai Buku
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <Percent className="w-4 h-4 text-emerald-400" />
                  RETURN ON EQUITY (ROE)
                </div>
                <div className="text-2xl font-bold text-slate-100 mt-2">
                  {quote.returnOnEquity ? `${quote.returnOnEquity.toFixed(1)}%` : "N/A"}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Efisiensi Profitabilitas
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  DIVIDEND YIELD
                </div>
                <div className="text-2xl font-bold text-slate-100 mt-2">
                  {quote.dividendYield ? `${quote.dividendYield.toFixed(1)}%` : "N/A"}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Imbal Hasil Dividen
                </p>
              </div>
            </div>

            {/* AI Report Card */}
            {aiReport && (
              <div className="bg-slate-900 border border-blue-500/30 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden animate-scaleUp">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm mb-4">
                  <Sparkles className="w-5 h-5" />
                  Laporan Analisis AI Gemini 2.5 Flash
                </div>
                <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
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
