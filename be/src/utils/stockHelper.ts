import { AssetType } from "../modules/transactions/transaction.type";

const CRYPTO_LIST = new Set([
  "BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "AVAX", "DOT", "LINK", "MATIC", "USDT", "USDC", "SUI", "NEAR", "PEPE"
]);

const US_STOCKS_AND_ETFS = new Set([
  "AAPL", "NVDA", "TSLA", "MSFT", "GOOGL", "AMZN", "META", "AMD", "NFLX", "INTC", "SPY", "QQQ", "VOO", "VTI", "IWM", "ARKK"
]);

const GOLD_KEYWORDS = new Set(["EMAS", "GOLD", "ANTAM", "UBS", "XAU"]);

/**
 * Detects asset type automatically from symbol name or ticker
 */
export function detectAssetType(rawSymbol: string): AssetType {
  const clean = rawSymbol.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

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

  if (["SPY", "QQQ", "VOO", "VTI", "IWM"].includes(clean)) {
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
 * Formats symbol to standard market ticker (e.g. BBCA -> BBCA.JK, BTC -> BTC-USD)
 */
export function formatTicker(ticker: string, assetType?: AssetType): string {
  const clean = ticker.trim().toUpperCase();

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

  if (type === "STOCK") {
    if (US_STOCKS_AND_ETFS.has(clean)) {
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
 * Parses conversational Indonesian / English money strings
 * Examples: "1.100.000", "1.100.000 rupiah", "1.5jt", "500rb", "2 juta", "1000 usd", "$500"
 */
export function parseIndonesianMoneyString(raw: string): { amount: number; currency: "IDR" | "USD" } | null {
  if (!raw) return null;
  const clean = raw.trim().toLowerCase();
  const isUSD = clean.includes("usd") || clean.includes("$") || clean.includes("dollar");

  // Determine multiplier (supports attached unit like 3jt, 500rb, 1.5juta, 100k)
  let multiplier = 1;
  if (/miliar|milyar/i.test(clean) || /\d+\s*m\b/i.test(clean)) {
    multiplier = 1_000_000_000;
  } else if (/juta|jt/i.test(clean)) {
    multiplier = 1_000_000;
  } else if (/ribu|rb/i.test(clean) || /\d+\s*k\b/i.test(clean)) {
    multiplier = 1_000;
  }

  // Extract number part: digits, dots, commas
  const match = clean.match(/[\d\.,]+/);
  if (!match) return null;

  let numStr = match[0];

  // If thousand separator with dots: "1.100.000" or "4.325.000" or "500.000"
  if (/^\d{1,3}(\.\d{3})+$/.test(numStr)) {
    numStr = numStr.replace(/\./g, "");
  } else if (/^\d{1,3}(,\d{3})+$/.test(numStr)) {
    numStr = numStr.replace(/,/g, "");
  } else if (/^\d+,\d+$/.test(numStr)) {
    numStr = numStr.replace(",", ".");
  }

  const parsed = parseFloat(numStr);
  if (isNaN(parsed) || parsed <= 0) return null;

  // If the number already has full digit representation (e.g. 4325000), do not multiply by juta
  if (parsed >= 10000 && multiplier === 1_000_000) {
    multiplier = 1;
  }

  return {
    amount: parsed * multiplier,
    currency: isUSD ? "USD" : "IDR",
  };
}

/**
 * Common Indonesian 4-letter words that should NOT be treated as stock tickers
 */
const INDONESIAN_IGNORE_WORDS = new Set([
  "BELI", "JUAL", "DARI", "PADA", "SAYA", "ABIS", "YANG", "DENG", "DONG", 
  "HARI", "INFO", "USER", "RUPI", "DICA", "KITA", "DULU", "SEBE", "SEHA",
  "SELA", "KEMU", "LALU", "KARE", "DENG", "AKAN", "TIDA", "BISA", "BUAT",
  "JUTA", "RIBU", "RUPI", "UANG", "DANA", "PORT", "ASET", "DUIT", "MODA",
  "RUGI", "LOSS", "PLUS", "CUAN", "NAIK", "TURU", "KATA", "MAKS", "ATAS",
  "BANT", "TOKO", "PUNY", "MILIK", "SAAT", "ITU", "YA", "DI", "KE", "DONG",
  "KIRA", "SUDA", "KALA", "TAPI", "JUGA", "LAGI", "SEPE", "SEBE", "SETE",
  "SINI", "SITU", "KAMU", "MERE", "KAMI", "ADAL", "BANY", "DIKE", "DIBE"
]);

/**
 * Extracts asset symbol from natural text
 */
export function detectAssetSymbolFromText(text: string): { symbol: string; assetType: AssetType } | null {
  // 1. Check Gold
  if (/\b(EMAS|ANTAM|UBS|GOLD|XAU)\b/i.test(text)) {
    return { symbol: "EMAS", assetType: "GOLD" };
  }

  // 2. Check Crypto
  for (const c of CRYPTO_LIST) {
    const regex = new RegExp(`\\b${c}\\b|\\b${c}-USD\\b`, "i");
    if (regex.test(text)) {
      return { symbol: c, assetType: "CRYPTO" };
    }
  }
  if (/\bBITCOIN\b/i.test(text)) return { symbol: "BTC", assetType: "CRYPTO" };
  if (/\bETHEREUM\b/i.test(text)) return { symbol: "ETH", assetType: "CRYPTO" };
  if (/\bSOLANA\b/i.test(text)) return { symbol: "SOL", assetType: "CRYPTO" };

  // 3. Check Bonds
  const bondMatch = text.match(/\b(ORI\d+|SR\d+|SBR\d+|PBS\d+|FR\d+|SBN|OBLIGASI)\b/i);
  if (bondMatch) {
    return { symbol: bondMatch[1].toUpperCase(), assetType: "BOND" };
  }

  // 4. Check US Stocks / ETFs
  for (const u of US_STOCKS_AND_ETFS) {
    const regex = new RegExp(`\\b${u}\\b`, "i");
    if (regex.test(text)) {
      return { symbol: u, assetType: ["SPY", "QQQ", "VOO", "VTI", "IWM", "ARKK"].includes(u) ? "ETF" : "STOCK" };
    }
  }

  // 5. Check IDX 4-letter Stocks (scan all 4-letter words, skip dictionary ignore words)
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

