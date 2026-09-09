import { pool } from "../../config/database";
import {
  Portfolio,
  PortfolioHolding,
  PortfolioSummary,
  AssetAllocation,
  PortfolioFxSummary,
  FxHoldingItem,
  WalletHoldingBreakdown,
} from "./portfolio.type";
import * as marketService from "../market-data/market.service";
import * as fxService from "../market-data/fx.service";
import { formatTicker, detectAssetType } from "../../utils/stockHelper";

export const getPrimaryPortfolioByUserId = async (
  userId: number
): Promise<Portfolio> => {
  const { rows } = await pool.query(
    "SELECT * FROM portfolios WHERE user_id = $1 ORDER BY id ASC LIMIT 1;",
    [userId]
  );

  if (rows.length > 0) return rows[0];

  // Auto-create user if not exists
  const userCheck = await pool.query("SELECT id FROM users WHERE id = $1;", [userId]);
  if (userCheck.rows.length === 0) {
    await pool.query(
      `INSERT INTO users (id, telegram_id, first_name, username) 
       VALUES ($1, $2, 'Adam (Asisten+Stock User)', 'asisten_stock_user') 
       ON CONFLICT (id) DO NOTHING;`,
      [userId, userId === 1 ? 123456789 : userId]
    );
  }

  // Auto-create if not present
  const created = await pool.query(
    "INSERT INTO portfolios (user_id, name, cash_balance) VALUES ($1, $2, $3) RETURNING *;",
    [userId, "Portofolio Utama", 10000000]
  );
  return created.rows[0];
};

export const getPortfolioSummary = async (
  portfolioId: number
): Promise<PortfolioSummary> => {
  // 1. Fetch portfolio info
  const pResult = await pool.query(
    "SELECT * FROM portfolios WHERE id = $1;",
    [portfolioId]
  );
  if (pResult.rows.length === 0) {
    throw new Error("Portfolio not found");
  }
  const portfolio: Portfolio = pResult.rows[0];

  // 2. Fetch all active holdings with quantity > 0 or total_shares > 0
  const hResult = await pool.query(
    `SELECT * FROM portfolio_holdings 
     WHERE portfolio_id = $1 AND (quantity > 0 OR total_shares > 0) 
     ORDER BY total_invested DESC;`,
    [portfolioId]
  );

  const rawHoldings = hResult.rows;
  let totalInvested = 0;
  let totalMarketValue = 0;

  // 3. Attach live prices to holdings
  const enrichedHoldings: PortfolioHolding[] = await Promise.all(
    rawHoldings.map(async (row) => {
      const assetType = row.asset_type || "STOCK";
      const quantity = Number(row.quantity || row.total_shares || 0);
      const shares = Number(row.total_shares || (assetType === "STOCK" ? quantity : 0));
      const lots = Number(row.total_lots || (assetType === "STOCK" ? quantity / 100 : 0));
      const avgPrice = Number(row.avg_buy_price);
      const invested = Number(row.total_invested);
      const usdToIdrRate = await fxService.getUsdIdrRate();
      const isAssetUSD =
        row.currency === "USD" ||
        row.ticker.endsWith("-USD") ||
        ["VT", "VOO", "SPY", "QQQ", "AAPL", "NVDA", "TSLA", "MSFT", "VTI"].includes(row.ticker);

      const currency = isAssetUSD ? "USD" : (row.currency || "IDR");

      let currentPrice = avgPrice;
      let companyName = row.ticker;

      try {
        const quote = await marketService.getStockQuote(row.ticker, assetType);
        currentPrice = Number(quote.regularMarketPrice);
        companyName = quote.name || row.ticker;
      } catch (e) {
        // use avgPrice fallback
      }

      // If currency in DB was already recorded in IDR, do NOT multiply by exchange rate
      const rowCurrency = (row.currency || "IDR").toUpperCase();
      const investedIDR = rowCurrency === "USD" ? invested * usdToIdrRate : invested;

      // Current market valuation in IDR
      const marketValIDR = isAssetUSD ? quantity * currentPrice * usdToIdrRate : quantity * currentPrice;
      const marketVal = isAssetUSD ? quantity * currentPrice : marketValIDR;

      totalInvested += investedIDR;
      totalMarketValue += marketValIDR;

      const pnlIDR = marketValIDR - investedIDR;
      const pnlPercent = investedIDR > 0 ? (pnlIDR / investedIDR) * 100 : 0;

      return {
        id: row.id,
        portfolio_id: row.portfolio_id,
        ticker: row.ticker,
        asset_type: assetType,
        quantity,
        currency,
        total_shares: shares,
        total_lots: lots,
        avg_buy_price: avgPrice,
        total_invested: invested,
        total_invested_idr: investedIDR,
        updated_at: row.updated_at,
        current_price: currentPrice,
        market_value: marketVal,
        market_value_idr: marketValIDR,
        floating_pnl: pnlIDR,
        floating_pnl_percent: Number(pnlPercent.toFixed(2)),
        company_name: companyName,
      };
    })
  );

  // 4. Calculate weight percentages
  const grandTotalIDR = totalMarketValue + Number(portfolio.cash_balance);
  const holdingsWithWeights = enrichedHoldings.map((h: any) => ({
    ...h,
    weight_percent:
      grandTotalIDR > 0
        ? Number((((h.market_value_idr || 0) / grandTotalIDR) * 100).toFixed(2))
        : 0,
  }));

  // 5. Compute Asset Allocation Breakdown
  const allocationMap = new Map<string, { label: string; total_value: number; count: number }>();
  
  const labels: Record<string, string> = {
    STOCK: "Saham",
    CRYPTO: "Kripto (Crypto)",
    ETF: "ETF",
    BOND: "Obligasi / SBN",
    MUTUAL_FUND: "Reksadana",
    GOLD: "Emas & Logam Mulia",
    CASH: "Kas / Saldo",
  };

  for (const h of holdingsWithWeights) {
    const type = h.asset_type || "STOCK";
    const existing = allocationMap.get(type) || {
      label: labels[type] || type,
      total_value: 0,
      count: 0,
    };
    existing.total_value += (h as any).market_value_idr || 0;
    existing.count += 1;
    allocationMap.set(type, existing);
  }

  if (Number(portfolio.cash_balance) > 0) {
    allocationMap.set("CASH", {
      label: "Kas & Tunai",
      total_value: Number(portfolio.cash_balance),
      count: 1,
    });
  }

  const asset_allocations: AssetAllocation[] = Array.from(allocationMap.entries()).map(
    ([type, data]) => ({
      asset_type: type as any,
      label: data.label,
      total_value: data.total_value,
      percentage: grandTotalIDR > 0 ? Number(((data.total_value / grandTotalIDR) * 100).toFixed(1)) : 0,
      count: data.count,
    })
  );

  const totalFloatingPnl = totalMarketValue - totalInvested;
  const totalFloatingPnlPercent =
    totalInvested > 0 ? (totalFloatingPnl / totalInvested) * 100 : 0;

  return {
    portfolio_id: portfolio.id,
    portfolio_name: portfolio.name,
    cash_balance: Number(portfolio.cash_balance),
    total_invested: totalInvested,
    total_market_value: totalMarketValue,
    total_value: totalMarketValue,
    total_net_worth: grandTotalIDR,
    total_floating_pnl: totalFloatingPnl,
    total_floating_pnl_percent: Number(totalFloatingPnlPercent.toFixed(2)),
    holdings_count: holdingsWithWeights.length,
    holdings: holdingsWithWeights,
    asset_allocations,
  };
};

