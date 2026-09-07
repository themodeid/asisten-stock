import { AssetType } from "../modules/transactions/transaction.type";

const CRYPTO_LIST = new Set([
  "BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "AVAX", "DOT", "LINK", "MATIC", "USDT", "USDC", "SUI", "NEAR", "PEPE"
]);

const US_ETFS = new Set([
  "VT", "VXUS", "VTI", "VOO", "SPY", "QQQ", "IVV", "SCHD", "VEA", "VWO", "BND", "AGG", "GLD", "SLV", "ARKK", "SMH", "SOXX", "XLE", "XLF", "XLK", "XLV", "XLY", "XLP", "XLU", "XLI", "XLB", "VNQ", "DIA", "IWM", "VIG", "VGT", "TQQQ", "SQQQ", "TLT"
]);

const US_STOCKS = new Set([
  "AAPL", "NVDA", "TSLA", "MSFT", "GOOGL", "GOOG", "AMZN", "META", "AMD", "NFLX", "INTC", "PLTR", "COIN", "MSTR", "BABA", "TSM"
]);

const GOLD_KEYWORDS = new Set(["EMAS", "GOLD", "ANTAM", "UBS", "XAU"]);

export const COMMON_ALIASES: Record<string, string> = {
  GOOGLE: "GOOGL",
  ALPHABET: "GOOGL",
  GOOG: "GOOGL",
  APPLE: "AAPL",
  TESLA: "TSLA",
  MICROSOFT: "MSFT",
  AMAZON: "AMZN",
  META: "META",
  FACEBOOK: "META",
  NVIDIA: "NVDA",
  NETFLIX: "NFLX",
  BITCOIN: "BTC-USD",
  ETHEREUM: "ETH-USD",
  SOLANA: "SOL-USD",
  TETHER: "USDT-USD",
  DOGECOIN: "DOGE-USD",
  BCA: "BBCA.JK",
  BRI: "BBRI.JK",
  MANDIRI: "BMRI.JK",
  BNI: "BBNI.JK",
  TELKOM: "TLKM.JK",
  ASTRA: "ASII.JK",
  GOJEK: "GOTO.JK",
  GOTO: "GOTO.JK",
  TOKPED: "GOTO.JK",
  ANTAM: "ANTM.JK",
  INDOFOOD: "INDF.JK",
  ICBP: "ICBP.JK",
  UNILEVER: "UNVR.JK",
  BUMI: "BUMI.JK",
  ADRO: "ADRO.JK",
  PGAS: "PGAS.JK",
  BRIS: "BRIS.JK",
  EMAS: "GOLD.IDR",
  GOLD: "GOLD.IDR",
};

/**
 * Detects asset type automatically from symbol name or ticker
 */
export function detectAssetType(rawSymbol: string): AssetType {
  const clean = rawSymbol.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (COMMON_ALIASES[clean]) {
    const aliased = COMMON_ALIASES[clean];
    if (aliased.includes("-USD") || CRYPTO_LIST.has(aliased)) return "CRYPTO";
    if (aliased.includes("GOLD")) return "GOLD";
    if (US_ETFS.has(aliased)) return "ETF";
    return "STOCK";
  }

  if (
    clean.includes("EMAS") ||
    clean.includes("GOLD") ||
    clean.includes("ANTAM") ||
    clean.includes("UBS") ||
    clean.includes("XAU")
  ) {
    return "GOLD";
  }

  if (
    CRYPTO_LIST.has(clean) ||
    clean.includes("BITCOIN") ||
    clean.includes("ETHEREUM") ||
    clean.includes("SOLANA") ||
    clean.endsWith("USDT") ||
    clean.endsWith("USD")
  ) {
    return "CRYPTO";
  }

  if (
    clean.startsWith("ORI") ||
    clean.startsWith("SR") ||
    clean.startsWith("FR") ||
    clean.startsWith("PBS") ||
    clean.includes("SBN") ||
    clean.includes("OBLIGASI")
  ) {
    return "BOND";
  }

  if (US_ETFS.has(clean)) {
    return "ETF";
  }

  if (
    clean.includes("REKSADANA") ||
    clean.includes("RDPU") ||
    clean.includes("RDPT") ||
    clean.includes("SUCOR")
  ) {
    return "MUTUAL_FUND";
  }

  return "STOCK";
}

