"use client";

import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Badge from "@/components/ui/Badge";
import { api, formatIDR } from "@/services/api";
import {
  Search,
  Sparkles,
  TrendingUp,
  DollarSign,
  Activity,
  Percent,
  ShieldCheck,
  BarChart3,
  Globe,
  Layers,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Copy,
  Check,
  Newspaper,
  Scale,
} from "lucide-react";
import Link from "next/link";
import { AssetType } from "@/types";

interface AssetCategory {
  category: string;
  items: { ticker: string; label: string; type: AssetType }[];
}

const POPULAR_CATEGORIES: AssetCategory[] = [
  {
    category: "Saham IDX",
    items: [
      { ticker: "BBCA", label: "BBCA (BCA)", type: "STOCK" },
      { ticker: "BBRI", label: "BBRI (BRI)", type: "STOCK" },
      { ticker: "BMRI", label: "BMRI (Mandiri)", type: "STOCK" },
      { ticker: "TLKM", label: "TLKM (Telkom)", type: "STOCK" },
      { ticker: "ASII", label: "ASII (Astra)", type: "STOCK" },
      { ticker: "GOTO", label: "GOTO (Gojek)", type: "STOCK" },
    ],
  },
  {
    category: "Kripto (Crypto)",
    items: [
      { ticker: "BTC", label: "BTC (Bitcoin)", type: "CRYPTO" },
      { ticker: "ETH", label: "ETH (Ethereum)", type: "CRYPTO" },
      { ticker: "SOL", label: "SOL (Solana)", type: "CRYPTO" },
      { ticker: "USDT", label: "USDT (Tether)", type: "CRYPTO" },
    ],
  },
  {
    category: "ETF Global",
    items: [
      { ticker: "VT", label: "VT (World Total)", type: "ETF" },
      { ticker: "VOO", label: "VOO (S&P 500)", type: "ETF" },
      { ticker: "SPY", label: "SPY (S&P 500)", type: "ETF" },
      { ticker: "QQQ", label: "QQQ (Nasdaq 100)", type: "ETF" },
    ],
  },
  {
    category: "Logam Mulia",
    items: [{ ticker: "EMAS", label: "EMAS (Antam/UBS)", type: "GOLD" }],
  },
];