export const updateCashBalance = async (
  portfolioId: number,
  amount: number,
  type: "DEPOSIT" | "WITHDRAW"
): Promise<Portfolio> => {
  const op = type === "DEPOSIT" ? "+" : "-";
  const { rows } = await pool.query(
    `UPDATE portfolios 
     SET cash_balance = cash_balance ${op} $1, updated_at = NOW() 
     WHERE id = $2 
     RETURNING *;`,
    [amount, portfolioId]
  );
  return rows[0];
};

export const calculateRebalancePlan = async (
  portfolioId: number,
  freshCapital: number = 1000000,
  strategy: string = "STATELESS_GLOBAL",
  customTargets?: Record<string, number>,
  userId: number = 1
): Promise<any> => {
  let summary: PortfolioSummary;
  if (!portfolioId || portfolioId === 0) {
    summary = await getAggregatedPortfolioSummary(userId);
  } else {
    try {
      summary = await getPortfolioSummary(portfolioId);
    } catch {
      summary = await getAggregatedPortfolioSummary(userId);
    }
  }

  const currentTotal = summary.total_net_worth || summary.total_market_value || 0;
  const projectedTotal = currentTotal + freshCapital;

  // Preset Strategy Targets - Redesigned for Global Sovereign & Macro Resilient Portfolios
  const STRATEGIES: Record<string, { name: string; desc: string; targets: Record<string, number> }> = {
    STATELESS_GLOBAL: {
      name: "Stateless Global Macro (Anti-Fragile)",
      desc: "Bebas risiko satu negara: 60% ETF Global VT (USD), 20% Emas (Safe Haven), 20% Bitcoin (BTC). 0% Saham Domestik.",
      targets: { ETF: 60, GOLD: 20, CRYPTO: 20, STOCK: 0 },
    },
    ALL_WEATHER_GLOBAL: {
      name: "Classic All-Weather Global (Ray Dalio Style)",
      desc: "Tahan segala siklus ekonomi dunia: 50% ETF Global VT, 30% Emas Logam Mulia, 15% Bitcoin, 5% Saham Pilihan.",
      targets: { ETF: 50, GOLD: 30, CRYPTO: 15, STOCK: 5 },
    },
    HIGH_ALPHA_GLOBAL: {
      name: "Aggressive Global Alpha (Maksimal Pertumbuhan)",
      desc: "Akumulasi ekspansi kekayaan global: 55% ETF Global VT, 35% Bitcoin & Kripto, 10% Emas. 0% Saham Domestik.",
      targets: { ETF: 55, CRYPTO: 35, GOLD: 10, STOCK: 0 },
    },
    CAPITAL_DEFENSE: {
      name: "Global Capital Preservation (Pelindung Modal)",
      desc: "Prioritas lindung nilai kekayaan terhadap inflasi & krisis mata uang: 45% Emas Logam Mulia, 40% ETF Global VT, 10% Kripto, 5% Saham.",
      targets: { GOLD: 45, ETF: 40, CRYPTO: 10, STOCK: 5 },
    },
  };

  // Backward compatibility alias:
  const strategyAlias: Record<string, string> = {
    BALANCED_GROWTH: "STATELESS_GLOBAL",
    ALL_WEATHER: "ALL_WEATHER_GLOBAL",
    HIGH_ALPHA: "HIGH_ALPHA_GLOBAL",
    CONSERVATIVE: "CAPITAL_DEFENSE",
  };
  const resolvedStrategyKey = strategyAlias[strategy] || strategy;
  const selectedStrategy = STRATEGIES[resolvedStrategyKey] || STRATEGIES.STATELESS_GLOBAL;
  const targetWeights = customTargets || selectedStrategy.targets;

  // Aggregate current values by Asset Class
  const currentValues: Record<string, number> = {
    CRYPTO: 0,
    ETF: 0,
    STOCK: 0,
    GOLD: 0,
  };

  for (const h of summary.holdings) {
    const type = h.asset_type || "STOCK";
    const val = (h as any).market_value_idr || 0;
    currentValues[type] = (currentValues[type] || 0) + val;
  }

  // Calculate gaps and target amounts
  const assetTypes = ["ETF", "GOLD", "CRYPTO", "STOCK"] as const;
  const representativeTickers: Record<string, string> = {
    ETF: "VT (Vanguard Total World ETF / Pluang)",
    GOLD: "EMAS (Emas Logam Mulia / Fisik / PAXG)",
    CRYPTO: "BTC (Bitcoin Sovereign / Ajaib & Pluang)",
    STOCK: "Saham IDX (0% Alokasi)",
  };

  const assetLabels: Record<string, string> = {
    ETF: "ETF Global Dunia (VT)",
    GOLD: "Emas Safe Haven (XAU)",
    CRYPTO: "Kripto & Bitcoin (BTC)",
    STOCK: "Saham Domestik (IDX)",
  };

  // Find underweight classes and their deficit amounts
  let totalDeficit = 0;
  const deficits: Record<string, number> = {};

  for (const type of assetTypes) {
    const targetPct = targetWeights[type] || 0;
    const targetVal = (targetPct / 100) * projectedTotal;
    const currentVal = currentValues[type] || 0;
    const deficit = Math.max(0, targetVal - currentVal);
    deficits[type] = deficit;
    totalDeficit += deficit;
  }

  // Distribute freshCapital to underweight classes
  const items: any[] = assetTypes.map((type) => {
    const currentVal = currentValues[type] || 0;
    const currentPct = currentTotal > 0 ? (currentVal / currentTotal) * 100 : 0;
    const targetPct = targetWeights[type] || 0;
    const gapPct = targetPct - currentPct;

    let allocatedInflow = 0;
    if (targetPct > 0 && freshCapital > 0) {
      if (totalDeficit > 0) {
        if (deficits[type] > 0) {
          allocatedInflow = (deficits[type] / totalDeficit) * freshCapital;
        } else {
          allocatedInflow = 0;
        }
      } else {
        allocatedInflow = (targetPct / 100) * freshCapital;
      }
    }

    const roundedInflow = Math.round(allocatedInflow);
    const allocatedInflowPct = freshCapital > 0 ? (roundedInflow / freshCapital) * 100 : 0;

    let status: "UNDERWEIGHT" | "BALANCED" | "OVERWEIGHT" = "BALANCED";
    if (targetPct === 0) {
      status = currentVal > 0 ? "OVERWEIGHT" : "BALANCED";
    } else if (gapPct > 3) {
      status = "UNDERWEIGHT";
    } else if (gapPct < -3) {
      status = "OVERWEIGHT";
    }

    let recommended_action = `Pertahankan alokasi wajar.`;
    if (targetPct === 0) {
      recommended_action = currentVal > 0
        ? `Target 0%: Jangan tambah modal baru (biarkan aset global berkembang).`
        : `Target 0%: Diabaikan untuk menghindari risiko pasar domestik.`;
    } else if (roundedInflow > 0) {
      recommended_action = `Beli ${representativeTickers[type]} senilai Rp ${roundedInflow.toLocaleString("id-ID")}`;
    } else if (status === "OVERWEIGHT") {
      recommended_action = `Hold / Tahan (Porsi saat ini ${currentPct.toFixed(1)}% sudah melampaui target ${targetPct}%, alihkan belanja modal ke ETF & Emas).`;
    }

    return {
      asset_type: type,
      label: assetLabels[type],
      representative_ticker: representativeTickers[type],
      current_value_idr: Math.round(currentVal),
      current_weight_percent: Number(currentPct.toFixed(1)),
      target_weight_percent: Number(targetPct.toFixed(1)),
      weight_gap_percent: Number(gapPct.toFixed(1)),
      status,
      recommended_inflow_idr: roundedInflow,
      recommended_inflow_percent: Number(allocatedInflowPct.toFixed(1)),
      recommended_action,
    };
  });

  const summaryAdvice = `Dengan menyalurkan dana segar Rp ${freshCapital.toLocaleString("id-ID")} ke aset yang Underweight (terutama ${items.filter(i => i.recommended_inflow_idr > 0).map(i => i.label.split(" ")[0]).join(" dan ")}), portofolio Anda akan lebih seimbang secara organik tanpa perlu menjual aset yang sedang floating loss.`;

  return {
    portfolio_id: portfolioId,
    strategy_name: selectedStrategy.name,
    description: selectedStrategy.desc,
    current_total_value_idr: Math.round(currentTotal),
    fresh_capital_idr: Math.round(freshCapital),
    projected_total_value_idr: Math.round(projectedTotal),
    items,
    summary_advice: summaryAdvice,
  };
};

