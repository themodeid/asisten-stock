
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
  ADD COLUMN IF NOT EXISTS password_salt VARCHAR(255),
  ADD COLUMN IF NOT EXISTS full_name VARCHAR(150) DEFAULT 'Adam Wahyu Kurniawan',
  ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT 25,
  ADD COLUMN IF NOT EXISTS occupation VARCHAR(100) DEFAULT 'Investor & Professional',
  ADD COLUMN IF NOT EXISTS monthly_income NUMERIC(18, 2) DEFAULT 10000000,
  ADD COLUMN IF NOT EXISTS monthly_expenses NUMERIC(18, 2) DEFAULT 5000000,
  ADD COLUMN IF NOT EXISTS emergency_fund_months INTEGER DEFAULT 6,
  ADD COLUMN IF NOT EXISTS investment_goals VARCHAR(255) DEFAULT 'Financial Independence / Dana Pensiun & Dividen Pasif',
  ADD COLUMN IF NOT EXISTS time_horizon_years INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS strategy_preference TEXT DEFAULT 'Pertumbuhan seimbang: DCA berkala di ETF Global VT, Saham Bluechip Dividen, Kripto terukur, dan Emas sebagai pelindung nilai.';

UPDATE users
SET 
  username = 'adamwahyukur',
  first_name = 'Adam Wahyu',
  full_name = 'Adam Wahyu Kurniawan',
  password_salt = '4e8ca9ed7492486becf84050191945d3',
  password_hash = 'e1df6aefc5919ada692c3572476fa8f92ff8d920a3f3bca2676315978b1fc7f4a049e7b6f74ff5954653575a6def8a705bae007b7bd06c3f3cf4f3f6fad6f6c6',
  risk_profile = 'moderate',
  age = 25,
  monthly_income = 10000000,
  monthly_expenses = 5000000,
  emergency_fund_months = 6,
  time_horizon_years = 10,
  investment_goals = 'Financial Independence / Dana Pensiun & Dividen Pasif',
  strategy_preference = 'Pertumbuhan seimbang: DCA berkala di ETF Global VT, Saham Bluechip Dividen, Kripto terukur, dan Emas sebagai pelindung nilai.'
WHERE id = 1;