/**
 * Formats symbol to standard market ticker (e.g. BBCA -> BBCA.JK, BTC -> BTC-USD, GOOGLE -> GOOGL)
 */
export function formatTicker(ticker: string, assetType?: AssetType): string {
  const clean = ticker.trim().toUpperCase();

  if (COMMON_ALIASES[clean]) {
    return COMMON_ALIASES[clean];
  }

  if (clean.includes(".")) return clean;

  const type = assetType || detectAssetType(clean);

  if (type === "CRYPTO") {
    if (!clean.includes("-") && !clean.endsWith("USD")) {
      return `${clean}-USD`;
    }
    return clean;
  }

  if (type === "GOLD") {
    return "GOLD.IDR";
  }

  if (type === "BOND" || type === "MUTUAL_FUND") {
    return clean;
  }

  if (type === "ETF") {
    return clean;
  }

  if (type === "STOCK") {
    if (US_STOCKS.has(clean)) {
      return clean;
    }
    // Default Indonesian 4-letter ticker to .JK
    if (/^[A-Z]{4,5}$/.test(clean)) {
      return `${clean}.JK`;
    }
  }

  return clean;
}

/**
 * Converts Indonesian stock lots to total shares (1 lot = 100 shares)
 */
export function lotsToShares(lots: number): number {
  return Math.round(lots * 100);
}

/**
 * Converts shares to lots
 */
export function sharesToLots(shares: number): number {
  return Number((shares / 100).toFixed(2));
}

/**
 * Calculates new average price when buying additional units
 */
export function calculateNewAveragePrice(
  currentQuantity: number,
  currentAvgPrice: number,
  addedQuantity: number,
  buyPrice: number
): number {
  const totalQuantity = currentQuantity + addedQuantity;
  if (totalQuantity <= 0) return 0;
  const totalCost = currentQuantity * currentAvgPrice + addedQuantity * buyPrice;
  return Number((totalCost / totalQuantity).toFixed(4));
}

/**
 * Formats Rupiah or USD currency
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Indonesian number words mapping
 */
const INDO_MAP: Record<string, number> = {
  nol: 0, kosong: 0,
  satu: 1, se: 1,
  dua: 2,
  tiga: 3,
  empat: 4,
  lima: 5,
  enam: 6,
  tujuh: 7,
  delapan: 8,
  sembilan: 9,
  sepuluh: 10,
  sebelas: 11,
  seratus: 100,
  seribu: 1000,
  sejuta: 1000000,
  semiliar: 1000000000,
  setengah: 0.5,
};

/**
 * Parses conversational Indonesian / English money strings
 * Examples: "1.100.000", "6 ratus 30 ribu", "1.5jt", "500rb", "2 juta", "1000 usd", "$500"
 */