export const calculateTaxSimulation = async (params: {
  asset_type?: string;
  ticker?: string;
  sell_amount_idr?: number;
  sell_quantity?: number;
  is_bappebti?: boolean;
  has_npwp?: boolean;
  portfolio_id?: number;
}): Promise<any> => {
  const assetType = (params.asset_type || "CRYPTO").toUpperCase();
  const rawTicker = (params.ticker || "BTC-USD").toUpperCase();
  const isBappebti = params.is_bappebti !== false;
  const hasNpwp = params.has_npwp !== false;

  let quote: any = { regularMarketPrice: 1000, currency: "IDR" };
  try {
    quote = await marketService.getStockQuote(rawTicker, assetType);
  } catch (e) {
    // fallback
  }

  const isUSD = quote.currency === "USD";
  const rateToIDR = isUSD ? await fxService.getUsdIdrRate() : 1;
  const currentPriceIDR = Number(quote.regularMarketPrice) * rateToIDR;

  let grossSellAmountIDR = params.sell_amount_idr || 5000000;
  let sellQty = params.sell_quantity;

  if (sellQty && sellQty > 0) {
    grossSellAmountIDR = sellQty * currentPriceIDR;
  } else {
    sellQty = currentPriceIDR > 0 ? grossSellAmountIDR / currentPriceIDR : 0;
  }

  // Look up holding cost basis if available
  let avgBuyPriceIDR = currentPriceIDR * 0.85; // default 15% profit assumption
  if (params.portfolio_id) {
    const { rows } = await pool.query(
      "SELECT avg_buy_price, currency FROM portfolio_holdings WHERE portfolio_id = $1 AND ticker ILIKE $2 LIMIT 1;",
      [params.portfolio_id, `%${rawTicker.replace("-USD", "")}%`]
    );
    if (rows.length > 0 && Number(rows[0].avg_buy_price) > 0) {
      const holdCurrency = rows[0].currency === "USD" ? 15800 : 1;
      avgBuyPriceIDR = Number(rows[0].avg_buy_price) * holdCurrency;
    }
  }

  const estimatedCostBasisIDR = Math.round((sellQty || 0) * avgBuyPriceIDR);
  const estimatedGrossProfitIDR = Math.round(grossSellAmountIDR - estimatedCostBasisIDR);
  const pnlPercent = estimatedCostBasisIDR > 0 ? Number(((estimatedGrossProfitIDR / estimatedCostBasisIDR) * 100).toFixed(2)) : 0;

  let taxRatePercent = 0.1;
  let taxType = "PPh Final Pasal 22";
  let regulationRef = "PMK 68/PMK.03/2022";
  let exchangeFeeRate = 0.001; // 0.1%
  let sptCode = "039 - Investasi / Aset Kripto";
  let sptGuide = "Dilaporkan pada Bagian Harta Akhir Tahun (Kode 039) dengan nilai perolehan. Pajak PPh Final telah dipotong langsung oleh exchanger terdaftar.";

  if (assetType === "CRYPTO") {
    taxRatePercent = isBappebti ? 0.1 : 0.2;
    taxType = isBappebti ? "PPh Final 0.1% (Exchanger Terdaftar Bappebti/OJK)" : "PPh Final 0.2% (Exchanger Non-Bappebti)";
    regulationRef = "PMK No. 68/PMK.03/2022 Pasal 19";
    exchangeFeeRate = 0.001;
    sptCode = "039 - Aset Kripto / Investasi Digital Lainnya";
    sptGuide = "PPh Final 0.1% dipotong otomatis saat transaksi jual oleh exchanger resmi (Reku, Indodax, Tokocrypto, Pintu, Ajaib Kripto). Cantumkan total saldo per 31 Des di Kolom Harta SPT 1770/1770S.";
  } else if (assetType === "STOCK") {
    taxRatePercent = 0.1;
    taxType = "PPh Final 0.1% Penjualan Saham di Bursa Efek";
    regulationRef = "PP No. 41 Tahun 1994 jo. PP No. 14 Tahun 1997";
    exchangeFeeRate = 0.0015; // 0.15% broker sell fee + levy
    sptCode = "031/032 - Saham yang Diperjualbelikan di BEI";
    sptGuide = "Pajak 0.1% bersifat final dan dipotong langsung oleh sekuritas saat transaksi jual. Penghasilan penjualan dilaporkan pada Lampiran III Bagian A (Penghasilan Dikenakan Pajak Final).";
  } else if (assetType === "GOLD") {
    taxRatePercent = grossSellAmountIDR > 10000000 ? (hasNpwp ? 1.5 : 3.0) : 0;
    taxType = grossSellAmountIDR > 10000000 ? (hasNpwp ? "PPh 22 Buyback 1.5% (Dengan NPWP)" : "PPh 22 Buyback 3.0% (Non-NPWP)") : "Bebas PPh 22 (Nominal <= Rp 10 Juta)";
    regulationRef = "PMK No. 34/PMK.010/2017";
    exchangeFeeRate = 0.0;
    sptCode = "051 - Logam Mulia / Emas Batangan";
    sptGuide = "Penjualan kembali (buyback) di atas Rp 10 juta dipotong PPh 22 oleh Antam/UBS. Bukti potong dapat dikreditkan pada SPT Tahunan.";
  } else if (assetType === "ETF") {
    taxRatePercent = 0; // Capital gain US ETF dihitung di SPT tarif umum progresif
    taxType = "PPh Pasal 17 Tarif Umum (SPT Tahunan) & US Div WHT 15%";
    regulationRef = "UU PPh Pasal 4 ayat (1) & US-Indo Tax Treaty Form W-8BEN";
    exchangeFeeRate = 0.001;
    sptCode = "035 - Investasi Luar Negeri / ETF Global";
    sptGuide = "Dividen ETF US dipotong Withholding Tax 15% di AS (dengan W-8BEN). Capital gain luar negeri dilaporkan pada Penghasilan Luar Negeri di SPT Tahunan.";
  }

  const estimatedTaxWithheldIDR = Math.round((taxRatePercent / 100) * grossSellAmountIDR);
  const estimatedExchangeFeeIDR = Math.round(exchangeFeeRate * grossSellAmountIDR);
  const netCashReceivedIDR = Math.round(grossSellAmountIDR - estimatedTaxWithheldIDR - estimatedExchangeFeeIDR);
  const netRealizedProfitIDR = Math.round(netCashReceivedIDR - estimatedCostBasisIDR);

  return {
    ticker: rawTicker,
    asset_type: assetType,
    gross_sell_amount_idr: Math.round(grossSellAmountIDR),
    sell_quantity: Number(sellQty.toFixed(8)),
    estimated_cost_basis_idr: estimatedCostBasisIDR,
    estimated_gross_profit_idr: estimatedGrossProfitIDR,
    pnl_percentage: pnlPercent,
    tax_rate_percent: taxRatePercent,
    tax_type: taxType,
    regulation_reference: regulationRef,
    estimated_tax_withheld_idr: estimatedTaxWithheldIDR,
    estimated_exchange_fee_idr: estimatedExchangeFeeIDR,
    net_cash_received_idr: netCashReceivedIDR,
    net_realized_profit_idr: netRealizedProfitIDR,
    spt_reporting_code: sptCode,
    spt_reporting_guide: sptGuide,
  };
};

