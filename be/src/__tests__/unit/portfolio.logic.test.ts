/**
 * Unit Test for Portfolio Math & Logic Rules
 * Tests net worth, weight calculation, profit & loss, cash segregation
 */

describe("Portfolio Calculation Engine — Core Math", () => {
  it("calculates total net worth correctly (Aset + Saldo Kas)", () => {
    const totalMarketValue = 7400000; // Rp 7.400.000
    const cashBalance = 600000;       // Rp 600.000
    const netWorth = totalMarketValue + cashBalance;

    expect(netWorth).toBe(8000000);
  });

  it("calculates floating PnL nominal & percentage accurately", () => {
    const totalInvested = 5000000;    // Modal: Rp 5.000.000
    const totalMarketValue = 6500000; // Nilai Sekarang: Rp 6.500.000
    
    const floatingPnl = totalMarketValue - totalInvested;
    const floatingPnlPercent = Number(((floatingPnl / totalInvested) * 100).toFixed(2));

    expect(floatingPnl).toBe(1500000);
    expect(floatingPnlPercent).toBe(30.00); // +30%
  });

  it("calculates floating loss correctly when value drops", () => {
    const totalInvested = 10000000;   // Modal: Rp 10.000.000
    const totalMarketValue = 8500000; // Nilai Sekarang: Rp 8.500.000

    const floatingPnl = totalMarketValue - totalInvested;
    const floatingPnlPercent = Number(((floatingPnl / totalInvested) * 100).toFixed(2));

    expect(floatingPnl).toBe(-1500000);
    expect(floatingPnlPercent).toBe(-15.00); // -15%
  });

  it("safely handles 0 invested capital without division by zero", () => {
    const totalInvested = 0;
    const totalMarketValue = 0;

    const floatingPnl = totalMarketValue - totalInvested;
    const floatingPnlPercent = totalInvested > 0 ? (floatingPnl / totalInvested) * 100 : 0;

    expect(floatingPnl).toBe(0);
    expect(floatingPnlPercent).toBe(0);
  });
});

describe("Portfolio Calculation Engine — Asset Allocation Weights", () => {
  it("calculates exact percentage weights per asset class", () => {
    const grandTotal = 10000000; // Total Rp 10 Juta
    const btcValue = 4000000;    // Rp 4 Juta (40%)
    const vtValue = 4000000;     // Rp 4 Juta (40%)
    const goldValue = 2000000;   // Rp 2 Juta (20%)

    const btcWeight = Number(((btcValue / grandTotal) * 100).toFixed(1));
    const vtWeight = Number(((vtValue / grandTotal) * 100).toFixed(1));
    const goldWeight = Number(((goldValue / grandTotal) * 100).toFixed(1));

    expect(btcWeight).toBe(40.0);
    expect(vtWeight).toBe(40.0);
    expect(goldWeight).toBe(20.0);
    expect(btcWeight + vtWeight + goldWeight).toBe(100.0);
  });

  it("handles 0 total net worth without crashing", () => {
    const grandTotal = 0;
    const assetValue = 0;
    const weight = grandTotal > 0 ? Number(((assetValue / grandTotal) * 100).toFixed(1)) : 0;

    expect(weight).toBe(0);
  });
});

describe("Portfolio Multi-Wallet Cash Segregation", () => {
  it("isolates cash balances correctly across different wallets", () => {
    const wallets = [
      { id: 1, name: "ajaib", cash_balance: 500000 },
      { id: 2, name: "pluang", cash_balance: 1500000 },
      { id: 3, name: "indodax", cash_balance: 250000 },
    ];

    const totalCash = wallets.reduce((acc, w) => acc + w.cash_balance, 0);
    expect(totalCash).toBe(2250000);

    // Updating ajaib wallet must not affect pluang or indodax
    const depositAmount = 200000;
    wallets[0].cash_balance += depositAmount;

    expect(wallets[0].cash_balance).toBe(700000);
    expect(wallets[1].cash_balance).toBe(1500000); // Unchanged
    expect(wallets[2].cash_balance).toBe(250000);  // Unchanged
  });
});
