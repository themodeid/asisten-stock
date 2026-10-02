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
SELECT 1, 'Bank BCA', 480000
WHERE NOT EXISTS (SELECT 1 FROM portfolios WHERE user_id = 1 AND name = 'Bank BCA');

INSERT INTO portfolios (user_id, name, cash_balance)
SELECT 1, 'Cash Dompet', 200000
WHERE NOT EXISTS (SELECT 1 FROM portfolios WHERE user_id = 1 AND name = 'Cash Dompet');

INSERT INTO portfolios (user_id, name, cash_balance)
SELECT 1, 'GoPay', 3000
WHERE NOT EXISTS (SELECT 1 FROM portfolios WHERE user_id = 1 AND name = 'GoPay');

INSERT INTO portfolios (user_id, name, cash_balance)
SELECT 1, 'DANA', 12000
WHERE NOT EXISTS (SELECT 1 FROM portfolios WHERE user_id = 1 AND name = 'DANA');

INSERT INTO portfolios (user_id, name, cash_balance)
SELECT 1, 'Pluang Saldo', 0
WHERE NOT EXISTS (SELECT 1 FROM portfolios WHERE user_id = 1 AND name = 'Pluang Saldo');

-- Ensure balances match real liquid cash verification
UPDATE portfolios SET cash_balance = 480000 WHERE user_id = 1 AND name = 'Bank BCA';
UPDATE portfolios SET cash_balance = 200000 WHERE user_id = 1 AND name = 'Cash Dompet';
UPDATE portfolios SET cash_balance = 3000 WHERE user_id = 1 AND name = 'GoPay';
UPDATE portfolios SET cash_balance = 12000 WHERE user_id = 1 AND name = 'DANA';
UPDATE portfolios SET cash_balance = 0 WHERE user_id = 1 AND name = 'Pluang Saldo';

-- Seed cashflow transactions (September 2026)
INSERT INTO cashflow_transactions (user_id, wallet_id, type, category, amount, currency, description, transaction_date, source)
SELECT 1, p.id, 'INCOME', 'GAJI', 100000, 'IDR', 'Pemasukan kas harian / rezeki segar', '2026-09-19 14:00:00', 'MANUAL'
FROM portfolios p WHERE p.user_id = 1 AND p.name = 'Cash Dompet'
AND NOT EXISTS (SELECT 1 FROM cashflow_transactions WHERE user_id = 1 AND description = 'Pemasukan kas harian / rezeki segar');

INSERT INTO cashflow_transactions (user_id, wallet_id, type, category, amount, currency, description, transaction_date, source)
SELECT 1, p.id, 'EXPENSE', 'KESEHATAN', 25000, 'IDR', 'Cukur rambut rapi / grooming diri', '2026-09-19 16:30:00', 'MANUAL'
FROM portfolios p WHERE p.user_id = 1 AND p.name = 'Cash Dompet'
AND NOT EXISTS (SELECT 1 FROM cashflow_transactions WHERE user_id = 1 AND description = 'Cukur rambut rapi / grooming diri');

INSERT INTO cashflow_transactions (user_id, wallet_id, type, category, amount, currency, description, transaction_date, source)
SELECT 1, p.id, 'INCOME', 'GAJI', 500000, 'IDR', 'Penerimaan kas baru (disimpan tunai di dompet)', '2026-09-20 12:00:00', 'MANUAL'
FROM portfolios p WHERE p.user_id = 1 AND p.name = 'Cash Dompet'
AND NOT EXISTS (SELECT 1 FROM cashflow_transactions WHERE user_id = 1 AND description = 'Penerimaan kas baru (disimpan tunai di dompet)');

INSERT INTO cashflow_transactions (user_id, wallet_id, type, category, amount, currency, description, transaction_date, source)
SELECT 1, p.id, 'EXPENSE', 'MAKANAN', 19000, 'IDR', 'Makan malam ayam geprek', '2026-09-20 19:30:00', 'MANUAL'
FROM portfolios p WHERE p.user_id = 1 AND p.name = 'Cash Dompet'
AND NOT EXISTS (SELECT 1 FROM cashflow_transactions WHERE user_id = 1 AND description = 'Makan malam ayam geprek');

INSERT INTO cashflow_transactions (user_id, wallet_id, type, category, amount, currency, description, transaction_date, source)
SELECT 1, p.id, 'EXPENSE', 'TAGIHAN', 86000, 'IDR', 'Langganan Google AI Pro (5 TB) / Amunisi Co-Pilot Nino', '2026-09-21 10:00:00', 'MANUAL'
FROM portfolios p WHERE p.user_id = 1 AND p.name = 'GoPay'
AND NOT EXISTS (SELECT 1 FROM cashflow_transactions WHERE user_id = 1 AND description = 'Langganan Google AI Pro (5 TB) / Amunisi Co-Pilot Nino');

INSERT INTO cashflow_transactions (user_id, wallet_id, type, category, amount, currency, description, transaction_date, source)
SELECT 1, p.id, 'EXPENSE', 'INVESTASI', 500000, 'IDR', 'Top Up Investasi Pluang untuk VT (Vanguard World ETF)', '2026-09-23 13:00:00', 'MANUAL'
FROM portfolios p WHERE p.user_id = 1 AND p.name = 'Bank BCA'
AND NOT EXISTS (SELECT 1 FROM cashflow_transactions WHERE user_id = 1 AND description = 'Top Up Investasi Pluang untuk VT (Vanguard World ETF)');

INSERT INTO cashflow_transactions (user_id, wallet_id, type, category, amount, currency, description, transaction_date, source)
SELECT 1, p.id, 'INCOME', 'GAJI', 300000, 'IDR', 'Penerimaan gaji kantin sekolah minggu kemarin', '2026-09-28 09:00:00', 'MANUAL'
FROM portfolios p WHERE p.user_id = 1 AND p.name = 'Bank BCA'
AND NOT EXISTS (SELECT 1 FROM cashflow_transactions WHERE user_id = 1 AND description = 'Penerimaan gaji kantin sekolah minggu kemarin');

INSERT INTO cashflow_transactions (user_id, wallet_id, type, category, amount, currency, description, transaction_date, source)
SELECT 1, p.id, 'EXPENSE', 'TAGIHAN', 76000, 'IDR', 'Pembelian kuota paket data internet operasional bulanan', '2026-09-28 10:30:00', 'MANUAL'
FROM portfolios p WHERE p.user_id = 1 AND p.name = 'GoPay'
AND NOT EXISTS (SELECT 1 FROM cashflow_transactions WHERE user_id = 1 AND description = 'Pembelian kuota paket data internet operasional bulanan');

INSERT INTO cashflow_transactions (user_id, wallet_id, type, category, amount, currency, description, transaction_date, source)
SELECT 1, p.id, 'EXPENSE', 'INVESTASI', 200000, 'IDR', 'Top-up & beli VT Dunia di Pluang (Saldo VT melonjak ke Rp 1,385M)', '2026-09-28 11:00:00', 'MANUAL'
FROM portfolios p WHERE p.user_id = 1 AND p.name = 'Bank BCA'
AND NOT EXISTS (SELECT 1 FROM cashflow_transactions WHERE user_id = 1 AND description = 'Top-up & beli VT Dunia di Pluang (Saldo VT melonjak ke Rp 1,385M)');