export const getPortfolioTaxSummary = async (portfolioId: number): Promise<any> => {
  const summary = await getPortfolioSummary(portfolioId);

  let totalCrypto = 0;
  let totalIdx = 0;
  let totalEtf = 0;
  let totalGold = 0;
  let totalPotentialTax = 0;

  const holdingsTaxBreakdown = summary.holdings.map((h) => {
    const val = (h as any).market_value_idr || 0;
    const pnl = (h as any).floating_pnl ? (h as any).floating_pnl * (h.currency === "USD" ? 15800 : 1) : 0;
    const type = h.asset_type || "STOCK";

    let potentialTax = 0;
    let rule = "PPh Final 0.1%";

    if (type === "CRYPTO") {
      totalCrypto += val;
      potentialTax = val * 0.001; // 0.1% PPh Final PMK 68
      rule = "PPh Final 0.1% (PMK 68/2022)";
    } else if (type === "STOCK") {
      totalIdx += val;
      potentialTax = val * 0.001; // 0.1% PP 41/1994
      rule = "PPh Final 0.1% (PP 41/1994)";
    } else if (type === "ETF") {
      totalEtf += val;
      rule = "Withholding Tax 15% (Div W-8BEN) + SPT PPh 17";
    } else if (type === "GOLD") {
      totalGold += val;
      potentialTax = val > 10000000 ? val * 0.015 : 0;
      rule = val > 10000000 ? "PPh 22 1.5% (Nominal > 10 Juta)" : "Bebas PPh (<= 10 Juta)";
    }

    totalPotentialTax += potentialTax;

    return {
      ticker: h.ticker,
      asset_type: type,
      current_value_idr: Math.round(val),
      floating_pnl_idr: Math.round(pnl),
      pnl_percent: Number((h.floating_pnl_percent || 0).toFixed(2)),
      potential_exit_tax_idr: Math.round(potentialTax),
      tax_rule: rule,
    };
  });

  return {
    portfolio_id: portfolioId,
    total_unrealized_pnl_idr: Math.round(summary.total_floating_pnl),
    holdings_tax_breakdown: holdingsTaxBreakdown,
    annual_spt_summary: {
      total_crypto_assets_idr: Math.round(totalCrypto),
      total_idx_shares_idr: Math.round(totalIdx),
      total_global_etf_idr: Math.round(totalEtf),
      total_gold_assets_idr: Math.round(totalGold),
      total_estimated_tax_if_realized_idr: Math.round(totalPotentialTax),
    },
  };
};


