"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import {
  Newspaper,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  ExternalLink,
  Clock,
  Filter,
} from "lucide-react";
import { api } from "@/services/api";

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url?: string;
  published_at: string;
  category: "HOT" | "GLOBAL_EQUITIES" | "CRYPTO" | "MACRO_GLOBAL" | "SAFE_HAVEN";
  tickers: string[];
  sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
  sentiment_score: number;
  impact_summary: string;
}

const CATEGORIES = [
  { label: "🔥 Semua Intelijen Global", value: "ALL" },
  { label: "⚡ Hot Narratives & AI Disruptions", value: "HOT" },
  { label: "🌍 Global Equities & Moats", value: "GLOBAL_EQUITIES" },
  { label: "🪙 Bitcoin & Crypto ETF", value: "CRYPTO" },
  { label: "🏛️ Central Banks & The Fed", value: "MACRO_GLOBAL" },
  { label: "🥇 Safe-Haven & Gold", value: "SAFE_HAVEN" },
];

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNews(selectedCategory);
  }, [selectedCategory]);

  const fetchNews = async (cat: string) => {
    setIsLoading(true);
    try {
      const url = cat === "ALL" ? "/news/feed" : `/news/feed?category=${cat}`;
      const res = await api.get(url);
      if (res.data?.success) {
        setNews(res.data.data);
      }
    } catch (err) {
      console.warn("Gagal memuat berita:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMinutes = Math.floor(diffMs / (60 * 1000));
    if (diffMinutes < 60) return `${diffMinutes}m yang lalu`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h yang lalu`;
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  };

  const bullishCount = news.filter((n) => n.sentiment === "BULLISH").length;
  const bearishCount = news.filter((n) => n.sentiment === "BEARISH").length;
  const bullishRatio = news.length > 0 ? Math.round((bullishCount / news.length) * 100) : 65;

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 transition-colors duration-200">
      <Header title="Intelijen Makroekonomi & Geopolitik Global" />

      <main className="p-3.5 sm:p-5 md:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Global Market Intelligence Radar Banner (Sovereign Terminal Style) */}
        <div className="rounded-2xl p-5 border border-slate-800 bg-slate-900/90 shadow-xl backdrop-blur-md relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-400">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span>TERMINAL MACRO RADAR &bull; GLOBAL SENTIMENT FEED</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-100 font-sans">
                Sentimen Likuiditas Global: {bullishRatio >= 50 ? "Akumulatif & Resilient" : "Risk-Off & Waspada"} ({bullishRatio}% Bullish)
              </h2>
              <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                Pemantauan real-time terhadap volatilitas bursa Asia/semikonduktor, perdebatan valuasi AI Capex, kebijakan suku bunga The Fed, dan pergerakan emas/Bitcoin institusional.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-center shrink-0 font-mono">
              <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">TOTAL DISPATCH</span>
                <span className="text-sm font-bold text-slate-100 tabular-nums">{news.length}</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-emerald-800/40 text-center">
                <span className="text-[9px] uppercase font-bold text-emerald-400 block tracking-wider">BULLISH</span>
                <span className="text-sm font-bold text-emerald-400 tabular-nums">{bullishCount}</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-rose-800/40 text-center">
                <span className="text-[9px] uppercase font-bold text-rose-400 block tracking-wider">BEARISH</span>
                <span className="text-sm font-bold text-rose-400 tabular-nums">{bearishCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Filters (Console Style) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <Filter className="w-3.5 h-3.5 text-blue-400 shrink-0 ml-1" />
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold whitespace-nowrap transition-all border ${
                  isActive
                    ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/25 ring-1 ring-blue-400/40 font-bold"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* News Feed Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-44 rounded-2xl bg-zinc-100 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/[0.06] animate-pulse p-5"
              />
            ))}
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-white/50 dark:bg-zinc-900/20 border border-dashed border-zinc-300 dark:border-zinc-800 p-6">
            <Newspaper className="w-8 h-8 mx-auto text-zinc-400 mb-2 opacity-50" />
            <p className="text-sm text-zinc-500 font-medium">Belum ada berita pada kategori ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {news.map((item) => {
              const isBullish = item.sentiment === "BULLISH";
              const isBearish = item.sentiment === "BEARISH";

              const getCategoryBadgeClass = (cat: string) => {
                switch (cat) {
                  case "HOT":
                    return "bg-rose-950/70 text-rose-400 border-rose-800/60";
                  case "GLOBAL_EQUITIES":
                    return "bg-blue-950/70 text-blue-400 border-blue-800/60";
                  case "CRYPTO":
                    return "bg-amber-950/70 text-amber-400 border-amber-800/60";
                  case "MACRO_GLOBAL":
                    return "bg-indigo-950/70 text-indigo-300 border-indigo-800/60";
                  case "SAFE_HAVEN":
                    return "bg-yellow-950/70 text-yellow-400 border-yellow-800/60";
                  default:
                    return "bg-slate-800 text-slate-300 border-slate-700";
                }
              };

              return (
                <article
                  key={item.id}
                  className="rounded-2xl p-5 bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition-all duration-200 shadow-xl flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    {/* Top Row: Category, Tickers, Sentiment */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border uppercase tracking-wider ${getCategoryBadgeClass(item.category)}`}>
                          {item.category.replace("_", " ")}
                        </span>
                        {item.tickers.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-950 text-blue-400 border border-blue-500/30"
                          >
                            ${t}
                          </span>
                        ))}
                      </div>

                      {/* Sentiment Badge */}
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded font-mono ${
                          isBullish
                            ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/60"
                            : isBearish
                            ? "bg-rose-950/80 text-rose-400 border border-rose-800/60"
                            : "bg-slate-950 text-slate-300 border border-slate-800"
                        }`}
                      >
                        {isBullish ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : isBearish ? (
                          <TrendingDown className="w-3 h-3" />
                        ) : (
                          <Minus className="w-3 h-3" />
                        )}
                        {item.sentiment}
                      </span>
                    </div>

                    {/* News Title */}
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/link block"
                      >
                        <h3 className="text-sm sm:text-base font-bold text-slate-100 group-hover/link:text-blue-400 transition-colors leading-snug tracking-tight flex items-start justify-between gap-2 font-sans">
                          <span>{item.title}</span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-40 group-hover/link:opacity-100 group-hover/link:text-blue-400 shrink-0 mt-1 transition-all" />
                        </h3>
                      </a>
                    ) : (
                      <h3 className="text-sm sm:text-base font-bold text-slate-100 leading-snug tracking-tight font-sans">
                        {item.title}
                      </h3>
                    )}

                    {/* Summary */}
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 font-normal">
                      {item.summary}
                    </p>
                  </div>

                  {/* AI Impact Box & Meta */}
                  <div className="space-y-3 pt-2.5 border-t border-slate-800/80">
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2 font-sans">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-blue-400 font-mono">DAMPAK PORTOFOLIO: </span>
                        {item.impact_summary}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 gap-2 flex-wrap font-mono">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                          {item.source}
                        </span>
                        <div className="flex items-center gap-1 text-slate-500">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(item.published_at)}</span>
                        </div>
                      </div>

                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors ml-auto font-sans"
                        >
                          <span>Buka Dispatch</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