export default function AnalyticsPage() {
  const [ticker, setTicker] = useState("VT");
  const [activeCategory, setActiveCategory] = useState<string>("ETF Global");
  const [quote, setQuote] = useState<any>(null);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);

  const handleCopyReport = () => {
    if (aiReport && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(aiReport);
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2000);
    }
  };

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

  useEffect(() => {
    fetchQuote("VT");
  }, []);

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
        message: `Tolong berikan analisis riset fundamental, laporan keuangan, dan valuasi komprehensif tingkat analis profesional untuk aset ${quote.ticker} (${quote.name}).
Sertakan struktur berikut secara rapi dan profesional:
1. Ringkasan Profil & Posisi Pasar
2. Evaluasi Metrik Keuangan & Valuasi (P/E Ratio, PBV, ROE, EPS, Dividend Yield, serta perbandingan dengan rata-rata sektor)
3. Katalis Pasar, Rilis Berita & Sentimen Terkini
4. Kesimpulan Valuasi: Apakah aset ini sedang Diskon/Murah (Undervalued), Wajar (Fair Value), atau Mahal (Overvalued/Growth Premium)?
5. Rekomendasi Alokasi Portofolio & Tindakan Strategis (Strategi DCA vs Wait & See).`,
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

  const getAssetType = (q: any): AssetType => {
    const t = (q?.ticker || "").toUpperCase();
    if (t.includes("BTC") || t.includes("ETH") || t.includes("SOL") || t.includes("USDT")) return "CRYPTO";
    if (t === "VT" || t === "VOO" || t === "SPY" || t === "QQQ" || t === "VTI" || t === "VXUS") return "ETF";
    if (t.includes("GOLD") || t.includes("EMAS") || t.includes("ANTAM")) return "GOLD";
    return "STOCK";
  };

  const formatPrice = (price: number, currency: string) => {
    if (!price && price !== 0) return "-";
    if (currency === "USD") {
      return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return formatIDR(price);
  };

  const formatVolume = (vol: number) => {
    if (!vol) return "-";
    if (vol >= 1_000_000_000_000) return `${(vol / 1_000_000_000_000).toFixed(2)} Triliun`;
    if (vol >= 1_000_000_000) return `${(vol / 1_000_000_000).toFixed(2)} Miliar`;
    if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(2)} Juta`;
    return vol.toLocaleString("id-ID");
  };

  const getTradingViewSymbol = (tickerStr: string) => {
    const t = (tickerStr || "").toUpperCase();
    if (t.includes("BTC")) return "BITSTAMP:BTCUSD";
    if (t.includes("ETH")) return "BITSTAMP:ETHUSD";
    if (t.includes("SOL")) return "BITSTAMP:SOLUSD";
    if (t.includes("USDT")) return "COINBASE:USDTUSD";
    if (t === "VT") return "AMEX:VT";
    if (t === "VOO") return "AMEX:VOO";
    if (t === "SPY") return "AMEX:SPY";
    if (t === "QQQ") return "NASDAQ:QQQ";
    if (t.includes("BBCA")) return "IDX:BBCA";
    if (t.includes("BBRI")) return "IDX:BBRI";
    if (t.includes("BMRI")) return "IDX:BMRI";
    if (t.includes("TLKM")) return "IDX:TLKM";
    if (t.includes("ASII")) return "IDX:ASII";
    if (t.includes("GOTO")) return "IDX:GOTO";
    if (t.includes("EMAS") || t.includes("GOLD")) return "TVC:GOLD";
    if (t.includes(".JK")) return `IDX:${t.replace(".JK", "")}`;
    return `NASDAQ:${t}`;
  };

  const getValuationBadge = (status?: string) => {
    switch (status) {
      case "Undervalued":
        return { label: "Diskon / Undervalued", color: "bg-emerald-950/80 border-emerald-700/80 text-emerald-300" };
      case "Overvalued":
        return { label: "Mahal / Overvalued", color: "bg-red-950/80 border-red-700/80 text-red-300" };
      case "Growth Premium":
        return { label: "Growth Premium", color: "bg-purple-950/80 border-purple-700/80 text-purple-300" };
      default:
        return { label: "Valuasi Wajar (Fair Value)", color: "bg-blue-950/80 border-blue-700/80 text-blue-300" };
    }
  };

  const assetType = quote ? getAssetType(quote) : "STOCK";
  const isUSD = quote?.currency === "USD";
  const rateToIDR = 15800;
  const tvSymbol = quote ? getTradingViewSymbol(quote.ticker) : "BITSTAMP:BTCUSD";

  // Calculate 52-week position percentage
  const low52 = quote?.fiftyTwoWeekLow || (quote?.regularMarketPrice ? quote.regularMarketPrice * 0.8 : 0);
  const high52 = quote?.fiftyTwoWeekHigh || (quote?.regularMarketPrice ? quote.regularMarketPrice * 1.2 : 100);
  const currentPrice = quote?.regularMarketPrice || 0;
  const range52Percent = high52 > low52 ? Math.min(100, Math.max(0, ((currentPrice - low52) / (high52 - low52)) * 100)) : 50;

  return (
    <div className="flex-1 flex flex-col">
      <Header title="AI Multi-Asset Analyst & Research Hub" />

      <main className="p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Search & Popular Category Tabs */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari simbol saham, kripto, ETF, atau emas (contoh: BBCA, BTC, VT, BBRI, EMAS)..."
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-9 pr-4 py-2 text-zinc-100 placeholder-zinc-500 font-medium text-xs focus:outline-none focus:border-zinc-400 uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold text-xs shadow-sm transition flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Search className="w-3.5 h-3.5 text-zinc-900" /> Cari Aset
            </button>
          </form>

          {/* Category Tabs & Quick Chips */}
          <div className="pt-2 border-t border-zinc-800/80 space-y-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              {POPULAR_CATEGORIES.map((cat) => (
                <button
                  key={cat.category}
                  onClick={() => setActiveCategory(cat.category)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                    activeCategory === cat.category
                      ? "bg-zinc-800 text-zinc-100 border border-zinc-700 font-semibold"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {cat.category}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {POPULAR_CATEGORIES.find((c) => c.category === activeCategory)?.items.map((item) => (
                <button
                  key={item.ticker}
                  onClick={() => {
                    setTicker(item.ticker);
                    fetchQuote(item.ticker);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition border ${
                    quote?.ticker?.startsWith(item.ticker)
                      ? "bg-zinc-100 text-zinc-900 font-bold border-zinc-200"
                      : "bg-zinc-850 hover:bg-zinc-750 text-zinc-300 border-zinc-750 hover:border-zinc-600"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center text-zinc-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-zinc-300" />
            Mengambil data pasar real-time & laporan fundamental...
          </div>
        )}

        {/* Asset Overview Card */}
        {!loading && quote && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header info */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {assetType}
                  </span>
                  <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
                    {quote.ticker}
                  </h1>
                  <Badge variant={quote.regularMarketChange >= 0 ? "success" : "danger"}>
                    {quote.regularMarketChange >= 0 ? "+" : ""}
                    {quote.regularMarketChangePercent?.toFixed(2)}%
                  </Badge>
                </div>
                <p className="text-zinc-400 text-xs mt-1">{quote.name}</p>

                {/* Primary Price with USD/IDR Conversion */}
                <div className="mt-3">
                  <div className="text-2xl md:text-3xl font-bold text-zinc-100">
                    {formatPrice(quote.regularMarketPrice, quote.currency)}
                    <span className="text-xs text-zinc-400 font-normal ml-2">
                      {assetType === "GOLD" ? "/ gram" : assetType === "STOCK" ? "/ lembar" : "/ unit"}
                    </span>
                  </div>
                  {isUSD && (
                    <p className="text-xs text-zinc-400 mt-1">
                      Setara ~{formatIDR(quote.regularMarketPrice * rateToIDR)} (Estimasi Kurs: Rp 15.800/USD)
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={runAiAnalysis}
                  disabled={analyzing}
                  className="px-5 py-2.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold text-xs shadow-sm transition flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4 text-zinc-900" />
                  {analyzing ? "AI Sedang Menganalisis..." : "Riset Valuasi Mendalam AI"}
                </button>
                <Link
                  href="/portfolio"
                  className="px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-300 border border-zinc-700 text-xs font-semibold transition flex items-center justify-center gap-1.5"
                >
                  Catat ke Portofolio <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Valuation Verdict Banner */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-zinc-300" />
                  <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                    Status Valuasi & Ringkasan Analis
                  </h3>
                </div>
                {(() => {
                  const badge = getValuationBadge(quote.valuationStatus);
                  return (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${badge.color}`}>
                      {badge.label}
                    </span>
                  );
                })()}
              </div>

              {quote.valuationSummary ? (
                <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800/80 text-xs text-zinc-300 leading-relaxed">
                  <span className="font-semibold text-zinc-200">Diagnostik Fundamental: </span>
                  {quote.valuationSummary}
                </div>
              ) : (
                <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800/80 text-xs text-zinc-400">
                  Valuasi mencerminkan dinamika likuiditas pasar dan metrik pertumbuhan sektor terkait.
                </div>
              )}

              {/* 52-Week Range Bar */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1.5 font-medium">
                  <span>52-Week Low: {formatPrice(low52, quote.currency)}</span>
                  <span className="text-zinc-200 font-semibold">Posisi Rentang 1 Tahun ({range52Percent.toFixed(0)}%)</span>
                  <span>52-Week High: {formatPrice(high52, quote.currency)}</span>
                </div>
                <div className="relative h-2.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400 rounded-full"
                    style={{ width: `${range52Percent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Financial Multiples & Statement Metrics Grid */}
            {assetType === "STOCK" && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                    <Activity className="w-3.5 h-3.5 text-zinc-400" />
                    P/E RATIO (PER)
                  </div>
                  <div className="text-xl font-bold text-zinc-100 mt-2">
                    {quote.trailingPE ? `${quote.trailingPE.toFixed(1)}x` : "N/A"}
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    {quote.forwardPE ? `Fwd: ${quote.forwardPE.toFixed(1)}x` : "Valuasi Laba Bersih"}
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
                  <p className="text-[10px] text-zinc-500 mt-0.5">Valuasi Nilai Buku</p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                    <Percent className="w-3.5 h-3.5 text-emerald-400" />
                    RETURN ON EQUITY (ROE)
                  </div>
                  <div className="text-xl font-bold text-zinc-100 mt-2">
                    {quote.returnOnEquity ? `${quote.returnOnEquity.toFixed(1)}%` : "N/A"}
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Efisiensi Profitabilitas</p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                    DIVIDEND YIELD
                  </div>
                  <div className="text-xl font-bold text-zinc-100 mt-2">
                    {quote.dividendYield ? `${quote.dividendYield.toFixed(1)}%` : "0.0%"}
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Yield Dividen Tahunan</p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    EPS (LABA PER SAHAM)
                  </div>
                  <div className="text-xl font-bold text-zinc-100 mt-2">
                    {quote.eps ? (isUSD ? `$${quote.eps}` : `Rp ${quote.eps}`) : "N/A"}
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Earnings Per Share</p>
                </div>
              </div>
            )}

            {assetType === "ETF" && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                    <Activity className="w-3.5 h-3.5 text-zinc-400" />
                    P/E RATIO INDEKS
                  </div>
                  <div className="text-xl font-bold text-zinc-100 mt-2">
                    {quote.trailingPE ? `${quote.trailingPE.toFixed(1)}x` : "18.2x"}
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Weighted Aggregate PE</p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                    <DollarSign className="w-3.5 h-3.5 text-zinc-400" />
                    PRICE TO BOOK (PBV)
                  </div>
                  <div className="text-xl font-bold text-zinc-100 mt-2">
                    {quote.priceToBook ? `${quote.priceToBook.toFixed(1)}x` : "2.1x"}
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Nilai Buku Indeks</p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    DIVIDEND YIELD
                  </div>
                  <div className="text-xl font-bold text-zinc-100 mt-2">
                    {quote.dividendYield ? `${quote.dividendYield.toFixed(2)}%` : "1.95%"}
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Distribusi Hasil Pasif</p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                    <Layers className="w-3.5 h-3.5 text-zinc-400" />
                    STRUKTUR INDEKS
                  </div>
                  <div className="text-sm font-bold text-zinc-200 mt-2">
                    World Index Tracker
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Diversifikasi 9.800+ Saham</p>
                </div>
              </div>
            )}

            {assetType === "CRYPTO" && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                    <Globe className="w-3.5 h-3.5 text-zinc-400" />
                    KAPITALISASI PASAR
                  </div>
                  <div className="text-lg font-bold text-zinc-100 mt-2">
                    {quote.marketCap ? `$${(quote.marketCap / 1e9).toFixed(2)}B` : "$1.27T"}
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Market Cap Sirkulasi Global</p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                    <BarChart3 className="w-3.5 h-3.5 text-zinc-400" />
                    VOLUME 24 JAM
                  </div>
                  <div className="text-lg font-bold text-zinc-100 mt-2">
                    {quote.regularMarketVolume ? `$${(quote.regularMarketVolume / 1e9).toFixed(2)}B` : "$28.0B"}
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Likuiditas Transaksi Bursa</p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    52-WEEK HIGH (ATH)
                  </div>
                  <div className="text-lg font-bold text-zinc-100 mt-2">
                    {formatPrice(quote.fiftyTwoWeekHigh || 73750, quote.currency)}
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Puncak Tertinggi 1 Tahun</p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                    <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
                    52-WEEK LOW
                  </div>
                  <div className="text-lg font-bold text-zinc-100 mt-2">
                    {formatPrice(quote.fiftyTwoWeekLow || 26500, quote.currency)}
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Dasar Terendah 1 Tahun</p>
                </div>
              </div>
            )}

            {assetType === "GOLD" && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    HARGA BELI EMAS
                  </div>
                  <div className="text-lg font-bold text-zinc-100 mt-2">
                    {formatIDR(quote.regularMarketPrice)}
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Harga Dasar Antam / Gram</p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                    <DollarSign className="w-3.5 h-3.5 text-zinc-400" />
                    ESTIMASI BUYBACK
                  </div>
                  <div className="text-lg font-bold text-zinc-100 mt-2">
                    {formatIDR(quote.regularMarketPrice * 0.91)}
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Harga Jual Kembali (~91%)</p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                    <Activity className="w-3.5 h-3.5 text-zinc-400" />
                    RENTANG HARGA HARI INI
                  </div>
                  <div className="text-xs font-bold text-zinc-100 mt-2">
                    {formatIDR(quote.regularMarketDayLow)} - {formatIDR(quote.regularMarketDayHigh)}
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Low - High Fluktuasi</p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    KLASIFIKASI ASET
                  </div>
                  <div className="text-sm font-bold text-emerald-300 mt-2">
                    Safe Haven
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Lindung Nilai Inflasi & Krisis</p>
                </div>
              </div>
            )}

            {/* Market News & Catalysts Section */}
            {quote.news && quote.news.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-zinc-300" />
                  <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                    Berita Terkini & Katalis Fundamental
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {quote.news.map((item: any, idx: number) => (
                    <div key={idx} className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800/80 flex flex-col justify-between space-y-2">
                      <p className="text-xs font-medium text-zinc-200 leading-snug line-clamp-2">
                        {item.title}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-zinc-900">
                        <span>{item.source} • {item.time}</span>
                        <span className={`px-1.5 py-0.5 rounded font-semibold ${
                          item.sentiment === "positive"
                            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                            : item.sentiment === "cautious"
                            ? "bg-red-950/60 text-red-400 border border-red-800/40"
                            : "bg-zinc-800 text-zinc-300"
                        }`}>
                          {item.sentiment === "positive" ? "Positif" : item.sentiment === "cautious" ? "Hati-hati" : "Netral"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TradingView Interactive Real-Time Chart */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-zinc-300" />
                  <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                    Grafik Live & Candlestick Real-Time (TradingView)
                  </h3>
                </div>
                <div className="text-[11px] text-zinc-400 font-medium flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Feed: <span className="text-zinc-200 font-semibold">{tvSymbol}</span>
                </div>
              </div>
              <div className="h-[430px] w-full rounded-lg overflow-hidden border border-zinc-800/80 bg-zinc-950">
                <iframe
                  key={tvSymbol}
                  src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${encodeURIComponent(
                    tvSymbol
                  )}&interval=D&hidesidetoolbar=1&symboledit=1&saveimage=1&toolbarbg=18181b&studies=[]&theme=dark&style=1&timezone=Asia%2FJakarta&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=id&utm_source=localhost`}
                  className="w-full h-full border-0"
                />
              </div>
            </div>

            {/* AI Deep Report Card */}
            {aiReport && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm relative overflow-hidden animate-scaleUp">
                <div className="flex items-center justify-between gap-2 text-zinc-200 font-semibold text-xs mb-3 pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-zinc-300" />
                    <span>Laporan Riset & Valuasi Jarvis AI Analyst</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyReport}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium border transition ${
                      copiedReport
                        ? "bg-emerald-950/60 border-emerald-800/60 text-emerald-300 font-semibold"
                        : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700/80"
                    }`}
                    title="Salin isi laporan analisis"
                  >
                    {copiedReport ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-zinc-300" />
                        <span>Salin Teks</span>
                      </>
                    )}
                  </button>
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

