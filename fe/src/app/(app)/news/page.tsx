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
  category: "STOCK" | "CRYPTO" | "MACRO" | "GOLD" | "GLOBAL";
  tickers: string[];
  sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
  sentiment_score: number;
  impact_summary: string;
}

const CATEGORIES = [
  { label: "Semua Kategori", value: "ALL" },
  { label: "Saham RI", value: "STOCK" },
  { label: "Kripto", value: "CRYPTO" },
  { label: "Makro & BI", value: "MACRO" },
  { label: "Emas", value: "GOLD" },
  { label: "Global ETF", value: "GLOBAL" },
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
    if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  };

  const bullishCount = news.filter((n) => n.sentiment === "BULLISH").length;
  const bullishRatio = news.length > 0 ? Math.round((bullishCount / news.length) * 100) : 70;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <Header title="Berita & Intelijen Pasar" />

      <main className="p-3.5 sm:p-5 md:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Market Mood Intelligence Banner */}
        <div className="rounded-2xl p-5 border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20 backdrop-blur-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span>AI Sentiment Radar • Analisis Waktu Nyata</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Kondisi Pasar: Cenderung Akumulatif & Bullish ({bullishRatio}%)
              </h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
                Stabilitas suku bunga BI mendukung likuiditas perbankan, sementara adopsi ETF institusional global menjaga momentum aset kripto dan saham dunia.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-center shrink-0">
              <div className="px-3 py-2 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/10 text-center">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Total Berita</span>
                <span className="text-sm font-black text-zinc-900 dark:text-zinc-100 tabular-nums">{news.length}</span>
              </div>
              <div className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Bullish</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{bullishCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <Filter className="w-3.5 h-3.5 text-zinc-400 shrink-0 ml-1" />
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold shadow-sm"
                    : "bg-white/80 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 border border-zinc-200/80 dark:border-white/[0.06]"
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

              return (
                <article
                  key={item.id}
                  className="rounded-2xl p-5 bg-white/90 dark:bg-zinc-900/75 border border-zinc-200/80 dark:border-white/[0.07] hover:border-zinc-300 dark:hover:border-white/[0.16] transition-all duration-200 shadow-sm dark:shadow-lg dark:shadow-black/40 glass-card glass-card-hover flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    {/* Top Row: Category, Tickers, Sentiment */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
                          {item.category}
                        </span>
                        {item.tickers.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40"
                          >
                            ${t}
                          </span>
                        ))}
                      </div>

                      {/* Sentiment Badge */}
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg font-mono ${
                          isBullish
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60"
                            : isBearish
                            ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800/60"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700"
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
                        <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover/link:text-emerald-500 transition-colors leading-snug tracking-tight flex items-start justify-between gap-2">
                          <span>{item.title}</span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-40 group-hover/link:opacity-100 group-hover/link:text-emerald-500 shrink-0 mt-1 transition-all" />
                        </h3>
                      </a>
                    ) : (
                      <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 leading-snug tracking-tight">
                        {item.title}
                      </h3>
                    )}

                    {/* Summary */}
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-3">
                      {item.summary}
                    </p>
                  </div>

                  {/* AI Impact Box & Meta */}
                  <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-white/[0.04]">
                    <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/60 dark:border-white/[0.04] text-[11px] text-zinc-700 dark:text-zinc-300 flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">Dampak Portofolio: </span>
                        {item.impact_summary}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-zinc-400 gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-md border border-zinc-200/70 dark:border-white/[0.06]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          {item.source}
                        </span>
                        <div className="flex items-center gap-1 text-zinc-400">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(item.published_at)}</span>
                        </div>
                      </div>

                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors ml-auto"
                        >
                          <span>Buka Berita</span>
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
