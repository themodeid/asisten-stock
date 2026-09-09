"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFxRate } from "@/services/fxRate";
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
  AlertCircle,
  ExternalLink,
  Target,
  HelpCircle,
  Zap,
  CheckCircle2,
  TrendingDown,
  Info,
} from "lucide-react";
import Link from "next/link";
import { AssetType } from "@/types";
import AiAnalystReportCard from "@/components/analytics/AiAnalystReportCard";

interface AssetCategory {
  category: string;
  badge?: string;
  items: { ticker: string; label: string; type: AssetType }[];
}

const POPULAR_CATEGORIES: AssetCategory[] = [
  {
    category: "Saham IDX",
    badge: "🇮🇩 IDX",
    items: [
      { ticker: "BBCA", label: "BBCA (Bank BCA)", type: "STOCK" },
      { ticker: "BBRI", label: "BBRI (Bank BRI)", type: "STOCK" },
      { ticker: "BMRI", label: "BMRI (Bank Mandiri)", type: "STOCK" },
      { ticker: "TLKM", label: "TLKM (Telkom)", type: "STOCK" },
      { ticker: "ASII", label: "ASII (Astra Int)", type: "STOCK" },
      { ticker: "GOTO", label: "GOTO (GoTo)", type: "STOCK" },
    ],
  },
  {
    category: "Saham US (Megacap)",
    badge: "🇺🇸 US",
    items: [
      { ticker: "GOOGL", label: "GOOGL (Alphabet/Google)", type: "STOCK" },
      { ticker: "AAPL", label: "AAPL (Apple)", type: "STOCK" },
      { ticker: "NVDA", label: "NVDA (Nvidia)", type: "STOCK" },
      { ticker: "MSFT", label: "MSFT (Microsoft)", type: "STOCK" },
      { ticker: "TSLA", label: "TSLA (Tesla)", type: "STOCK" },
      { ticker: "AMZN", label: "AMZN (Amazon)", type: "STOCK" },
    ],
  },
  {
    category: "ETF Global",
    badge: "🌐 ETF",
    items: [
      { ticker: "VT", label: "VT (Vanguard Total World)", type: "ETF" },
      { ticker: "VOO", label: "VOO (Vanguard S&P 500)", type: "ETF" },
      { ticker: "SPY", label: "SPY (SPDR S&P 500)", type: "ETF" },
      { ticker: "QQQ", label: "QQQ (Invesco Nasdaq 100)", type: "ETF" },
    ],
  },
  {
    category: "Kripto (Crypto)",
    badge: "🪙 Kripto",
    items: [
      { ticker: "BTC", label: "BTC (Bitcoin)", type: "CRYPTO" },
      { ticker: "ETH", label: "ETH (Ethereum)", type: "CRYPTO" },
      { ticker: "SOL", label: "SOL (Solana)", type: "CRYPTO" },
      { ticker: "USDT", label: "USDT (Tether)", type: "CRYPTO" },
    ],
  },
  {
    category: "Logam Mulia",
    badge: "🥇 Emas",
    items: [{ ticker: "EMAS", label: "EMAS (Antam / UBS)", type: "GOLD" }],
  },
];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { rate: fxRate } = useFxRate();
  const [ticker, setTicker] = useState("VT");
  const [activeCategory, setActiveCategory] = useState<string>("ETF Global");
  const [quote, setQuote] = useState<any>(null);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [tickerNews, setTickerNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
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
      setErrorMsg(null);
      setAiReport(null);
      const cleanTicker = searchTicker.trim();
      const res = await api.get(`/market/quote/${encodeURIComponent(cleanTicker)}`);
      if (res.data?.data) {
        setQuote(res.data.data);
      }
      // Fetch related live news for this ticker
      try {
        const newsRes = await api.get(`/news/ticker/${encodeURIComponent(cleanTicker)}`);
        if (newsRes.data?.data) {
          setTickerNews(newsRes.data.data);
        } else {
          setTickerNews([]);
        }
      } catch {
        setTickerNews([]);
      }
    } catch (err: any) {
      console.warn("Failed fetching quote:", err);
      setQuote(null);
      setTickerNews([]);
      const msg =
        err.response?.data?.message ||
        `Simbol "${searchTicker}" tidak ditemukan di bursa. Pastikan kode ticker sudah benar (contoh: BBCA, BBRI, GOOGL, AAPL, BTC, VT).`;
      setErrorMsg(msg);
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
        user_id: user?.id || 1,
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
      alert("Gagal menjalankan analisa AI. Silakan coba sesaat lagi.");
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

  const getTradingViewSymbol = (tickerStr: string) => {
    const t = (tickerStr || "").toUpperCase();
    if (t.includes("BTC")) return "BITSTAMP:BTCUSD";
    if (t.includes("ETH")) return "BITSTAMP:ETHUSD";
    if (t.includes("SOL")) return "BITSTAMP:SOLUSD";
    if (t.includes("USDT")) return "COINBASE:USDTUSD";
    if (t.includes("DOGE")) return "BINANCE:DOGEUSDT";
    if (t === "VT") return "AMEX:VT";
    if (t === "VOO") return "AMEX:VOO";
    if (t === "SPY") return "AMEX:SPY";
    if (t === "QQQ") return "NASDAQ:QQQ";
    if (t === "VTI") return "AMEX:VTI";
    if (t === "VXUS") return "NASDAQ:VXUS";
    if (t === "GOOGL" || t === "GOOG" || t === "GOOGLE" || t === "ALPHABET") return "NASDAQ:GOOGL";
    if (t === "AAPL" || t === "APPLE") return "NASDAQ:AAPL";
    if (t === "TSLA" || t === "TESLA") return "NASDAQ:TSLA";
    if (t === "NVDA" || t === "NVIDIA") return "NASDAQ:NVDA";
    if (t === "MSFT" || t === "MICROSOFT") return "NASDAQ:MSFT";
    if (t === "AMZN" || t === "AMAZON") return "NASDAQ:AMZN";
    if (t === "META" || t === "FACEBOOK") return "NASDAQ:META";
    if (t === "NFLX" || t === "NETFLIX") return "NASDAQ:NFLX";
    if (t.includes("BBCA")) return "IDX:BBCA";
    if (t.includes("BBRI")) return "IDX:BBRI";
    if (t.includes("BMRI")) return "IDX:BMRI";
    if (t.includes("TLKM")) return "IDX:TLKM";
    if (t.includes("ASII")) return "IDX:ASII";
    if (t.includes("GOTO")) return "IDX:GOTO";
    if (t.includes("BBNI")) return "IDX:BBNI";
    if (t.includes("ANTM")) return "IDX:ANTM";
    if (t.includes("INDF")) return "IDX:INDF";
    if (t.includes("ICBP")) return "IDX:ICBP";
    if (t.includes("UNVR")) return "IDX:UNVR";
    if (t.includes("EMAS") || t.includes("GOLD")) return "TVC:GOLD";
    if (t.includes(".JK")) return `IDX:${t.replace(".JK", "")}`;
    return `NASDAQ:${t}`;
  };

  const getValuationBadge = (status?: string) => {
    switch (status) {
      case "Undervalued":
        return {
          label: "🟢 Diskon / Undervalued",
          color: "bg-emerald-950/90 border-emerald-500/50 text-emerald-300",
          desc: "Harga pasar saat ini berada di bawah estimasi nilai wajar fundamental.",
        };
      case "Overvalued":
        return {
          label: "🔴 Mahal / Overvalued",
          color: "bg-rose-950/90 border-rose-500/50 text-rose-300",
          desc: "Harga pasar saat ini diperdagangkan dengan premi tinggi di atas nilai wajarnya.",
        };
      case "Growth Premium":
        return {
          label: "🟣 Growth Premium",
          color: "bg-purple-950/90 border-purple-500/50 text-purple-300",
          desc: "Pasar rela membayar premi valuasi tinggi karena prospek lonjakan laba masa depan yang masif.",
        };
      default:
        return {
          label: "🔵 Valuasi Wajar (Fair Value)",
          color: "bg-blue-950/90 border-blue-500/50 text-blue-300",
          desc: "Harga pasar saat ini seimbang mencerminkan kinerja keuangan dan rata-rata industri.",
        };
    }
  };

  // Helper interpretations for financial multiples
  const getPeInterpretation = (pe?: number) => {
    if (!pe || pe <= 0)
      return {
        badge: "N/A / Merugi",
        color: "text-zinc-400 bg-zinc-800/80 border-zinc-700/60",
        hint: "Emiten belum membukukan laba positif",
      };
    if (pe < 12)
      return {
        badge: "🟢 Sangat Murah (<12x)",
        color: "text-emerald-300 bg-emerald-950/70 border-emerald-700/60",
        hint: "Valuasi di bawah rata-rata historis (potensi diskon)",
      };
    if (pe <= 22)
      return {
        badge: "🔵 Valuasi Wajar (12-22x)",
        color: "text-blue-300 bg-blue-950/70 border-blue-700/60",
        hint: "Harga sebanding dengan laba riil tahunan",
      };
    return {
      badge: "🟣 Growth Premium (>22x)",
      color: "text-purple-300 bg-purple-950/70 border-purple-700/60",
      hint: "Ekspektasi pertumbuhan tinggi di masa depan",
    };
  };

  const getPbvInterpretation = (pbv?: number) => {
    if (!pbv || pbv <= 0)
      return {
        badge: "N/A",
        color: "text-zinc-400 bg-zinc-800/80 border-zinc-700/60",
        hint: "Nilai buku belum tersedia",
      };
    if (pbv < 1.0)
      return {
        badge: "🟢 Di Bawah Nilai Buku (<1x)",
        color: "text-emerald-300 bg-emerald-950/70 border-emerald-700/60",
        hint: "Harga pasar lebih murah dari total ekuitas bersih",
      };
    if (pbv <= 3.0)
      return {
        badge: "🔵 Wajar Seimbang (1-3x)",
        color: "text-blue-300 bg-blue-950/70 border-blue-700/60",
        hint: "Valuasi mencerminkan aset bersih perusahaan",
      };
    return {
      badge: "🟣 Brand Premium (>3x)",
      color: "text-purple-300 bg-purple-950/70 border-purple-700/60",
      hint: "Premi atas moat, brand, atau return modal tinggi",
    };
  };

  const getRoeInterpretation = (roe?: number) => {
    if (!roe)
      return {
        badge: "N/A",
        color: "text-zinc-400 bg-zinc-800/80 border-zinc-700/60",
        hint: "Data ROE belum tercatat",
      };
    if (roe >= 18)
      return {
        badge: "🚀 Sangat Efisien (≥18%)",
        color: "text-emerald-300 bg-emerald-950/70 border-emerald-700/60",
        hint: "Manajemen sangat efektif melipatgandakan modal investor",
      };
    if (roe >= 10)
      return {
        badge: "🟢 Sehat & Kuat (10-18%)",
        color: "text-blue-300 bg-blue-950/70 border-blue-700/60",
        hint: "Efisiensi bisnis stabil dan berkesinambungan",
      };
    if (roe > 0)
      return {
        badge: "🟡 Moderat (<10%)",
        color: "text-amber-300 bg-amber-950/70 border-amber-700/60",
        hint: "Efisiensi pencetakan laba masih terbatas",
      };
    return {
      badge: "🔴 Defisit / Minus",
      color: "text-rose-300 bg-rose-950/70 border-rose-700/60",
      hint: "Emiten mencatat kerugian operasional",
    };
  };

  const getDividendInterpretation = (yieldVal?: number) => {
    if (!yieldVal || yieldVal <= 0)
      return {
        badge: "⚪ Fokus Ekspansi (0%)",
        color: "text-zinc-400 bg-zinc-800/80 border-zinc-700/60",
        hint: "Laba diputar kembali untuk reinvestasi modal bisnis",
      };
    if (yieldVal >= 5)
      return {
        badge: "💰 Dividen Jumbo (≥5%)",
        color: "text-emerald-300 bg-emerald-950/70 border-emerald-700/60",
        hint: "Arus kas pasif tinggi di atas bunga deposito perbankan",
      };
    if (yieldVal >= 2.5)
      return {
        badge: "🟢 Dividen Menarik (2.5-5%)",
        color: "text-teal-300 bg-teal-950/70 border-teal-700/60",
        hint: "Bagi hasil pasif tahunan rutin dan konsisten",
      };
    return {
      badge: "🔵 Dividen Moderat (<2.5%)",
      color: "text-blue-300 bg-blue-950/70 border-blue-700/60",
      hint: "Suplemen dividen di samping potensi apresiasi harga",
    };
  };

  const assetType = quote ? getAssetType(quote) : "STOCK";
  const isUSD = quote?.currency === "USD";
  const rateToIDR = fxRate || 15800;
  const tvSymbol = quote ? getTradingViewSymbol(quote.ticker) : "BITSTAMP:BTCUSD";

  // Calculate 52-week position percentage
  const low52 = quote?.fiftyTwoWeekLow || (quote?.regularMarketPrice ? quote.regularMarketPrice * 0.8 : 0);
  const high52 = quote?.fiftyTwoWeekHigh || (quote?.regularMarketPrice ? quote.regularMarketPrice * 1.2 : 100);
  const currentPrice = quote?.regularMarketPrice || 0;
  const range52Percent =
    high52 > low52 ? Math.min(100, Math.max(0, ((currentPrice - low52) / (high52 - low52)) * 100)) : 50;

  // Determine 52-week entry position recommendation
  const getRange52Label = (pct: number) => {
    if (pct <= 30) {
      return {
        text: "🟢 Dekat Area Bawah (Diskon Historis)",
        color: "text-emerald-400 bg-emerald-950/60 border-emerald-800/60",
      };
    }
    if (pct >= 85) {
      return {
        text: "🟠 Dekat Puncak Tertinggi (ATH / Hati-hati)",
        color: "text-amber-400 bg-amber-950/60 border-amber-800/60",
      };
    }
    return {
      text: "🔵 Area Tengah (Akumulasi Wajar)",
      color: "text-blue-400 bg-blue-950/60 border-blue-800/60",
    };
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header title="AI Multi-Asset Analyst & Research Hub" />

      <main className="p-5 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Search & Popular Category Tabs */}
        <div className="bg-zinc-900/95 border border-zinc-800/90 rounded-2xl p-5 shadow-lg space-y-4 backdrop-blur-sm">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari simbol saham (BBCA, AAPL, NVDA), kripto (BTC), ETF (VT), atau emas (EMAS)..."
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-zinc-100 placeholder-zinc-500 font-medium text-xs focus:outline-none focus:border-zinc-500 uppercase transition-all shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-zinc-100 to-zinc-200 hover:from-white hover:to-zinc-100 text-zinc-950 font-bold text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Search className="w-4 h-4 text-zinc-950" /> Cari Aset
            </button>
          </form>

          {/* Category Tabs & Quick Chips */}
          <div className="pt-3 border-t border-zinc-800/80 space-y-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
              {POPULAR_CATEGORIES.map((cat) => (
                <button
                  key={cat.category}
                  onClick={() => setActiveCategory(cat.category)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
                    activeCategory === cat.category
                      ? "bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/50"
                  }`}
                >
                  <span>{cat.badge || "📊"}</span>
                  <span>{cat.category}</span>
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border flex items-center gap-1.5 ${
                    quote?.ticker?.startsWith(item.ticker)
                      ? "bg-zinc-100 text-zinc-900 font-bold border-zinc-200 shadow-sm"
                      : "bg-zinc-950/80 hover:bg-zinc-800 text-zinc-300 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <span className="font-mono font-bold">{item.ticker}</span>
                  <span className="text-[11px] opacity-70">
                    {item.label.includes("(") ? item.label.split("(")[1].replace(")", "") : ""}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Not Found Alert Banner */}
        {!loading && errorMsg && (
          <div className="bg-rose-950/30 border border-rose-800/60 rounded-2xl p-6 shadow-lg text-center space-y-3 animate-fadeIn">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-base font-bold text-zinc-100">Simbol Tidak Ditemukan di Bursa</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{errorMsg}</p>
            </div>
            <div className="pt-2 text-xs text-zinc-500 flex flex-wrap items-center justify-center gap-2">
              <span className="font-semibold text-zinc-400">Pilihan populer:</span>
              {["BBCA", "BBRI", "GOOGL", "AAPL", "NVDA", "BTC", "VT"].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setTicker(s);
                    fetchQuote(s);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 font-mono text-[11px] font-bold border border-zinc-700/80 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-14 text-center text-zinc-400 text-xs flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-200">
              <RefreshCw className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <p className="font-semibold text-zinc-200 text-sm">Mengambil Data Pasar Real-Time...</p>
              <p className="text-zinc-500 text-xs mt-0.5">Memuat valuasi, laporan keuangan, dan katalis berita</p>
            </div>
          </div>
        )}

        {/* Asset Content Section */}
        {!loading && quote && (
          <div className="space-y-6 animate-fadeIn">
            {/* Asset Primary Info Card */}
            <div className="bg-gradient-to-b from-zinc-900 to-zinc-900/90 border border-zinc-800 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-wider uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {assetType}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-950 text-zinc-400 border border-zinc-800">
                    {quote.exchange || (quote.currency === "USD" ? "US MARKET" : "BEI / IDX")}
                  </span>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-100 tracking-tight">
                    {quote.ticker}
                  </h1>
                  <Badge variant={quote.regularMarketChange >= 0 ? "success" : "danger"}>
                    {quote.regularMarketChange >= 0 ? "+" : ""}
                    {quote.regularMarketChangePercent?.toFixed(2)}%
                  </Badge>
                </div>
                <p className="text-zinc-400 text-xs md:text-sm mt-1 font-medium">{quote.name}</p>

                {/* Primary Price with USD/IDR Conversion */}
                <div className="mt-3">
                  <div className="text-2xl md:text-3xl font-extrabold text-zinc-100 tracking-tight">
                    {formatPrice(quote.regularMarketPrice, quote.currency)}
                    <span className="text-xs text-zinc-400 font-normal ml-2">
                      {assetType === "GOLD" ? "/ gram" : assetType === "STOCK" ? "/ lembar" : "/ unit"}
                    </span>
                  </div>
                  {isUSD && (
                    <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Setara ~{formatIDR(quote.regularMarketPrice * rateToIDR)} (Estimasi Kurs: Rp{" "}
                      {Math.round(rateToIDR).toLocaleString("id-ID")}/USD)
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={runAiAnalysis}
                  disabled={analyzing}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 active:scale-[0.98] border border-emerald-400/30"
                >
                  <Sparkles className={`w-4 h-4 ${analyzing ? "animate-spin" : "animate-pulse"}`} />
                  {analyzing ? "AI Sedang Menganalisis..." : "✨ Riset Valuasi Mendalam AI"}
                </button>
                <Link
                  href="/portfolio"
                  className="px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700 text-xs font-semibold transition flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  Catat ke Portofolio <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Executive Verdict & Valuation Diagnostic Card */}
            <div className="bg-zinc-900 border border-zinc-800/90 rounded-2xl p-5 md:p-6 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                    Ringkasan Eksekutif 1 Menit & Status Valuasi
                  </h3>
                </div>
                {(() => {
                  const badge = getValuationBadge(quote.valuationStatus);
                  return (
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${badge.color} shadow-sm`}
                    >
                      {badge.label}
                    </span>
                  );
                })()}
              </div>

              {/* Quick 3-Pillar Investor Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400">
                    <Target className="w-3.5 h-3.5 text-blue-400" />
                    <span>Rekomendasi Tindakan</span>
                  </div>
                  <p className="text-xs font-bold text-zinc-200">
                    {quote.valuationStatus === "Undervalued"
                      ? "Akumulasi DCA Bertahap"
                      : quote.valuationStatus === "Overvalued"
                      ? "Wait & See / Cicil Ringan"
                      : "DCA Rutin / Hold"}
                  </p>
                  <p className="text-[10px] text-zinc-500">
                    {quote.valuationStatus === "Undervalued"
                      ? "Momentum masuk harga diskon fundamental"
                      : quote.valuationStatus === "Overvalued"
                      ? "Tunggu retrace atau titik support teknikal"
                      : "Cocok untuk portofolio jangka panjang"}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Profil Risiko Aset</span>
                  </div>
                  <p className="text-xs font-bold text-zinc-200">
                    {assetType === "GOLD"
                      ? "Sangat Rendah (Safe Haven)"
                      : assetType === "ETF"
                      ? "Rendah - Terkonsolidasi Global"
                      : assetType === "CRYPTO"
                      ? "Tinggi - Volatilitas Tinggi"
                      : "Menengah (Bluechip Equity)"}
                  </p>
                  <p className="text-[10px] text-zinc-500">
                    {assetType === "GOLD"
                      ? "Pelindung nilai terhadap pelemahan mata uang"
                      : assetType === "ETF"
                      ? "Terdiversifikasi di ratusan/ribuan emiten"
                      : assetType === "CRYPTO"
                      ? "Potensi cuan besar dengan risiko fluktuasi"
                      : "Didukung fundamental laba operasional"}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400">
                    <Activity className="w-3.5 h-3.5 text-purple-400" />
                    <span>Posisi Harga 1 Tahun</span>
                  </div>
                  {(() => {
                    const rangeBadge = getRange52Label(range52Percent);
                    return (
                      <>
                        <p className="text-xs font-bold text-zinc-200">
                          {range52Percent.toFixed(0)}% dari Titik Terendah
                        </p>
                        <span
                          className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded border ${rangeBadge.color}`}
                        >
                          {rangeBadge.text}
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Diagnostic Text */}
              {quote.valuationSummary && (
                <div className="p-3.5 rounded-xl bg-zinc-950/90 border border-zinc-850 text-xs text-zinc-300 leading-relaxed flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-zinc-200">Diagnostik Fundamental: </span>
                    {quote.valuationSummary}
                  </div>
                </div>
              )}

              {/* 52-Week Range Bar */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-2 font-medium">
                  <span>
                    52-W Low:{" "}
                    <strong className="text-zinc-300">{formatPrice(low52, quote.currency)}</strong>
                  </span>
                  <span className="text-zinc-200 font-semibold">Rentang Harga 52-Minggu (1 Tahun)</span>
                  <span>
                    52-W High:{" "}
                    <strong className="text-zinc-300">{formatPrice(high52, quote.currency)}</strong>
                  </span>
                </div>
                <div className="relative h-2.5 w-full bg-zinc-800/90 rounded-full overflow-hidden p-0.5 border border-zinc-700/60">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-400 rounded-full transition-all duration-700 shadow-sm"
                    style={{ width: `${range52Percent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Financial Multiples & Statement Metrics Grid (Stock) */}
            {assetType === "STOCK" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <span>Rasio Valuasi & Kinerja Keuangan (Mudah Dipahami)</span>
                  </h3>
                  <span className="text-[11px] text-zinc-500 hidden sm:inline">
                    Standar Analisis Fundamental Saham
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {/* PER */}
                  {(() => {
                    const peData = getPeInterpretation(quote.trailingPE);
                    return (
                      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-zinc-700 transition">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
                              <Activity className="w-3.5 h-3.5 text-blue-400" />
                              P/E RATIO (PER)
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {quote.forwardPE ? `Fwd ${quote.forwardPE.toFixed(1)}x` : ""}
                            </span>
                          </div>
                          <div className="text-2xl font-black text-zinc-100 mt-2 tracking-tight">
                            {quote.trailingPE ? `${quote.trailingPE.toFixed(1)}x` : "N/A"}
                          </div>
                          <span
                            className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-semibold border ${peData.color}`}
                          >
                            {peData.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-2.5 pt-2 border-t border-zinc-850 leading-tight">
                          {peData.hint}
                        </p>
                      </div>
                    );
                  })()}

                  {/* PBV */}
                  {(() => {
                    const pbvData = getPbvInterpretation(quote.priceToBook);
                    return (
                      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-zinc-700 transition">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
                              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                              PRICE TO BOOK (PBV)
                            </span>
                          </div>
                          <div className="text-2xl font-black text-zinc-100 mt-2 tracking-tight">
                            {quote.priceToBook ? `${quote.priceToBook.toFixed(1)}x` : "N/A"}
                          </div>
                          <span
                            className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-semibold border ${pbvData.color}`}
                          >
                            {pbvData.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-2.5 pt-2 border-t border-zinc-850 leading-tight">
                          {pbvData.hint}
                        </p>
                      </div>
                    );
                  })()}

                  {/* ROE */}
                  {(() => {
                    const roeData = getRoeInterpretation(quote.returnOnEquity);
                    return (
                      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-zinc-700 transition">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
                              <Percent className="w-3.5 h-3.5 text-emerald-400" />
                              RETURN ON EQUITY (ROE)
                            </span>
                          </div>
                          <div className="text-2xl font-black text-zinc-100 mt-2 tracking-tight">
                            {quote.returnOnEquity ? `${quote.returnOnEquity.toFixed(1)}%` : "N/A"}
                          </div>
                          <span
                            className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-semibold border ${roeData.color}`}
                          >
                            {roeData.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-2.5 pt-2 border-t border-zinc-850 leading-tight">
                          {roeData.hint}
                        </p>
                      </div>
                    );
                  })()}

                  {/* Dividend Yield */}
                  {(() => {
                    const divData = getDividendInterpretation(quote.dividendYield);
                    return (
                      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-zinc-700 transition">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                              DIVIDEND YIELD
                            </span>
                          </div>
                          <div className="text-2xl font-black text-zinc-100 mt-2 tracking-tight">
                            {quote.dividendYield ? `${quote.dividendYield.toFixed(1)}%` : "0.0%"}
                          </div>
                          <span
                            className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-semibold border ${divData.color}`}
                          >
                            {divData.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-2.5 pt-2 border-t border-zinc-850 leading-tight">
                          {divData.hint}
                        </p>
                      </div>
                    );
                  })()}

                  {/* EPS */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-zinc-700 transition">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
                          <Coins className="w-3.5 h-3.5 text-amber-400" />
                          EPS (LABA PER SAHAM)
                        </span>
                      </div>
                      <div className="text-2xl font-black text-zinc-100 mt-2 tracking-tight">
                        {quote.eps ? (isUSD ? `$${quote.eps}` : `Rp ${quote.eps}`) : "N/A"}
                      </div>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-semibold border text-amber-300 bg-amber-950/70 border-amber-700/60">
                        {quote.eps > 0 ? "📈 Laba Bersih Positif" : "Laba Per Lembar Saham"}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-2.5 pt-2 border-t border-zinc-850 leading-tight">
                      Laba riil yang dihasilkan per unit saham yang beredar
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ETF Metrics Grid */}
            {assetType === "ETF" && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span>Karakteristik Portofolio ETF Global</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                      <Activity className="w-3.5 h-3.5 text-zinc-400" />
                      P/E RATIO INDEKS
                    </div>
                    <div className="text-xl font-bold text-zinc-100 mt-2">
                      {quote.trailingPE ? `${quote.trailingPE.toFixed(1)}x` : "18.2x"}
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Rata-rata tertimbang konstituen</p>
                  </div>

                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                      <DollarSign className="w-3.5 h-3.5 text-zinc-400" />
                      PRICE TO BOOK (PBV)
                    </div>
                    <div className="text-xl font-bold text-zinc-100 mt-2">
                      {quote.priceToBook ? `${quote.priceToBook.toFixed(1)}x` : "2.1x"}
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Valuasi aset bersih indeks</p>
                  </div>

                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      DIVIDEND YIELD
                    </div>
                    <div className="text-xl font-bold text-zinc-100 mt-2">
                      {quote.dividendYield ? `${quote.dividendYield.toFixed(2)}%` : "1.95%"}
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Distribusi arus kas pasif</p>
                  </div>

                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                      <Layers className="w-3.5 h-3.5 text-zinc-400" />
                      STRUKTUR DIVERSIFIKASI
                    </div>
                    <div className="text-sm font-bold text-zinc-200 mt-2">Global Index Tracker</div>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Diversifikasi ribuan saham dunia</p>
                  </div>
                </div>
              </div>
            )}

            {/* Crypto Metrics Grid */}
            {assetType === "CRYPTO" && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>Likuiditas & Metrik Jaringan Kripto</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                      {quote.regularMarketVolume
                        ? `$${(quote.regularMarketVolume / 1e9).toFixed(2)}B`
                        : "$28.0B"}
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
              </div>
            )}

            {/* Gold Metrics Grid */}
            {assetType === "GOLD" && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>Metrik Logam Mulia Fisik & Buyback</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                    <p className="text-[10px] text-zinc-500 mt-0.5">Low - High Fluktuasi Harian</p>
                  </div>

                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      KLASIFIKASI ASET
                    </div>
                    <div className="text-sm font-bold text-emerald-300 mt-2">Safe Haven</div>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Lindung Nilai Inflasi & Krisis</p>
                  </div>
                </div>
              </div>
            )}

            {/* AI Deep Report Card Component (Structured & Executive Grade) */}
            {aiReport ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Laporan Riset & Valuasi Komprehensif AI</span>
                  </h3>
                  <button
                    onClick={runAiAnalysis}
                    disabled={analyzing}
                    className="text-xs text-zinc-400 hover:text-zinc-200 transition flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${analyzing ? "animate-spin" : ""}`} />
                    <span>Perbarui Analisis</span>
                  </button>
                </div>
                <AiAnalystReportCard
                  ticker={quote.ticker}
                  name={quote.name}
                  reportText={aiReport}
                  onCopy={handleCopyReport}
                  copied={copiedReport}
                />
              </div>
            ) : (
              /* Enticing AI CTA Callout when no report has been generated yet */
              <div className="bg-gradient-to-b from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800/90 rounded-2xl p-6 md:p-8 shadow-xl text-center space-y-5 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-inner">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div className="max-w-xl mx-auto space-y-2">
                  <h3 className="text-lg md:text-xl font-bold text-zinc-100 tracking-tight">
                    Butuh Analisis Riset Mendalam untuk {quote.ticker}?
                  </h3>
                  <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">
                    AI Asisten+Stock siap mengevaluasi posisi pasar, rasio keuangan, katalis berita global,
                    serta memberikan panduan praktis apakah saat ini waktu terbaik untuk mengakumulasi DCA.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-left">
                  <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 space-y-1">
                    <p className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Diagnosa Valuasi
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Diskon vs Fair Value vs Overvalued berdasarkan konsensus data.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 space-y-1">
                    <p className="text-[11px] font-bold text-blue-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Katalis & Berita
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Rangkuman sentimen mikro & makro ekonomi terkini.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 space-y-1">
                    <p className="text-[11px] font-bold text-purple-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Panduan DCA
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Saran tindakan strategis untuk portofolio Anda.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={runAiAnalysis}
                    disabled={analyzing}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 transition-all inline-flex items-center gap-2 active:scale-[0.98] border border-emerald-400/30"
                  >
                    <Sparkles className={`w-4 h-4 ${analyzing ? "animate-spin" : "animate-pulse"}`} />
                    {analyzing ? "AI Sedang Menganalisis..." : `Jalankan Riset Lengkap AI untuk ${quote.ticker}`}
                  </button>
                </div>
              </div>
            )}

            {/* TradingView Interactive Real-Time Chart */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm p-4 md:p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                    Grafik Live & Candlestick Real-Time (TradingView)
                  </h3>
                </div>
                <div className="text-[11px] text-zinc-400 font-medium flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Bursa: <span className="text-zinc-200 font-semibold font-mono">{tvSymbol}</span>
                </div>
              </div>
              <div className="h-[430px] w-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
                <iframe
                  key={tvSymbol}
                  src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${encodeURIComponent(
                    tvSymbol
                  )}&interval=D&hidesidetoolbar=1&symboledit=1&saveimage=1&toolbarbg=18181b&studies=[]&theme=dark&style=1&timezone=Asia%2FJakarta&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=id&utm_source=localhost`}
                  className="w-full h-full border-0"
                />
              </div>
            </div>

            {/* Related Real-Time News & Market Catalysts with Safe Direct Links */}
            {tickerNews && tickerNews.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Newspaper className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                      Berita Terkini & Katalis Pasar: {quote.ticker}
                    </h3>
                  </div>
                  <span className="text-[11px] text-zinc-400 font-medium">
                    Sumber Tepercaya • Tautan Langsung
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {tickerNews.map((newsItem) => (
                    <a
                      key={newsItem.id}
                      href={newsItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-800/30 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-zinc-400">
                          <span className="font-semibold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40">
                            {newsItem.source}
                          </span>
                          <span>
                            {new Date(newsItem.published_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-zinc-200 group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                          {newsItem.title}
                        </h4>
                        <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                          {newsItem.summary}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-850 text-[10px]">
                        <span className="text-zinc-500 font-medium">
                          {newsItem.impact_summary || "Katalis sentimen pasar"}
                        </span>
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-400 group-hover:underline">
                          <span>Baca Artikel</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
