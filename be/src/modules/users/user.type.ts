export interface User {
  id: number;
  telegram_id: number;
  first_name?: string;
  username?: string;
  full_name?: string;
  age?: number;
  occupation?: string;
  monthly_income?: number;
  monthly_expenses?: number;
  emergency_fund_months?: number;
  risk_profile: "conservative" | "moderate" | "aggressive";
  investment_goals?: string;
  time_horizon_years?: number;
  strategy_preference?: string;
  currency: string;
  timezone: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  telegram_id: number;
  first_name?: string;
  username?: string;
  full_name?: string;
  age?: number;
  occupation?: string;
  monthly_income?: number;
  monthly_expenses?: number;
  emergency_fund_months?: number;
  risk_profile?: "conservative" | "moderate" | "aggressive";
  investment_goals?: string;
  time_horizon_years?: number;
  strategy_preference?: string;
  currency?: string;
  timezone?: string;
}

