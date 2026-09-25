-- =============================================================================
-- MIGRATION 005: CASHFLOW & MULTI-ACCOUNT MANAGEMENT
-- =============================================================================

CREATE TABLE IF NOT EXISTS cashflow_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_id INTEGER REFERENCES portfolios(id) ON DELETE SET NULL,
  to_wallet_id INTEGER REFERENCES portfolios(id) ON DELETE SET NULL,
  type VARCHAR(20) NOT NULL, -- 'INCOME', 'EXPENSE', 'TRANSFER'
  category VARCHAR(50) NOT NULL, -- 'MAKANAN', 'TRANSPORT', 'GAJI', 'INVESTASI', 'BELANJA', 'TAGIHAN', 'HIBURAN', 'KESEHATAN', 'LAINNYA'
  amount NUMERIC(18, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'IDR',
  description TEXT,
  transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  source VARCHAR(20) DEFAULT 'MANUAL', -- 'MANUAL', 'AI_CHAT', 'AI_RECEIPT'
  receipt_image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cashflow_user_date ON cashflow_transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_cashflow_wallet ON cashflow_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_cashflow_type ON cashflow_transactions(type);

-- Seed default everyday wallets if not yet present
INSERT INTO portfolios (user_id, name, cash_balance)
SELECT 1, 'Bank BCA', 197828
WHERE NOT EXISTS (SELECT 1 FROM portfolios WHERE user_id = 1 AND name = 'Bank BCA');

INSERT INTO portfolios (user_id, name, cash_balance)
SELECT 1, 'Cash Dompet', 425000
WHERE NOT EXISTS (SELECT 1 FROM portfolios WHERE user_id = 1 AND name = 'Cash Dompet');

UPDATE portfolios SET cash_balance = 425000 WHERE user_id = 1 AND name = 'Cash Dompet';

INSERT INTO portfolios (user_id, name, cash_balance)
SELECT 1, 'Pluang Saldo', 205672
WHERE NOT EXISTS (SELECT 1 FROM portfolios WHERE user_id = 1 AND name = 'Pluang Saldo');

-- Seed initial cashflow transactions (19 Sep 2026)
INSERT INTO cashflow_transactions (user_id, wallet_id, type, category, amount, currency, description, transaction_date, source)
SELECT 1, p.id, 'INCOME', 'GAJI', 100000, 'IDR', 'Pemasukan kas harian / rezeki segar', '2026-09-19 14:00:00', 'MANUAL'
FROM portfolios p WHERE p.user_id = 1 AND p.name = 'Cash Dompet'
AND NOT EXISTS (SELECT 1 FROM cashflow_transactions WHERE user_id = 1 AND description = 'Pemasukan kas harian / rezeki segar');

INSERT INTO cashflow_transactions (user_id, wallet_id, type, category, amount, currency, description, transaction_date, source)
SELECT 1, p.id, 'EXPENSE', 'KESEHATAN', 25000, 'IDR', 'Cukur rambut rapi / grooming diri', '2026-09-19 16:30:00', 'MANUAL'
FROM portfolios p WHERE p.user_id = 1 AND p.name = 'Cash Dompet'
AND NOT EXISTS (SELECT 1 FROM cashflow_transactions WHERE user_id = 1 AND description = 'Cukur rambut rapi / grooming diri');

