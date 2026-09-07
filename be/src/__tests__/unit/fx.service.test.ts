// Mock yahoo-finance2 before importing the service
jest.mock("yahoo-finance2", () => ({
  __esModule: true,
  default: {
    quote: jest.fn(),
  },
}));

import yahooFinance from "yahoo-finance2";
import { getUsdIdrRate, getFxRateInfo } from "../../modules/market-data/fx.service";

describe("FX Rate Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a number for USD/IDR rate", async () => {
    const rate = await getUsdIdrRate();
    expect(typeof rate).toBe("number");
    expect(rate).toBeGreaterThan(10000);
  });

  it("should return fallback rate when API fails", async () => {
    (yahooFinance.quote as any).mockRejectedValueOnce(new Error("API error"));
    const rate = await getUsdIdrRate();
    expect(rate).toBeGreaterThanOrEqual(16000);
  });

  it("getFxRateInfo should return structured info", async () => {
    const info = await getFxRateInfo();
    expect(info).toHaveProperty("rate");
    expect(info).toHaveProperty("source");
    expect(info).toHaveProperty("updatedAt");
    expect(info).toHaveProperty("isLive");
    expect(typeof info.rate).toBe("number");
    expect(typeof info.source).toBe("string");
  });
});