export function parseIndonesianMoneyString(raw: string): { amount: number; currency: "IDR" | "USD" } | null {
  if (!raw) return null;
  const clean = raw.trim().toLowerCase();
  const isUSD = clean.includes("usd") || clean.includes("$") || clean.includes("dollar");

  // 1. Direct numerical pattern with thousand dots: e.g. "4.325.000", "500.000", "10.000.000"
  const dotPattern = clean.match(/(?:rp\.?|rp\s*)?\s*(\d{1,3}(?:\.\d{3})+)(?:\s*(?:rupiah|idr))?/i);
  if (dotPattern) {
    const val = parseFloat(dotPattern[1].replace(/\./g, ""));
    if (!isNaN(val) && val > 0) {
      return { amount: val, currency: isUSD ? "USD" : "IDR" };
    }
  }

  // 2. Multi-word phrase parser for "6 ratus 30 ribu", "enam ratus tiga puluh ribu", "2 ratus 50 ribu", "1 juta 500 ribu"
  const tokens = clean
    .replace(/rp\.?/g, "")
    .replace(/[^\w\s\.]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  let total = 0;
  let currentGroup = 0;

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    let val = parseFloat(tok);
    if (isNaN(val)) {
      if (tok in INDO_MAP) {
        val = INDO_MAP[tok];
      }
    }

    if (!isNaN(val)) {
      const next = tokens[i + 1];
      if (next === "ratus") {
        currentGroup += val * 100;
        i++;
      } else if (next === "puluh") {
        currentGroup += val * 10;
        i++;
      } else if (next === "belas") {
        currentGroup += val + 10;
        i++;
      } else if (next === "ribu" || next === "rb" || next === "k") {
        currentGroup += val;
        total += currentGroup * 1000;
        currentGroup = 0;
        i++;
      } else if (next === "juta" || next === "jt") {
        currentGroup += val;
        total += currentGroup * 1000000;
        currentGroup = 0;
        i++;
      } else if (next === "miliar" || next === "milyar") {
        currentGroup += val;
        total += currentGroup * 1000000000;
        currentGroup = 0;
        i++;
      } else {
        currentGroup += val;
      }
    } else if (tok === "seratus") {
      currentGroup += 100;
    } else if (tok === "seribu") {
      total += (currentGroup || 1) * 1000;
      currentGroup = 0;
    } else if (tok === "sejuta") {
      total += (currentGroup || 1) * 1000000;
      currentGroup = 0;
    } else if (tok === "ribu" || tok === "rb") {
      if (currentGroup > 0) {
        total += currentGroup * 1000;
        currentGroup = 0;
      }
    } else if (tok === "juta" || tok === "jt") {
      if (currentGroup > 0) {
        total += currentGroup * 1000000;
        currentGroup = 0;
      }
    }
  }

  total += currentGroup;

  if (total > 0) {
    return { amount: total, currency: isUSD ? "USD" : "IDR" };
  }

  // 3. Direct simple digit with multiplier fallback e.g. "500rb", "100k", "1.5jt", "2.5 juta", "500 ribu"
  const shortPattern = clean.match(/(?:rp\.?|rp\s*|\$)?\s*(\d+(?:[,\.]\d+)?)\s*(k|rb|ribu|jt|juta|miliar|milyar|m|b)\b/i);
  if (shortPattern) {
    const num = parseFloat(shortPattern[1].replace(",", "."));
    const unit = shortPattern[2].toLowerCase();
    let mult = 1;
    if (unit === "k" || unit === "rb" || unit === "ribu") mult = 1000;
    else if (unit === "jt" || unit === "juta" || unit === "m") mult = 1000000;
    else if (unit === "miliar" || unit === "milyar" || unit === "b") mult = 1000000000;
    if (!isNaN(num) && num > 0) {
      return { amount: num * mult, currency: isUSD ? "USD" : "IDR" };
    }
  }

  // 4. Raw number fallback: e.g. "4325000"
  const rawNumMatch = clean.match(/\b\d{4,12}\b/);
  if (rawNumMatch) {
    return { amount: parseFloat(rawNumMatch[0]), currency: isUSD ? "USD" : "IDR" };
  }

  return null;
}

/**
 * Common Indonesian words that should NOT be treated as stock tickers
 */
const INDONESIAN_IGNORE_WORDS = new Set([
  "BELI", "JUAL", "DARI", "PADA", "SAYA", "ABIS", "YANG", "DENG", "DONG", 
  "HARI", "INFO", "USER", "RUPI", "DICA", "KITA", "DULU", "SEBE", "SEHA",
  "SELA", "KEMU", "LALU", "KARE", "AKAN", "TIDA", "BISA", "BUAT", "TIDAK",
  "JUTA", "RIBU", "RUPI", "UANG", "DANA", "PORT", "ASET", "DUIT", "MODA",
  "RUGI", "LOSS", "PLUS", "CUAN", "NAIK", "TURU", "KATA", "MAKS", "ATAS",
  "BANT", "TOKO", "PUNY", "MILIK", "SAAT", "ITU", "YA", "DI", "KE", "SAMA",
  "KIRA", "SUDA", "KALA", "TAPI", "JUGA", "LAGI", "SEPE", "SETE", "PUNYA",
  "SINI", "SITU", "KAMU", "MERE", "KAMI", "ADAL", "BANY", "DIKE", "DIBE",
  "BANYAK", "SEMUA", "TOTAL", "SEBESAR", "SEBANYAK", "SENILAI", "TOLONG",
  "CATAT", "KEMARIN", "SEKARANG", "BESOK", "RATUS", "PULUH", "BELAS",
  "MILIAR", "MILYAR", "RUPIAH", "DOLLAR", "DENGAN", "UNTUK", "ADALAH",
  "DALAM", "MEREKA", "MASUK", "KELUAR", "HABIS", "KINI", "BULAN", "TAHUN",
  "BIAR", "BAGUS", "KEMANA", "MANA", "ALOKASI", "REBALANCE", "SEIMBANG",
  "SARAN", "PAJAK", "KENA", "BAYAR", "POTONG", "BERSIH", "REALISASI", "LABA"
]);

