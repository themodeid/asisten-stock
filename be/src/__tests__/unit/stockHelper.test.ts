import {
  detectAssetType,
  formatTicker,
  lotsToShares,
  sharesToLots,
  calculateNewAveragePrice,
  parseIndonesianMoneyString,
} from "../../utils/stockHelper";

describe("StockHelper — Asset Type Detection", () => {
  it("detects crypto assets accurately", () => {
    expect(detectAssetType("BTC")).toBe("CRYPTO");
    expect(detectAssetType("ETH")).toBe("CRYPTO");
    expect(detectAssetType("SOL")).toBe("CRYPTO");
    expect(detectAssetType("USDT")).toBe("CRYPTO");
    expect(detectAssetType("bitcoin")).toBe("CRYPTO");
  });

  it("detects US ETFs accurately", () => {
    expect(detectAssetType("VT")).toBe("ETF");
    expect(detectAssetType("VOO")).toBe("ETF");
    expect(detectAssetType("SPY")).toBe("ETF");
    expect(detectAssetType("QQQ")).toBe("ETF");
  });

  it("detects Indonesian and US stocks accurately", () => {
    expect(detectAssetType("BBCA")).toBe("STOCK");
    expect(detectAssetType("BBRI")).toBe("STOCK");
    expect(detectAssetType("AAPL")).toBe("STOCK");
    expect(detectAssetType("NVDA")).toBe("STOCK");
    expect(detectAssetType("ANTAM")).toBe("STOCK"); // Mapped to ANTM.JK
  });

  it("detects Gold & Commodities accurately", () => {
    expect(detectAssetType("EMAS")).toBe("GOLD");
    expect(detectAssetType("GOLD")).toBe("GOLD");
    expect(detectAssetType("XAU")).toBe("GOLD");
  });
});

describe("StockHelper — Ticker Formatting", () => {
  it("formats Indonesian stocks to .JK format", () => {
    expect(formatTicker("BBCA", "STOCK")).toBe("BBCA.JK");
    expect(formatTicker("TLKM", "STOCK")).toBe("TLKM.JK");
  });

  it("formats Crypto to standard USD pair", () => {
    expect(formatTicker("BTC", "CRYPTO")).toBe("BTC-USD");
    expect(formatTicker("ETH", "CRYPTO")).toBe("ETH-USD");
  });

  it("preserves US ETF tickers without accidental suffixes", () => {
    expect(formatTicker("VT", "ETF")).toBe("VT");
    expect(formatTicker("VT-USD", "ETF")).toBe("VT");
    expect(formatTicker("VOO", "ETF")).toBe("VOO");
  });
});

describe("StockHelper — Lots & Shares Conversion", () => {
  it("converts lots to shares (1 lot = 100 shares)", () => {
    expect(lotsToShares(1)).toBe(100);
    expect(lotsToShares(15)).toBe(1500);
    expect(lotsToShares(0)).toBe(0);
  });

  it("converts shares to lots", () => {
    expect(sharesToLots(100)).toBe(1);
    expect(sharesToLots(1500)).toBe(15);
    expect(sharesToLots(50)).toBe(0.5);
  });
});

describe("StockHelper — Average Price Calculation (Dollar-Cost Averaging)", () => {
  it("calculates weighted average price correctly when adding shares", () => {
    const newAvg = calculateNewAveragePrice(100, 5000, 100, 7000);
    expect(newAvg).toBe(6000);
  });

  it("handles buying at same price without changing average", () => {
    const newAvg = calculateNewAveragePrice(50, 10000, 50, 10000);
    expect(newAvg).toBe(10000);
  });

  it("handles initial buy when current quantity is 0", () => {
    const newAvg = calculateNewAveragePrice(0, 0, 10, 25000);
    expect(newAvg).toBe(25000);
  });

  it("returns 0 if total quantity is 0", () => {
    expect(calculateNewAveragePrice(0, 0, 0, 0)).toBe(0);
  });
});

describe("StockHelper — Indonesian Money String Parsing", () => {
  it("parses dot-formatted Rupiah strings", () => {
    expect(parseIndonesianMoneyString("Rp 1.500.000")?.amount).toBe(1500000);
    expect(parseIndonesianMoneyString("4.325.000")?.amount).toBe(4325000);
    expect(parseIndonesianMoneyString("50.000 idr")?.amount).toBe(50000);
  });

  it("parses conversational abbreviations (jt, rb)", () => {
    expect(parseIndonesianMoneyString("1.5jt")?.amount).toBe(1500000);
    expect(parseIndonesianMoneyString("500rb")?.amount).toBe(500000);
    expect(parseIndonesianMoneyString("2 juta")?.amount).toBe(2000000);
  });

  it("detects USD currency indicators", () => {
    const usdResult = parseIndonesianMoneyString("$500");
    expect(usdResult?.currency).toBe("USD");
    expect(usdResult?.amount).toBe(500);
  });

  it("returns null for invalid inputs", () => {
    expect(parseIndonesianMoneyString("")).toBeNull();
    expect(parseIndonesianMoneyString("halo dunia")).toBeNull();
  });
});
