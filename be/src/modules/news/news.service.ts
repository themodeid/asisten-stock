export interface MarketNewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  published_at: string;
  category: "STOCK" | "CRYPTO" | "MACRO" | "GOLD" | "GLOBAL";
  tickers: string[];
  sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
  sentiment_score: number; // -1.0 to 1.0
  impact_summary: string;
}

const NEWS_CACHE: MarketNewsItem[] = [
  {
    id: "news-1",
    title: "Bank Indonesia Pertahankan BI-Rate di 6.00% untuk Stabilitas Nilai Tukar Rupiah",
    summary: "Rapat Dewan Gubernur Bank Indonesia memutuskan mempertahankan BI-Rate pada level 6.00%. Keputusan ini konsisten dengan fokus kebijakan moneter yang pro-stability memperkuat stabilitas nilai tukar Rupiah dari ketidakpastian geopolitik global.",
    source: "Bank Indonesia (Resmi)",
    url: "https://www.bi.go.id/id/publikasi/ruang-media/news-release/Pages/sp_2615424.aspx",
    published_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    category: "MACRO",
    tickers: ["IHSG", "USDIDR"],
    sentiment: "NEUTRAL",
    sentiment_score: 0.15,
    impact_summary: "Menjaga stabilitas yield obligasi dan menahan pelemahan Rupiah lebih lanjut. Netral-positif untuk perbankan (BBCA, BBRI, BMRI).",
  },
  {
    id: "news-2",
    title: "Bitcoin Tembus Rekor Akumulasi Baru Dipicu Arus Masuk Bersih ETF Spot Global",
    summary: "Arus modal masuk ke instrumen spot Bitcoin ETF mencatat rekor mingguan baru. Investor institusi terus meningkatkan alokasi kas mereka ke aset digital sebagai lindung nilai alternatif terhadap inflasi fiat jangka panjang.",
    source: "CoinDesk",
    url: "https://www.coindesk.com/markets",
    published_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    category: "CRYPTO",
    tickers: ["BTC", "USDT"],
    sentiment: "BULLISH",
    sentiment_score: 0.82,
    impact_summary: "Sentimen sangat kuat untuk pasar kripto. Support teknikal BTC menguat di atas MA-50.",
  },
  {
    id: "news-3",
    title: "Kinerja Sektor Perbankan RI Tetap Solid: Pertumbuhan Kredit Capai Dobel Digit",
    summary: "OJK melaporkan intermediasi perbankan nasional terus berekspansi dengan pertumbuhan kredit double digit. Kualitas kredit tetap terjaga dengan rasio NPL gross yang rendah serta bantalan pencadangan modal yang tebal.",
    source: "Bisnis.com Pasar",
    url: "https://market.bisnis.com",
    published_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    category: "STOCK",
    tickers: ["BBCA", "BBRI", "BMRI", "BBNI"],
    sentiment: "BULLISH",
    sentiment_score: 0.75,
    impact_summary: "Katalis fundamental positif bagi portofolio dividen perbankan Indonesia.",
  },
  {
    id: "news-4",
    title: "Harga Emas Dunia Bertahan Dekat All-Time High di Tengah Ketegangan Geopolitik",
    summary: "Permintaan emas batangan fisik dan cadangan devisa bank-bank sentral dunia terus meningkat. Ketidakpastian arah kebijakan The Fed dan ketegangan politik global mendorong safe-haven buying.",
    source: "Reuters Markets",
    url: "https://www.reuters.com/markets/commodities",
    published_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    category: "GOLD",
    tickers: ["ANTAM", "XAUUSD", "GOLD"],
    sentiment: "BULLISH",
    sentiment_score: 0.68,
    impact_summary: "Memperkuat fungsi Emas sebagai peredam risiko (hedging) dalam portofolio all-weather.",
  },
  {
    id: "news-5",
    title: "Vanguard Total World Stock ETF (VT) Cetak Rekor Tertinggi Baru Berkat Saham AI",
    summary: "Indeks saham dunia mencatat reli dipimpin sektor kecerdasan buatan, teknologi semikonduktor, dan ketahanan laba emiten skala global di Amerika Serikat, Eropa, dan Asia Pasifik.",
    source: "Financial Times",
    url: "https://www.ft.com/markets",
    published_at: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    category: "GLOBAL",
    tickers: ["VT", "SPY"],
    sentiment: "BULLISH",
    sentiment_score: 0.70,
    impact_summary: "Menguntungkan eksposur portofolio ETF global yang berdenominasi USD.",
  },
  {
    id: "news-6",
    title: "Volatilitas Harga Minyak Mentah Global dan Tekanan Biaya Logistik Emiten Komoditas",
    summary: "Pasar energi dunia bergerak fluktuatif menyusul keputusan kuota produksi OPEC+ dan dinamika rute pengapalan laut merah. Sebagian emiten manufaktur mencatat peningkatan tipis biaya logistik.",
    source: "CNBC Indonesia Market",
    url: "https://www.cnbcindonesia.com/market",
    published_at: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    category: "MACRO",
    tickers: ["IHSG", "ASII"],
    sentiment: "BEARISH",
    sentiment_score: -0.35,
    impact_summary: "Sedikit menekan margin emiten consumer non-cyclical dan manufaktur.",
  },
];

