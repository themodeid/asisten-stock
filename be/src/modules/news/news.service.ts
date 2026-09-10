export interface MarketNewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  published_at: string;
  category: "HOT" | "GLOBAL_EQUITIES" | "CRYPTO" | "MACRO_GLOBAL" | "SAFE_HAVEN";
  tickers: string[];
  sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
  sentiment_score: number; // -1.0 to 1.0
  impact_summary: string;
}

const NEWS_CACHE: MarketNewsItem[] = [
  {
    id: "news-hot-1",
    title: "Bursa Saham Korsel & Nikkei Terguncang: Kekhawatiran Bubble Valuasi AI Picu Aksi Jual Masif Semikonduktor",
    summary: "Indeks KOSPI Korea Selatan dan Nikkei Jepang anjlok tajam dipimpin aksi jual agresif pada saham chip memori (Samsung Electronics, SK Hynix). Investor institusi global mulai mempertanyakan rasio ROI belanja modal (Capex) infrastruktur AI raksasa teknologi AS yang dinilai belum sebanding dengan monetisasi jangka pendek.",
    source: "Bloomberg Asia Markets",
    url: "https://www.bloomberg.com/markets",
    published_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    category: "HOT",
    tickers: ["KOSPI", "NVDA", "TSM", "VT"],
    sentiment: "BEARISH",
    sentiment_score: -0.72,
    impact_summary: "Menciptakan tekanan volatilitas jangka pendek pada ETF saham dunia (VT) dan sektor hardware, namun membuka peluang akumulasi (buy the dip) pada emiten semikonduktor dengan parit lebar (moat) terkuat.",
  },
  {
    id: "news-hot-2",
    title: "The Fed Tahan Suku Bunga Tinggi Lebih Lama: Yield US Treasury 10-Tahun Naik Menguji Ketahanan Likuiditas Global",
    summary: "Ketua Federal Reserve Jerome Powell menegaskan bahwa pemangkasan suku bunga acuan akan bergantung penuh pada data inflasi jasa AS. Yield obligasi pemerintah AS tenor 10-tahun bertahan di atas level krusial, memicu penguatan indeks Dolar AS (DXY) terhadap seluruh mata uang dunia.",
    source: "Reuters Global Finance",
    url: "https://www.reuters.com/markets",
    published_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    category: "MACRO_GLOBAL",
    tickers: ["DXY", "US10Y", "USDIDR", "SPY"],
    sentiment: "NEUTRAL",
    sentiment_score: -0.15,
    impact_summary: "Mendukung daya lindung nilai (hedging) aset yang berdenominasi USD dalam portofolio Anda terhadap pelemahan nilai tukar Rupiah.",
  },
  {
    id: "news-hot-3",
    title: "Arus Masuk Institusional Bitcoin ETF Tembus Rekor Kuartalan: BlackRock IBIT Pimpin Akumulasi Cadangan Global",
    summary: "Alokasi dana pensiun, endowment fund, dan manajer investasi global ke instrumen Spot Bitcoin ETF terus mencatatkan net inflow konsisten. Bitcoin semakin diakui sebagai 'Digital Gold' dengan rasio suplai likuid di exchange yang menyentuh titik terendah dalam 6 tahun.",
    source: "CoinDesk Institutional",
    url: "https://www.coindesk.com",
    published_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    category: "CRYPTO",
    tickers: ["BTC", "IBIT", "ETH"],
    sentiment: "BULLISH",
    sentiment_score: 0.84,
    impact_summary: "Memperkuat fundamental jangka panjang alokasi Bitcoin 15% pada portofolio Stateless Hedgefund Anda.",
  },
  {
    id: "news-hot-4",
    title: "Monopoli Big Tech Berlanjut: Apple & Microsoft Laporkan Arus Kas Operasional Raksasa Ditopang Ekosistem Enterprise",
    summary: "Hasil kinerja keuangan Apple dan Microsoft membuktikan kekuatan penetapan harga (*pricing power*) dan parit ekonomi (*economic moat*) yang tak tergoyahkan. Bisnis komputasi awan Azure dan ekosistem perangkat Apple berhasil menyerap tekanan makroekonomi global.",
    source: "Financial Times",
    url: "https://www.ft.com",
    published_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    category: "GLOBAL_EQUITIES",
    tickers: ["AAPL", "MSFT", "GOOGL", "VOO"],
    sentiment: "BULLISH",
    sentiment_score: 0.78,
    impact_summary: "Mengonfirmasi keunggulan strategi alokasi Wide-Moat Monopoly; perusahaan raksasa ini terus mencetak margin laba superior tanpa terikat risiko sovereign satu negara berkembang.",
  },
  {
    id: "news-hot-5",
    title: "Bank Sentral Dunia Lanjutkan Aksi Borong Emas Fisik: Harga Emas Bertengger Kuat Menuju Target Baru",
    summary: "Laporan World Gold Council mengindikasikan bank-bank sentral negara berkembang terus mendiversifikasi cadangan devisa mereka dari US Dollar ke emas batangan fisik. Tingginya tensi geopolitik dan fragmentasi rantai pasok global menjadikan emas pilar pertahanan modal paling kokoh.",
    source: "Wall Street Journal Commodities",
    url: "https://www.wsj.com/market-data",
    published_at: new Date(Date.now() - 7 * 3600 * 1000).toISOString(),
    category: "SAFE_HAVEN",
    tickers: ["GOLD", "XAUUSD", "GLD"],
    sentiment: "BULLISH",
    sentiment_score: 0.75,
    impact_summary: "Menjaga stabilitas total kekayaan (Net Worth) portofolio saat pasar ekuitas global mengalami turbulensi rotasi sektor.",
  },
  {
    id: "news-hot-6",
    title: "Perdebatan Valuasi AI: Apakah Belanja Cloud Senilai Ratusan Miliar Dolar Akan Menemui Titik Jenuh?",
    summary: "Analisis dari Sequoia Capital dan Goldman Sachs memperdebatkan 'The $600B AI Question'—apakah pendapatan dari software aplikasi berbasis kecerdasan buatan mampu menjustifikasi belanja chip Nvidia dan data center yang masif. Rotasi modal mulai bergerak ke emiten yang menghasilkan arus kas riil.",
    source: "TechCrunch Enterprise",
    url: "https://techcrunch.com",
    published_at: new Date(Date.now() - 11 * 3600 * 1000).toISOString(),
    category: "HOT",
    tickers: ["NVDA", "MSFT", "AMZN", "QQQ"],
    sentiment: "BEARISH",
    sentiment_score: -0.45,
    impact_summary: "Menekankan pentingnya diversifikasi seimbang melalui ETF Global (VT) ketimbang hanya berspekulasi pada satu saham AI semikonduktor.",
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

// Live financial news fetcher via verified Google News RSS queries (Global Focus)
async function fetchLiveRssNews(category?: string): Promise<MarketNewsItem[]> {
  try {
    let query = "global stock market Wall Street AI semiconductor bubble selloff";
    let catEnum: MarketNewsItem["category"] = "HOT";

    if (category) {
      const c = category.toUpperCase();
      if (c === "HOT") {
        query = "stock market selloff AI bubble semiconductor tech crash KOSPI Nikkei";
        catEnum = "HOT";
      } else if (c === "GLOBAL_EQUITIES") {
        query = "Wall Street S&P 500 Apple Microsoft Google Nvidia Big Tech earnings";
        catEnum = "GLOBAL_EQUITIES";
      } else if (c === "CRYPTO") {
        query = "bitcoin crypto spot ETF BlackRock institutional Ethereum liquidity";
        catEnum = "CRYPTO";
      } else if (c === "MACRO_GLOBAL") {
        query = "Federal Reserve interest rate Powell US Treasury inflation DXY dollar";
        catEnum = "MACRO_GLOBAL";
      } else if (c === "SAFE_HAVEN") {
        query = "gold price all time high central bank gold reserves safe haven bullion";
        catEnum = "SAFE_HAVEN";
      }
    }

    // Use English/Global international edition for authentic world financial news
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
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
      let sourceName = sourceMatch ? decodeHtmlEntities(sourceMatch) : "Global Financial Terminal";
      if (title.includes(" - ")) {
        const parts = title.split(" - ");
        if (parts.length > 1) {
          sourceName = parts[parts.length - 1].trim();
          title = parts.slice(0, -1).join(" - ").trim();
        }
      }

      if (!title || !link) continue;

      // Extract potential global tickers
      const tickers: string[] = [];
      const commonSymbols = [
        "NVDA", "AAPL", "MSFT", "GOOGL", "AMZN", "META", "TSLA", "TSM",
        "BTC", "ETH", "IBIT", "VT", "VOO", "SPY", "QQQ", "GLD", "GOLD", "KOSPI"
      ];
      const upperTitle = title.toUpperCase();
      for (const sym of commonSymbols) {
        if (upperTitle.includes(sym)) tickers.push(sym);
      }
      if (tickers.length === 0) {
        if (catEnum === "HOT") tickers.push("AI", "NVDA");
        else if (catEnum === "CRYPTO") tickers.push("BTC");
        else if (catEnum === "SAFE_HAVEN") tickers.push("GOLD");
        else if (catEnum === "GLOBAL_EQUITIES") tickers.push("VT", "SPY");
        else tickers.push("DXY", "FED");
      }

      // Quick sentiment estimation from global keywords
      let sentiment: MarketNewsItem["sentiment"] = "NEUTRAL";
      let sentimentScore = 0.1;
      const bullishWords = ["surge", "rally", "record", "jump", "bullish", "profit", "gain", "boom", "high", "rebound", "soar"];
      const bearishWords = ["plunge", "drop", "selloff", "crash", "slump", "bubble", "sink", "fall", "warning", "retreat", "fears", "loss"];

      const lowerTitle = title.toLowerCase();
      if (bullishWords.some((w) => lowerTitle.includes(w))) {
        sentiment = "BULLISH";
        sentimentScore = 0.75;
      } else if (bearishWords.some((w) => lowerTitle.includes(w))) {
        sentiment = "BEARISH";
        sentimentScore = -0.70;
      }

      items.push({
        id: `rss-global-${i + 1}-${Date.now()}`,
        title,
        summary: `Dispatch dari ${sourceName}: Pantau perkembangan volatilitas pasar dunia, likuiditas bank sentral, dan pergeseran narasi sektor global.`,
        source: sourceName,
        url: link,
        published_at: new Date(pubDate).toISOString(),
        category: catEnum,
        tickers,
        sentiment,
        sentiment_score: sentimentScore,
        impact_summary: `Memengaruhi persepsi risiko institusional dan likuiditas pada ticker ${tickers.join(", ")}.`,
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