/**
 * Extracts asset symbol from natural text
 */
export function detectAssetSymbolFromText(text: string): { symbol: string; assetType: AssetType } | null {
  // 1. Explicit marker keywords (highest priority!)
  // e.g. "etf vt", "etf spy", "saham bbca", "kripto btc", "koin sol", "token btc", "reksadana sucor", "obligasi ori024"
  const etfExplicit = text.match(/\b(?:ETF)\s+([A-Za-z0-9\.\-]+)\b/i);
  if (etfExplicit) {
    return { symbol: etfExplicit[1].toUpperCase(), assetType: "ETF" };
  }

  const stockExplicit = text.match(/\b(?:saham|stock)\s+([A-Za-z0-9\.\-]+)\b/i);
  if (stockExplicit) {
    const sym = stockExplicit[1].toUpperCase();
    if (!INDONESIAN_IGNORE_WORDS.has(sym)) {
      return { symbol: sym, assetType: "STOCK" };
    }
  }

  const cryptoExplicit = text.match(/\b(?:kripto|crypto|koin|token)\s+([A-Za-z0-9\.\-]+)\b/i);
  if (cryptoExplicit) {
    return { symbol: cryptoExplicit[1].toUpperCase(), assetType: "CRYPTO" };
  }

  const bondExplicit = text.match(/\b(?:obligasi|sbn|surat\s+berharga)\s+([A-Za-z0-9\.\-]+)\b/i);
  if (bondExplicit) {
    return { symbol: bondExplicit[1].toUpperCase(), assetType: "BOND" };
  }

  // 2. Gold
  if (/\b(EMAS|ANTAM|UBS|GOLD|XAU)\b/i.test(text)) {
    return { symbol: "EMAS", assetType: "GOLD" };
  }

  // 3. Known ETFs
  for (const etf of US_ETFS) {
    const regex = new RegExp(`\\b${etf}\\b`, "i");
    if (regex.test(text)) {
      return { symbol: etf, assetType: "ETF" };
    }
  }

  // 4. Known Crypto
  for (const c of CRYPTO_LIST) {
    const regex = new RegExp(`\\b${c}\\b|\\b${c}-USD\\b`, "i");
    if (regex.test(text)) {
      return { symbol: c, assetType: "CRYPTO" };
    }
  }
  if (/\bBITCOIN\b/i.test(text)) return { symbol: "BTC", assetType: "CRYPTO" };
  if (/\bETHEREUM\b/i.test(text)) return { symbol: "ETH", assetType: "CRYPTO" };
  if (/\bSOLANA\b/i.test(text)) return { symbol: "SOL", assetType: "CRYPTO" };

  // 5. Known US Stocks
  for (const s of US_STOCKS) {
    const regex = new RegExp(`\\b${s}\\b`, "i");
    if (regex.test(text)) {
      return { symbol: s, assetType: "STOCK" };
    }
  }

  // 6. Bonds
  const bondMatch = text.match(/\b(ORI\d+|SR\d+|SBR\d+|PBS\d+|FR\d+|SBN|OBLIGASI)\b/i);
  if (bondMatch) {
    return { symbol: bondMatch[1].toUpperCase(), assetType: "BOND" };
  }

  // 7. General 4-letter IDX Stocks
  const allWords = text.match(/\b([A-Za-z]{4})\b/g);
  if (allWords) {
    for (const w of allWords) {
      const upperW = w.toUpperCase();
      if (!INDONESIAN_IGNORE_WORDS.has(upperW)) {
        return { symbol: upperW, assetType: "STOCK" };
      }
    }
  }

  return null;
}

