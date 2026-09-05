import * as portfolioService from "./portfolio.service";
import { formatRupiah } from "../../utils/stockHelper";

export interface RebalanceAction {
  action: "REDUCE" | "INCREASE" | "HOLD";
  asset_type: string;
  ticker?: string;
  current_weight_percent: number;
  target_weight_percent: number;
  recommended_amount_idr: number;
  reason: string;
}

export interface PortfolioHealthReport {
  portfolio_id: number;
  portfolio_name: string;
  health_score: number; // 0 - 100
  rating: "Sangat Sehat (Optimal)" | "Sehat (Good)" | "Moderat" | "Tinggi Risiko";
  risk_profile: "Konservatif" | "Moderat" | "Agresif" | "Sangat Agresif";
  summary: string;
  metrics: {
    total_net_worth: number;
    total_invested: number;
    total_floating_pnl: number;
    total_floating_pnl_percent: number;
    asset_classes_count: number;
    top_holding_concentration: {
      ticker: string;
      weight_percent: number;
    } | null;
    safe_haven_percentage: number; // Gold, Bond, Cash
    high_growth_percentage: number; // Stocks, Crypto, ETF
  };
  rebalancing_actions: RebalanceAction[];
  strengths: string[];
  warnings: string[];
}

export const getPortfolioHealthScore = async (
  portfolioId: number
): Promise<PortfolioHealthReport> => {
  const summary = await portfolioService.getPortfolioSummary(portfolioId);
  const holdings = summary.holdings || [];
  const allocations = summary.asset_allocations || [];
  const totalNetWorth = summary.total_net_worth || 1;

  // 1. Calculate Asset Class Diversity (Base Score 40-100)
  const classCount = allocations.length;
  let diversityScore = 40;
  if (classCount === 2) diversityScore = 65;
  else if (classCount === 3) diversityScore = 80;
  else if (classCount >= 4) diversityScore = 95;

  // 2. Concentration Penalty (Penalize if 1 asset > 40%)
  let topConcentration: { ticker: string; weight_percent: number } | null = null;
  let concentrationPenalty = 0;

  if (holdings.length > 0) {
    const sorted = [...holdings].sort((a, b) => (b.weight_percent || 0) - (a.weight_percent || 0));
    const top = sorted[0];
    topConcentration = {
      ticker: top.ticker,
      weight_percent: top.weight_percent || 0,
    };

    if (top.weight_percent && top.weight_percent > 40) {
      concentrationPenalty = Math.min(35, (top.weight_percent - 40) * 0.75);
    }
  }

  // 3. Safe Haven & High Growth Allocation Ratio
  let safeHavenValue = Number(summary.cash_balance || 0);
  let highGrowthValue = 0;

  for (const a of allocations) {
    if (a.asset_type === "GOLD" || a.asset_type === "BOND" || a.asset_type === "CASH") {
      safeHavenValue += a.total_value;
    } else {
      highGrowthValue += a.total_value;
    }
  }

  const safeHavenPercent = Number(((safeHavenValue / totalNetWorth) * 100).toFixed(1));
  const highGrowthPercent = Number(((highGrowthValue / totalNetWorth) * 100).toFixed(1));

  // Balanced buffer bonus
  let bufferBonus = 0;
  if (safeHavenPercent >= 10 && safeHavenPercent <= 35) {
    bufferBonus = 10;
  } else if (safeHavenPercent > 35 && safeHavenPercent <= 60) {
    bufferBonus = 5;
  }

  // Final Health Score calculation
  let finalScore = Math.round(diversityScore - concentrationPenalty + bufferBonus);
  finalScore = Math.max(15, Math.min(98, finalScore));

  // Determine Rating & Risk Profile
  let rating: PortfolioHealthReport["rating"] = "Moderat";
  if (finalScore >= 85) rating = "Sangat Sehat (Optimal)";
  else if (finalScore >= 70) rating = "Sehat (Good)";
  else if (finalScore < 50) rating = "Tinggi Risiko";

  let riskProfile: PortfolioHealthReport["risk_profile"] = "Moderat";
  if (highGrowthPercent > 75) riskProfile = "Sangat Agresif";
  else if (highGrowthPercent > 50) riskProfile = "Agresif";
  else if (safeHavenPercent > 60) riskProfile = "Konservatif";

  // Strengths & Warnings
  const strengths: string[] = [];
  const warnings: string[] = [];

  if (classCount >= 3) {
    strengths.push(`Diversifikasi kelas aset solid (${classCount} jenis aset aktif).`);
  }
  if (safeHavenPercent >= 10) {
    strengths.push(`Memiliki bantalan safe haven (${safeHavenPercent}%) untuk ketahanan krisis.`);
  }
  if (summary.total_floating_pnl >= 0) {
    strengths.push(`Portofolio dalam zona akumulasi profit (+${summary.total_floating_pnl_percent}%).`);
  }

  if (topConcentration && topConcentration.weight_percent > 50) {
    warnings.push(
      `Konsentrasi risiko tinggi: Aset ${topConcentration.ticker} mendominasi ${topConcentration.weight_percent}% portofolio.`
    );
  }
  if (classCount <= 1) {
    warnings.push("Portofolio hanya bertumpu pada 1 kelas aset. Disarankan diversifikasi multi-aset.");
  }
  if (safeHavenPercent < 5) {
    warnings.push("Bantalan dana darurat / safe haven (Emas/SBN/Kas) sangat rendah (< 5%).");
  }

  // Generate Actionable Rebalancing Actions
  const rebalancingActions: RebalanceAction[] = [];

  for (const a of allocations) {
    if (a.percentage > 45 && (a.asset_type === "CRYPTO" || a.asset_type === "STOCK")) {
      const targetPercent = 35;
      const excessPercent = a.percentage - targetPercent;
      const shiftAmount = (excessPercent / 100) * totalNetWorth;

      rebalancingActions.push({
        action: "REDUCE",
        asset_type: a.asset_type,
        current_weight_percent: a.percentage,
        target_weight_percent: targetPercent,
        recommended_amount_idr: Math.round(shiftAmount),
        reason: `Kurangi porsi ${a.label} (${a.percentage}%) ke target ${targetPercent}% untuk mengamankan profit & menekan volatilitas.`,
      });
    }
  }

  if (safeHavenPercent < 15) {
    const targetSafe = 15;
    const needed = ((targetSafe - safeHavenPercent) / 100) * totalNetWorth;
    rebalancingActions.push({
      action: "INCREASE",
      asset_type: "GOLD",
      current_weight_percent: safeHavenPercent,
      target_weight_percent: targetSafe,
      recommended_amount_idr: Math.round(needed),
      reason: `Tambah alokasi Emas / SBN sebesar ${formatRupiah(needed)} untuk mencapai batas aman 15% Safe Haven.`,
    });
  }

  const summaryText = `Portofolio Anda memiliki skor kesehatan ${finalScore}/100 (${rating}) dengan profil risiko ${riskProfile}. ${
    warnings.length > 0 ? warnings[0] : "Struktur portofolio terjaga dengan baik."
  }`;

  return {
    portfolio_id: portfolioId,
    portfolio_name: summary.portfolio_name,
    health_score: finalScore,
    rating,
    risk_profile: riskProfile,
    summary: summaryText,
    metrics: {
      total_net_worth: summary.total_net_worth,
      total_invested: summary.total_invested,
      total_floating_pnl: summary.total_floating_pnl,
      total_floating_pnl_percent: summary.total_floating_pnl_percent,
      asset_classes_count: classCount,
      top_holding_concentration: topConcentration,
      safe_haven_percentage: safeHavenPercent,
      high_growth_percentage: highGrowthPercent,
    },
    rebalancing_actions: rebalancingActions,
    strengths,
    warnings,
  };
};