export const getFxAnalytics = async (
  portfolioId: number
): Promise<PortfolioFxSummary> => {
  const summary = await getPortfolioSummary(portfolioId);
  const currentUsdRate = await fxService.getUsdIdrRate(); // Live USD/IDR benchmark
  const entryBaselineRate = 15650; // Historical purchase baseline

  const foreignHoldings = (summary.holdings || []).filter(
    (h) => h.currency === "USD" || h.asset_type === "CRYPTO" || h.asset_type === "ETF"
  );

  let totalForeignUsd = 0;
  let totalPureGainIdr = 0;
  let totalFxGainIdr = 0;
  let totalNetGainIdr = 0;

  const items: FxHoldingItem[] = foreignHoldings.map((h) => {
    const qty = Number(h.quantity || 1);
    const entryUsd = Number(h.avg_buy_price || 0);
    const currUsd = Number(h.current_price || entryUsd);
    const investedUsd = entryUsd * qty;
    const marketValUsd = currUsd * qty;

    totalForeignUsd += marketValUsd;

    // 1. Pure Asset Gain (USD)
    const pureGainUsd = marketValUsd - investedUsd;
    const pureGainIdr = pureGainUsd * currentUsdRate;
    const pureGainPct = investedUsd > 0 ? (pureGainUsd / investedUsd) * 100 : 0;
    totalPureGainIdr += pureGainIdr;

    // 2. FX Gain (IDR) from USD appreciation
    const fxGainIdr = (currentUsdRate - entryBaselineRate) * investedUsd;
    const fxGainPct = ((currentUsdRate - entryBaselineRate) / entryBaselineRate) * 100;
    totalFxGainIdr += fxGainIdr;

    // 3. Combined Total Net Gain (IDR)
    const netGainIdr = pureGainIdr + fxGainIdr;
    const investedIdr = investedUsd * entryBaselineRate;
    const netGainPct = investedIdr > 0 ? (netGainIdr / investedIdr) * 100 : 0;
    totalNetGainIdr += netGainIdr;

    // FX Cushion ratio: how much did FX cushion or add to return
    const cushionRatio = Math.abs(netGainIdr) > 0 ? Math.min(100, Math.max(0, (fxGainIdr / Math.abs(netGainIdr)) * 100)) : 0;

    return {
      ticker: h.ticker,
      asset_type: h.asset_type,
      quantity: qty,
      entry_price_usd: Number(entryUsd.toFixed(2)),
      current_price_usd: Number(currUsd.toFixed(2)),
      total_invested_usd: Number(investedUsd.toFixed(2)),
      current_market_value_usd: Number(marketValUsd.toFixed(2)),
      pure_asset_gain_usd: Number(pureGainUsd.toFixed(2)),
      pure_asset_gain_idr: Math.round(pureGainIdr),
      pure_asset_gain_percent: Number(pureGainPct.toFixed(2)),
      entry_usd_idr_rate: entryBaselineRate,
      current_usd_idr_rate: currentUsdRate,
      fx_gain_idr: Math.round(fxGainIdr),
      fx_gain_percent: Number(fxGainPct.toFixed(2)),
      total_net_gain_idr: Math.round(netGainIdr),
      total_net_gain_percent: Number(netGainPct.toFixed(2)),
      fx_cushion_ratio_percent: Number(cushionRatio.toFixed(1)),
    };
  });

  const totalForeignIdr = totalForeignUsd * currentUsdRate;
  const totalPortIdr = summary.total_market_value || totalForeignIdr;
  const foreignAllocPct = totalPortIdr > 0 ? (totalForeignIdr / totalPortIdr) * 100 : 0;
  const totalInvestedForeignIdr = items.reduce((acc, i) => acc + i.total_invested_usd * i.entry_usd_idr_rate, 0);
  const blendedReturnPct = totalInvestedForeignIdr > 0 ? (totalNetGainIdr / totalInvestedForeignIdr) * 100 : 0;

  let hedgingSummary = "";
  if (totalFxGainIdr > 0 && totalPureGainIdr < 0) {
    hedgingSummary = `Apresiasi kurs Dollar (+${formatFxNum(totalFxGainIdr)}) bertindak efektif sebagai bantalan lindung nilai (hedging), meredam penurunan harga aset dalam portofolio Anda.`;
  } else if (totalFxGainIdr > 0 && totalPureGainIdr > 0) {
    hedgingSummary = `Portofolio Anda menikmati keuntungan ganda (Double Gain): dari kenaikan harga aset global (+${formatFxNum(totalPureGainIdr)}) dan keuntungan kurs USD (+${formatFxNum(totalFxGainIdr)}).`;
  } else {
    hedgingSummary = `Eksposur aset berbasis USD memberikan diversifikasi mata uang yang sehat terhadap volatilitas inflasi dan suku bunga domestik.`;
  }

  return {
    portfolio_id: portfolioId,
    current_usd_idr_rate: currentUsdRate,
    total_foreign_value_usd: Number(totalForeignUsd.toFixed(2)),
    total_foreign_value_idr: Math.round(totalForeignIdr),
    total_portfolio_value_idr: Math.round(totalPortIdr),
    foreign_allocation_percent: Number(foreignAllocPct.toFixed(1)),
    total_pure_asset_gain_idr: Math.round(totalPureGainIdr),
    total_fx_currency_gain_idr: Math.round(totalFxGainIdr),
    total_net_foreign_gain_idr: Math.round(totalNetGainIdr),
    blended_foreign_return_percent: Number(blendedReturnPct.toFixed(2)),
    items,
    hedging_summary: hedgingSummary,
  };
};

function formatFxNum(val: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val || 0);
}

export interface PortfolioChartPoint {
  date: string;
  timestamp: number;
  value: number;
}

export interface PortfolioChartData {
  timeframe: string;
  portfolio_id?: number;
  current_value: number;
  start_value: number;
  change_nominal: number;
  change_percent: number;
  min_value: number;
  max_value: number;
  updated_at: string;
  points: PortfolioChartPoint[];
}

