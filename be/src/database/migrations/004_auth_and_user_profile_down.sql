
ALTER TABLE users
  DROP COLUMN IF EXISTS password_hash,
  DROP COLUMN IF EXISTS password_salt,
  DROP COLUMN IF EXISTS full_name,
  DROP COLUMN IF EXISTS age,
  DROP COLUMN IF EXISTS occupation,
  DROP COLUMN IF EXISTS monthly_income,
  DROP COLUMN IF EXISTS monthly_expenses,
  DROP COLUMN IF EXISTS emergency_fund_months,
  DROP COLUMN IF EXISTS investment_goals,
  DROP COLUMN IF EXISTS time_horizon_years,
  DROP COLUMN IF EXISTS strategy_preference;