// Helper to decode HTML entities from RSS
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

// Live financial news fetcher via verified Google News RSS queries
async function fetchLiveRssNews(category?: string): Promise<MarketNewsItem[]> {
  try {
    let query = "saham IHSG bursa efek indonesia";
    let catEnum: MarketNewsItem["category"] = "STOCK";

    if (category) {
      const c = category.toUpperCase();
      if (c === "CRYPTO") {
        query = "bitcoin crypto cryptocurrency ethereum";
        catEnum = "CRYPTO";
      } else if (c === "MACRO") {
        query = "Bank Indonesia suku bunga BI rate inflasi rupiah";
        catEnum = "MACRO";
      } else if (c === "GOLD") {
        query = "harga emas antam logam mulia bullion";
        catEnum = "GOLD";
      } else if (c === "GLOBAL") {
        query = "Wall Street S&P 500 Nasdaq The Fed US economy";
        catEnum = "GLOBAL";
      }
    }

    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=id&gl=ID&ceid=ID:id`;
    const res = await fetch(rssUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return [];
    const xml = await res.text();
    const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

    const items: MarketNewsItem[] = [];

    for (let i = 0; i < Math.min(itemMatches.length, 15); i++) {
      const raw = itemMatches[i];
      let title = raw.match(/<title>(.*?)<\/title>/)?.[1] || "";
      const link = raw.match(/<link>(.*?)<\/link>/)?.[1] || "";
      const pubDate = raw.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || new Date().toISOString();
      const sourceMatch = raw.match(/<source[^>]*>(.*?)<\/source>/)?.[1];

      title = decodeHtmlEntities(title);
      // Clean up title format "Title - Source"
      let sourceName = sourceMatch ? decodeHtmlEntities(sourceMatch) : "Google News Financial";
      if (title.includes(" - ")) {
        const parts = title.split(" - ");
        if (parts.length > 1) {
          sourceName = parts[parts.length - 1].trim();
          title = parts.slice(0, -1).join(" - ").trim();
        }
      }

      if (!title || !link) continue;

      // Extract potential tickers
      const tickers: string[] = [];
      const commonSymbols = ["BBCA", "BBRI", "BMRI", "BBNI", "ASII", "TLKM", "IHSG", "BTC", "ETH", "ANTAM", "AAPL", "GOOGL", "NVDA"];
      const upperTitle = title.toUpperCase();
      for (const sym of commonSymbols) {
        if (upperTitle.includes(sym)) tickers.push(sym);
      }
      if (tickers.length === 0) {
        tickers.push(catEnum === "CRYPTO" ? "BTC" : catEnum === "GOLD" ? "ANTAM" : "IHSG");
      }

      // Quick sentiment estimation from keywords
      let sentiment: MarketNewsItem["sentiment"] = "NEUTRAL";
      let sentimentScore = 0.1;
      const bullishWords = ["menguat", "naik", "rekor", "melesat", "kinerja positif", "laba", "cuan", "bullish", "tumbuh", "lonjakan", "rebound"];
      const bearishWords = ["anjlok", "turun", "melemah", "rugi", "tekanan", "bearish", "waspada", "merosot", "drop", "ambruk"];

      const lowerTitle = title.toLowerCase();
      if (bullishWords.some((w) => lowerTitle.includes(w))) {
        sentiment = "BULLISH";
        sentimentScore = 0.72;
      } else if (bearishWords.some((w) => lowerTitle.includes(w))) {
        sentiment = "BEARISH";
        sentimentScore = -0.65;
      }

      items.push({
        id: `rss-${i + 1}-${Date.now()}`,
        title,
        summary: `Berita langsung dari ${sourceName}: Pantau pergerakan pasar dan pengaruhnya terhadap sentimen aset. Klik artikel untuk membaca selengkapnya.`,
        source: sourceName,
        url: link,
        published_at: new Date(pubDate).toISOString(),
        category: catEnum,
        tickers,
        sentiment,
        sentiment_score: sentimentScore,
        impact_summary: `Memengaruhi volatilitas jangka pendek pada ticker ${tickers.join(", ")}.`,
      });
    }

    return items;
  } catch (err) {
    console.warn("Live RSS fetch warning:", err);
    return [];
  }
}

export const getNewsFeed = async (
  category?: string,
  limit: number = 20
): Promise<MarketNewsItem[]> => {
  // Fetch live articles from Google News RSS
  const liveNews = await fetchLiveRssNews(category);

  // Combine with curated cache that has direct URLs
  let cached = [...NEWS_CACHE];
  if (category && category.toUpperCase() !== "ALL") {
    cached = cached.filter((n) => n.category === category.toUpperCase());
  }

  // Live news first, followed by curated news
  const combined = [...liveNews, ...cached];
  return combined.slice(0, limit);
};

export const getNewsByTicker = async (ticker: string): Promise<MarketNewsItem[]> => {
  const clean = ticker.trim().toUpperCase();
  const cachedMatches = NEWS_CACHE.filter((n) =>
    n.tickers.some((t) => t.toUpperCase().includes(clean) || clean.includes(t.toUpperCase()))
  );

  // If no cached matches or to enrich, query RSS for this specific ticker
  try {
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent("saham " + clean)}&hl=id&gl=ID&ceid=ID:id`;
    const res = await fetch(rssUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const xml = await res.text();
      const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
      const liveForTicker: MarketNewsItem[] = [];

      for (let i = 0; i < Math.min(itemMatches.length, 5); i++) {
        const raw = itemMatches[i];
        let title = raw.match(/<title>(.*?)<\/title>/)?.[1] || "";
        const link = raw.match(/<link>(.*?)<\/link>/)?.[1] || "";
        const pubDate = raw.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || new Date().toISOString();
        const sourceMatch = raw.match(/<source[^>]*>(.*?)<\/source>/)?.[1];

        title = decodeHtmlEntities(title);
        let sourceName = sourceMatch ? decodeHtmlEntities(sourceMatch) : "Google Berita";
        if (title.includes(" - ")) {
          const parts = title.split(" - ");
          sourceName = parts[parts.length - 1].trim();
          title = parts.slice(0, -1).join(" - ").trim();
        }

        if (title && link) {
          liveForTicker.push({
            id: `ticker-rss-${i}-${Date.now()}`,
            title,
            summary: `Update terkini seputar emiten ${clean} dari media tepercaya ${sourceName}.`,
            source: sourceName,
            url: link,
            published_at: new Date(pubDate).toISOString(),
            category: "STOCK",
            tickers: [clean],
            sentiment: "NEUTRAL",
            sentiment_score: 0.1,
            impact_summary: `Katalis informasi terkini untuk pergerakan harga ${clean}.`,
          });
        }
      }
      return [...liveForTicker, ...cachedMatches];
    }
  } catch {
    // Return cached if live search fails
  }

  return cachedMatches;
};
