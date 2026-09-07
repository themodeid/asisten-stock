export interface FinancialGoalInput {
  goal_name?: string;
  target_amount: number;
  time_horizon_years: number;
  initial_capital?: number;
  expected_annual_return_percent?: number;
  inflation_rate_percent?: number;
}

export interface YearProjection {
  year: number;
  start_balance: number;
  annual_contribution: number;
  annual_returns: number;
  end_balance: number;
  future_value_real: number; // inflation adjusted
}

export interface FinancialGoalPlan {
  goal_name: string;
  target_amount: number;
  time_horizon_years: number;
  initial_capital: number;
  expected_annual_return_percent: number;
  inflation_rate_percent: number;
  required_monthly_investment: number;
  total_invested_capital: number;
  projected_total_returns: number;
  projected_final_nominal: number;
  projected_final_real: number;
  is_realistic: boolean;
  feasibility_score: "Sangat Realistis" | "Moderat" | "Agresif / Sulit";
  recommendations: string[];
  suggested_asset_allocation: {
    stocks_etf: number;
    crypto: number;
    gold: number;
    bonds_cash: number;
  };
  projections: YearProjection[];
}

/**
 * Calculates a detailed financial goal path using compound growth formulas.
 */
export const calculateGoalPlan = (input: FinancialGoalInput): FinancialGoalPlan => {
  const goalName = input.goal_name || "Target Finansial & Pensiun";
  const FV = Math.max(1000000, Number(input.target_amount) || 1000000000);
  const years = Math.max(1, Math.min(50, Number(input.time_horizon_years) || 10));
  const PV = Math.max(0, Number(input.initial_capital) || 0);
  const rAnnual = (Number(input.expected_annual_return_percent) || 11) / 100;
  const inflationAnnual = (Number(input.inflation_rate_percent) || 4.5) / 100;

  const months = years * 12;
  const rMonthly = Math.pow(1 + rAnnual, 1 / 12) - 1;

  // FV of current initial capital PV
  const futureValueOfPV = PV * Math.pow(1 + rMonthly, months);

  // Remaining needed from monthly annuities: PMT * [((1 + r)^n - 1) / r] = FV - FV(PV)
  const remainingNeeded = Math.max(0, FV - futureValueOfPV);

  let monthlyPMT = 0;
  if (remainingNeeded > 0) {
    const annuityFactor = (Math.pow(1 + rMonthly, months) - 1) / rMonthly;
    monthlyPMT = Math.ceil(remainingNeeded / annuityFactor);
  }

  // Generate Year-by-Year projection
  const projections: YearProjection[] = [];
  let currentBalance = PV;

  for (let y = 1; y <= years; y++) {
    const startBal = currentBalance;
    const annualContr = monthlyPMT * 12;
    // Monthly compound simulation for precision
    let annualReturns = 0;
    for (let m = 1; m <= 12; m++) {
      currentBalance += monthlyPMT;
      const monthReturn = currentBalance * rMonthly;
      annualReturns += monthReturn;
      currentBalance += monthReturn;
    }

    const inflationDiscount = Math.pow(1 + inflationAnnual, y);
    const futureValReal = currentBalance / inflationDiscount;

    projections.push({
      year: y,
      start_balance: Math.round(startBal),
      annual_contribution: Math.round(annualContr),
      annual_returns: Math.round(annualReturns),
      end_balance: Math.round(currentBalance),
      future_value_real: Math.round(futureValReal),
    });
  }

  const totalInvested = PV + (monthlyPMT * months);
  const projectedReturns = Math.max(0, currentBalance - totalInvested);

  // Feasibility & asset allocation advice based on years horizon
  let feasibility: "Sangat Realistis" | "Moderat" | "Agresif / Sulit" = "Moderat";
  let recommendations: string[] = [];
  let allocation = { stocks_etf: 50, crypto: 10, gold: 20, bonds_cash: 20 };

  if (years >= 10) {
    feasibility = "Sangat Realistis";
    allocation = { stocks_etf: 65, crypto: 15, gold: 10, bonds_cash: 10 };
    recommendations.push("Horizon panjang (≥ 10 tahun) memungkinkan alokasi growth saham/ETF global (e.g. VT, BBCA) lebih dominan.");
    recommendations.push("Lakukan rebalancing otomatis minimal setahun sekali untuk mengunci profit saat bull run.");
  } else if (years >= 5) {
    feasibility = "Moderat";
    allocation = { stocks_etf: 50, crypto: 10, gold: 25, bonds_cash: 15 };
    recommendations.push("Gunakan strategi Barbell: mayoritas di Bluechip dividen & Gold, porsi kecil di high-growth asset.");
  } else {
    feasibility = "Agresif / Sulit";
    allocation = { stocks_etf: 30, crypto: 5, gold: 35, bonds_cash: 30 };
    recommendations.push("Horizon pendek (< 5 tahun) memiliki risiko volatilitas pasar saham tinggi; perbanyak instrumen defensif (Emas & Pasar Uang/Obligasi).");
  }

  return {
    goal_name: goalName,
    target_amount: FV,
    time_horizon_years: years,
    initial_capital: PV,
    expected_annual_return_percent: rAnnual * 100,
    inflation_rate_percent: inflationAnnual * 100,
    required_monthly_investment: monthlyPMT,
    total_invested_capital: Math.round(totalInvested),
    projected_total_returns: Math.round(projectedReturns),
    projected_final_nominal: Math.round(currentBalance),
    projected_final_real: Math.round(currentBalance / Math.pow(1 + inflationAnnual, years)),
    is_realistic: monthlyPMT < FV * 0.1,
    feasibility_score: feasibility,
    recommendations,
    suggested_asset_allocation: allocation,
    projections,
  };
};
