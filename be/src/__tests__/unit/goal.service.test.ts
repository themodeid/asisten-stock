import { calculateGoalPlan } from "../../modules/portfolio/goal.service";

describe("Goal Service — Compound Wealth Planning", () => {
  it("should calculate required monthly investment for 1 Billion target in 10 years", () => {
    const plan = calculateGoalPlan({
      goal_name: "Dana Pensiun 1 Milyar",
      target_amount: 1000000000,
      time_horizon_years: 10,
      initial_capital: 50000000,
      expected_annual_return_percent: 12,
    });

    expect(plan.target_amount).toBe(1000000000);
    expect(plan.time_horizon_years).toBe(10);
    expect(plan.required_monthly_investment).toBeGreaterThan(0);
    expect(plan.required_monthly_investment).toBeLessThan(10000000); // definitely less than 10M/month with 12% returns
    expect(plan.projected_final_nominal).toBeGreaterThanOrEqual(1000000000);
    expect(plan.projections.length).toBe(10);
    expect(plan.suggested_asset_allocation).toHaveProperty("stocks_etf");
  });

  it("should handle short horizon with conservative advice", () => {
    const plan = calculateGoalPlan({
      target_amount: 200000000,
      time_horizon_years: 3,
      initial_capital: 0,
      expected_annual_return_percent: 7,
    });

    expect(plan.feasibility_score).toBe("Agresif / Sulit");
    expect(plan.suggested_asset_allocation.gold).toBeGreaterThanOrEqual(30);
  });
});