export const getPortfolioChart = async (
  portfolioId: number,
  timeframe: string = "ALL"
): Promise<PortfolioChartData> => {
  const summary = await getPortfolioSummary(portfolioId);
  const currentTotalVal = summary.total_net_worth || summary.total_market_value || 0;
  const cashBalance = Number(summary.cash_balance) || 0;

  const txResult = await pool.query(
    "SELECT * FROM stock_transactions WHERE portfolio_id = $1 ORDER BY transaction_date ASC;",
    [portfolioId]
  );
  const transactions = txResult.rows;

  const now = new Date();
  let startTime = new Date();
  let stepCount = 30;

  switch (timeframe) {
    case "1W":
      startTime.setDate(now.getDate() - 7);
      stepCount = 14;
      break;
    case "1M":
      startTime.setMonth(now.getMonth() - 1);
      stepCount = 30;
      break;
    case "3M":
      startTime.setMonth(now.getMonth() - 3);
      stepCount = 35;
      break;
    case "YTD":
      startTime = new Date(now.getFullYear(), 0, 1);
      stepCount = 35;
      break;
    case "1Y":
      startTime.setFullYear(now.getFullYear() - 1);
      stepCount = 40;
      break;
    case "ALL":
    default:
      if (transactions.length > 0) {
        startTime = new Date(transactions[0].transaction_date);
      } else {
        startTime.setDate(now.getDate() - 30);
      }
      stepCount = 35;
      break;
  }

  const startMs = startTime.getTime();
  const endMs = now.getTime();
  const stepMs = Math.max(1000, (endMs - startMs) / Math.max(1, stepCount - 1));

  const holdingMap = new Map<string, any>();
  summary.holdings.forEach((h: any) => {
    holdingMap.set(h.ticker, h);
  });

  const points: PortfolioChartPoint[] = [];

  for (let i = 0; i < stepCount; i++) {
    const tMs = i === stepCount - 1 ? endMs : startMs + i * stepMs;
    const tDate = new Date(tMs);

    let val = cashBalance;

    if (transactions.length > 0) {
      transactions.forEach((tx) => {
        const txMs = new Date(tx.transaction_date).getTime();
        if (txMs <= tMs) {
          const initialAmount = Number(tx.total_amount || 0);
          const holding = holdingMap.get(tx.ticker);

          if (!holding || !holding.quantity || holding.quantity <= 0) {
            val += initialAmount;
            return;
          }

          const qty = Number(tx.quantity || tx.shares || 0);
          const qtyRatio = Math.min(1, Math.max(0, qty / Number(holding.quantity)));
          const finalHoldingVal = Number(holding.market_value_idr || holding.market_value || initialAmount);
          const finalTxVal = finalHoldingVal * qtyRatio;

          const duration = Math.max(1000, endMs - txMs);
          const elapsed = Math.max(0, Math.min(duration, tMs - txMs));
          const progress = elapsed / duration;

          const txValAtT = initialAmount + (finalTxVal - initialAmount) * progress;
          val += txValAtT;
        }
      });
    } else {
      const baseStart = Number(summary?.total_invested || 0) > 0 
        ? Number(summary?.total_invested || 0) + cashBalance 
        : currentTotalVal;
      const progress = stepCount > 1 ? i / (stepCount - 1) : 1;
      const wobble = Math.sin(progress * Math.PI) * ((currentTotalVal - baseStart) * 0.08);
      val = baseStart + (currentTotalVal - baseStart) * progress + wobble;
    }

    if (i === stepCount - 1) {
      val = currentTotalVal;
    }

    points.push({
      date: tDate.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      timestamp: tMs,
      value: Math.round(val),
    });
  }

  const values = points.map((p) => p.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  let startValue = points[0]?.value || 0;
  const endValue = points[points.length - 1]?.value || 0;

  let changeNominal = endValue - startValue;
  let changePercent = startValue > 0 ? Number(((changeNominal / startValue) * 100).toFixed(2)) : 0;

  if (timeframe === "ALL") {
    const totalInvested = Number(summary?.total_invested || 0);
    if (totalInvested > 0) {
      startValue = totalInvested;
      changeNominal = endValue - totalInvested;
      changePercent = Number(((changeNominal / totalInvested) * 100).toFixed(2));
    }
  }

  return {
    timeframe,
    portfolio_id: portfolioId,
    current_value: endValue,
    start_value: startValue,
    change_nominal: changeNominal,
    change_percent: changePercent,
    min_value: minValue,
    max_value: maxValue,
    updated_at: now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    points,
  };
};

export const getAggregatedPortfolioChart = async (
  userId: number = 1,
  timeframe: string = "ALL"
): Promise<PortfolioChartData> => {
  const summary = await getAggregatedPortfolioSummary(userId);
  const currentTotalVal = summary.total_net_worth || summary.total_market_value || 0;
  const cashBalance = Number(summary.cash_balance) || 0;
  const totalInvested = Number(summary.total_invested) || 0;

  const txResult = await pool.query(
    `SELECT t.* FROM stock_transactions t
     JOIN portfolios p ON t.portfolio_id = p.id
     WHERE p.user_id = $1
     ORDER BY t.transaction_date ASC;`,
    [userId]
  );
  const transactions = txResult.rows;

  const now = new Date();
  let startTime = new Date();
  let stepCount = 30;

  switch (timeframe) {
    case "1W":
      startTime.setDate(now.getDate() - 7);
      stepCount = 14;
      break;
    case "1M":
      startTime.setMonth(now.getMonth() - 1);
      stepCount = 30;
      break;
    case "3M":
      startTime.setMonth(now.getMonth() - 3);
      stepCount = 35;
      break;
    case "YTD":
      startTime = new Date(now.getFullYear(), 0, 1);
      stepCount = 35;
      break;
    case "1Y":
      startTime.setFullYear(now.getFullYear() - 1);
      stepCount = 40;
      break;
    case "ALL":
    default:
      if (transactions.length > 0) {
        startTime = new Date(transactions[0].transaction_date);
      } else {
        startTime.setDate(now.getDate() - 30);
      }
      stepCount = 35;
      break;
  }

  const startMs = startTime.getTime();
  const endMs = now.getTime();
  const stepMs = Math.max(1000, (endMs - startMs) / Math.max(1, stepCount - 1));

  const holdingMap = new Map<string, any>();
  summary.holdings.forEach((h: any) => {
    holdingMap.set(h.ticker, h);
  });

  const points: PortfolioChartPoint[] = [];

  for (let i = 0; i < stepCount; i++) {
    const tMs = i === stepCount - 1 ? endMs : startMs + i * stepMs;
    const tDate = new Date(tMs);

    let val = cashBalance;

    if (transactions.length > 0) {
      transactions.forEach((tx) => {
        const txMs = new Date(tx.transaction_date).getTime();
        if (txMs <= tMs) {
          const initialAmount = Number(tx.total_amount || 0);
          const holding = holdingMap.get(tx.ticker);

          if (!holding || !holding.quantity || holding.quantity <= 0) {
            val += initialAmount;
            return;
          }

          const qty = Number(tx.quantity || tx.shares || 0);
          const qtyRatio = Math.min(1, Math.max(0, qty / Number(holding.quantity)));
          const finalHoldingVal = Number(holding.market_value_idr || holding.market_value || initialAmount);
          const finalTxVal = finalHoldingVal * qtyRatio;

          const duration = Math.max(1000, endMs - txMs);
          const elapsed = Math.max(0, Math.min(duration, tMs - txMs));
          const progress = elapsed / duration;

          const txValAtT = initialAmount + (finalTxVal - initialAmount) * progress;
          val += txValAtT;
        }
      });
    } else {
      const baseStart = totalInvested > 0 ? (totalInvested + cashBalance) : currentTotalVal;
      const progress = stepCount > 1 ? i / (stepCount - 1) : 1;
      const wobble = Math.sin(progress * Math.PI) * ((currentTotalVal - baseStart) * 0.08);
      val = baseStart + (currentTotalVal - baseStart) * progress + wobble;
    }

    if (i === stepCount - 1) {
      val = currentTotalVal;
    }

    points.push({
      date: tDate.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      timestamp: tMs,
      value: Math.round(val),
    });
  }

  const values = points.map((p) => p.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  let startValue = points[0]?.value || 0;
  const endValue = points[points.length - 1]?.value || 0;

  let changeNominal = endValue - startValue;
  let changePercent = startValue > 0 ? Number(((changeNominal / startValue) * 100).toFixed(2)) : 0;

  if (timeframe === "ALL" && totalInvested > 0) {
    startValue = totalInvested;
    changeNominal = endValue - totalInvested;
    changePercent = Number(((changeNominal / totalInvested) * 100).toFixed(2));
  }

  return {
    timeframe,
    portfolio_id: 0,
    current_value: Math.round(currentTotalVal),
    start_value: Math.round(startValue),
    change_nominal: Math.round(changeNominal),
    change_percent: changePercent,
    min_value: Math.round(minValue),
    max_value: Math.round(maxValue),
    updated_at: now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    points,
  };
};

export interface CalibrateHoldingInput {
  holding_id?: number;
  portfolio_id?: number;
  target_portfolio_id?: number;
  ticker?: string;
  asset_type?: string;
  quantity?: number;
  total_invested_idr?: number;
  avg_buy_price?: number;
  delete_holding?: boolean;
  current_value_idr?: number;
  pnl_percent?: number;
}

export const getUserWallets = async (userId: number = 1) => {
  const pResult = await pool.query(
    "SELECT * FROM portfolios WHERE user_id = $1 ORDER BY id ASC;",
    [userId]
  );

  const wallets = await Promise.all(
    pResult.rows.map(async (row) => {
      try {
        const summary = await getPortfolioSummary(row.id);
        return {
          id: row.id,
          user_id: row.user_id,
          name: row.name,
          cash_balance: summary.cash_balance,
          total_invested: summary.total_invested,
          total_market_value: summary.total_market_value,
          total_net_worth: summary.total_net_worth,
          floating_pnl: summary.total_floating_pnl,
          floating_pnl_percent: summary.total_floating_pnl_percent,
          holdings_count: summary.holdings_count,
          created_at: row.created_at,
          updated_at: row.updated_at,
        };
      } catch {
        return {
          id: row.id,
          user_id: row.user_id,
          name: row.name,
          cash_balance: Number(row.cash_balance || 0),
          total_invested: 0,
          total_market_value: 0,
          total_net_worth: Number(row.cash_balance || 0),
          floating_pnl: 0,
          floating_pnl_percent: 0,
          holdings_count: 0,
          created_at: row.created_at,
          updated_at: row.updated_at,
        };
      }
    })
  );
  return wallets;
};

export const createWallet = async (userId: number = 1, name: string, cashBalance: number = 0) => {
  if (!name || name.trim().length === 0) {
    throw new Error("Nama dompet tidak boleh kosong.");
  }
  const result = await pool.query(
    "INSERT INTO portfolios (user_id, name, cash_balance) VALUES ($1, $2, $3) RETURNING *;",
    [userId, name.trim(), cashBalance || 0]
  );
  return result.rows[0];
};

export const deleteWallet = async (walletId: number, userId: number = 1) => {
  const countRes = await pool.query("SELECT COUNT(*) FROM portfolios WHERE user_id = $1;", [userId]);
  if (Number(countRes.rows[0].count) <= 1) {
    throw new Error("Tidak dapat menghapus dompet terakhir. Minimal harus memiliki satu dompet aktif.");
  }
  await pool.query("DELETE FROM portfolios WHERE id = $1 AND user_id = $2;", [walletId, userId]);
  return { success: true, deleted_id: walletId };
};

export const getAggregatedPortfolioSummary = async (
  userId: number = 1
): Promise<PortfolioSummary> => {
  const wallets = await getUserWallets(userId);
  if (wallets.length === 0) {
    const def = await getPrimaryPortfolioByUserId(userId);
    return getPortfolioSummary(def.id);
  }

  let grandTotalInvested = 0;
  let grandTotalMarketValue = 0;
  let grandTotalCash = 0;
  const allHoldings: PortfolioHolding[] = [];

  for (const w of wallets) {
    grandTotalCash += w.cash_balance;
    const summary = await getPortfolioSummary(w.id);
    for (const h of summary.holdings) {
      allHoldings.push({
        ...h,
        portfolio_id: w.id,
        portfolio_name: w.name,
      });
    }
    grandTotalInvested += summary.total_invested;
    grandTotalMarketValue += summary.total_market_value;
  }

  // Consolidate identical holdings across multiple wallets into single unified rows
  const consolidatedMap: Record<string, any> = {};

  for (const h of allHoldings) {
    const key = `${h.ticker}-${h.asset_type || "STOCK"}`;
    const itemBreakdown: WalletHoldingBreakdown = {
      holding_id: h.id,
      wallet_id: h.portfolio_id,
      wallet_name: h.portfolio_name || "Portofolio Utama",
      quantity: Number(h.quantity || h.total_shares || 0),
      total_shares: Number(h.total_shares || 0),
      total_lots: Number(h.total_lots || 0),
      total_invested: Number(h.total_invested || 0),
      total_invested_idr: Number(h.total_invested_idr || h.total_invested || 0),
      market_value: Number(h.market_value || 0),
      market_value_idr: Number(h.market_value_idr || 0),
      floating_pnl: Number(h.floating_pnl || 0),
      floating_pnl_percent: Number(h.floating_pnl_percent || 0),
      avg_buy_price: Number(h.avg_buy_price || 0),
    };

    if (!consolidatedMap[key]) {
      consolidatedMap[key] = {
        ...h,
        quantity: Number(h.quantity || h.total_shares || 0),
        total_shares: Number(h.total_shares || 0),
        total_lots: Number(h.total_lots || 0),
        total_invested: Number(h.total_invested || 0),
        total_invested_idr: Number(h.total_invested_idr || h.total_invested || 0),
        market_value: Number(h.market_value || 0),
        market_value_idr: Number(h.market_value_idr || 0),
        floating_pnl: Number(h.floating_pnl || 0),
        wallet_names: [h.portfolio_name || "Portofolio Utama"],
        wallet_breakdown: [itemBreakdown],
      };
    } else {
      const existing = consolidatedMap[key];
      existing.quantity += Number(h.quantity || h.total_shares || 0);
      existing.total_shares += Number(h.total_shares || 0);
      existing.total_lots += Number(h.total_lots || 0);
      existing.total_invested += Number(h.total_invested || 0);
      existing.total_invested_idr += Number(h.total_invested_idr || h.total_invested || 0);
      existing.market_value += Number(h.market_value || 0);
      existing.market_value_idr += Number(h.market_value_idr || 0);
      existing.floating_pnl += Number(h.floating_pnl || 0);
      if (h.portfolio_name && !existing.wallet_names.includes(h.portfolio_name)) {
        existing.wallet_names.push(h.portfolio_name);
      }
      existing.wallet_breakdown.push(itemBreakdown);
    }
  }

  const consolidatedList = Object.values(consolidatedMap).map((c) => {
    const inv = c.total_invested_idr || c.total_invested || 0;
    const mv = c.market_value_idr || c.market_value || 0;
    const diff = mv - inv;
    const pnlPct = inv > 0 ? Number(((diff / inv) * 100).toFixed(2)) : 0;
    const avgPrice = c.quantity > 0 ? inv / c.quantity : c.avg_buy_price;
    return {
      ...c,
      avg_buy_price: avgPrice,
      floating_pnl: diff,
      floating_pnl_percent: pnlPct,
      portfolio_name: c.wallet_names.join(", "),
      wallet_breakdown: c.wallet_breakdown,
    };
  });

  const grandTotalNetWorth = grandTotalMarketValue + grandTotalCash;
  const grandTotalFloatingPnl = grandTotalMarketValue - grandTotalInvested;
  const grandTotalFloatingPnlPercent = grandTotalInvested > 0
    ? (grandTotalFloatingPnl / grandTotalInvested) * 100
    : 0;

  const holdingsWithWeights = consolidatedList.map((h) => {
    const val = Number(h.market_value_idr || 0);
    const weight = grandTotalMarketValue > 0 ? (val / grandTotalMarketValue) * 100 : 0;
    return {
      ...h,
      weight_percent: Number(weight.toFixed(2)),
    };
  });

  return {
    portfolio_id: 0,
    portfolio_name: "Semua Dompet (Total Konsolidasi)",
    cash_balance: grandTotalCash,
    total_invested: grandTotalInvested,
    total_market_value: grandTotalMarketValue,
    total_value: grandTotalMarketValue,
    total_net_worth: grandTotalNetWorth,
    total_floating_pnl: grandTotalFloatingPnl,
    total_floating_pnl_percent: Number(grandTotalFloatingPnlPercent.toFixed(2)),
    holdings_count: holdingsWithWeights.length,
    holdings: holdingsWithWeights,
    is_aggregated: true,
    wallets,
  };
};

export const calibrateHolding = async (input: CalibrateHoldingInput) => {
  const portfolioId = input.target_portfolio_id || input.portfolio_id || 1;
  let check: any = null;

  if (input.holding_id) {
    check = await pool.query(
      "SELECT * FROM portfolio_holdings WHERE id = $1;",
      [input.holding_id]
    );
  } else if (input.ticker) {
    const rawTicker = input.ticker.trim().toUpperCase();
    check = await pool.query(
      `SELECT * FROM portfolio_holdings 
       WHERE portfolio_id = $1 AND (ticker = $2 OR ticker ILIKE $3 || '%' OR ticker ILIKE '%' || $3)
       LIMIT 1;`,
      [portfolioId, rawTicker, rawTicker]
    );
  }

  const current = check?.rows?.[0];

  if (current && (input.delete_holding || (input.quantity !== undefined && Number(input.quantity) <= 0))) {
    await pool.query("DELETE FROM portfolio_holdings WHERE id = $1", [current.id]);
    return { deleted: true, id: current.id, ticker: current.ticker };
  }

  let rawTicker = (input.ticker || current?.ticker || "").trim().toUpperCase();
  if (!rawTicker && !current) {
    throw new Error("Simbol / Ticker aset wajib disertakan.");
  }

  // Auto-clean any accidental -USD suffix for ETFs or US Stocks
  if (rawTicker.endsWith("-USD")) {
    const base = rawTicker.replace(/-USD$/, "");
    if (["VT", "VOO", "VTI", "SPY", "QQQ", "IVV", "SCHD"].includes(base)) {
      rawTicker = base;
    }
  }

  const isKnownEtf = ["VT", "VOO", "VTI", "SPY", "QQQ", "IVV", "SCHD"].includes(rawTicker);
  const assetType = isKnownEtf ? "ETF" : ((input.asset_type && input.asset_type !== "CRYPTO" ? input.asset_type : detectAssetType(rawTicker)) as any);
  const formattedTicker = isKnownEtf ? rawTicker : formatTicker(rawTicker, assetType);

  let qty = input.quantity !== undefined && Number(input.quantity) > 0 ? Number(input.quantity) : Number(current?.quantity || current?.total_shares || 0);
  let totalInvested = input.total_invested_idr !== undefined ? Number(input.total_invested_idr) : Number(current?.total_invested || 0);

  // Smart PnL% Auto-Calculation (Uang Saat Ini + PnL %)
  if (input.current_value_idr !== undefined && input.pnl_percent !== undefined) {
    const pnlPct = Number(input.pnl_percent);
    const curVal = Number(input.current_value_idr);
    const calculatedInvested = pnlPct !== -100 ? curVal / (1 + pnlPct / 100) : curVal;
    totalInvested = Math.round(calculatedInvested);

    if (!input.quantity || Number(input.quantity) <= 0 || (current && Number(current.avg_buy_price) <= 1)) {
      try {
        const quote = await marketService.getStockQuote(formattedTicker, assetType);
        const fxRate = await fxService.getUsdIdrRate();
        const rawPrice = Number(quote.regularMarketPrice) || Number(current?.avg_buy_price || 0);
        const isUSD = formattedTicker.includes("-USD") || assetType === "CRYPTO" || assetType === "ETF";
        const priceIdr = isUSD ? rawPrice * fxRate : rawPrice;
        if (priceIdr > 0) {
          qty = Number((curVal / priceIdr).toFixed(8));
        }
      } catch {
        // fallback
      }
    }
  }

  if (qty <= 0) {
    qty = 1;
  }

  const avgPrice = input.avg_buy_price !== undefined ? Number(input.avg_buy_price) : (qty > 0 ? Math.round(totalInvested / qty) : Number(current?.avg_buy_price || 0));

  const totalShares = assetType === "STOCK" ? qty : 0;
  const totalLots = assetType === "STOCK" ? Number((qty / 100).toFixed(2)) : 0;
  const targetPid = input.target_portfolio_id ? Number(input.target_portfolio_id) : (current ? current.portfolio_id : portfolioId);

  if (current) {
    const result = await pool.query(
      `UPDATE portfolio_holdings
       SET portfolio_id = $1, ticker = $2, asset_type = $3, quantity = $4, total_shares = $5, total_lots = $6, total_invested = $7, avg_buy_price = $8, currency = 'IDR', updated_at = NOW()
       WHERE id = $9
       RETURNING *;`,
      [targetPid, formattedTicker, assetType, qty, totalShares, totalLots, totalInvested, avgPrice, current.id]
    );
    return result.rows[0];
  } else {
    const result = await pool.query(
      `INSERT INTO portfolio_holdings
       (portfolio_id, ticker, asset_type, quantity, total_shares, total_lots, avg_buy_price, total_invested, currency, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'IDR', NOW())
       RETURNING *;`,
      [targetPid, formattedTicker, assetType, qty, totalShares, totalLots, avgPrice, totalInvested]
    );
    return result.rows[0];
  }
};
