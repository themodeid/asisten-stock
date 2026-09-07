-- =============================================================================
-- ASISTEN+STOCK - UNIFIED INITIAL DATABASE SCHEMA
-- =============================================================================

-- 1. TABEL: users (Menyimpan data pengguna dan akun Telegram)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  first_name VARCHAR(100),
  username VARCHAR(100),
  risk_profile VARCHAR(50) DEFAULT 'moderate', -- 'conservative', 'moderate', 'aggressive'
  currency VARCHAR(10) DEFAULT 'IDR',
  timezone VARCHAR(50) DEFAULT 'Asia/Jakarta',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);

-- 2. TABEL: portfolios (Akun portofolio saham dan saldo kas)
CREATE TABLE IF NOT EXISTS portfolios (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) DEFAULT 'Portofolio Utama',
  cash_balance NUMERIC(18, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);

-- 3. TABEL: stock_transactions (Riwayat transaksi beli dan jual saham)
CREATE TABLE IF NOT EXISTS stock_transactions (
  id SERIAL PRIMARY KEY,
  portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  ticker VARCHAR(20) NOT NULL,             -- Contoh: 'BBCA.JK', 'BBRI.JK', 'AAPL'
  type VARCHAR(10) NOT NULL,               -- 'BUY' atau 'SELL'
  lots NUMERIC(12, 2) NOT NULL,            -- Jumlah lot (1 lot = 100 lembar)
  shares NUMERIC(14, 2) NOT NULL,          -- Total lembar saham (lots * 100)
  price_per_share NUMERIC(18, 2) NOT NULL, -- Harga per lembar saham
  total_amount NUMERIC(18, 2) NOT NULL,    -- Total nilai transaksi (shares * price + fee)
  fee NUMERIC(18, 2) DEFAULT 0,            -- Fee broker / transaksi
  transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,                              -- Catatan (misal: 'TP target 1', 'Average down support')
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_stock_tx_portfolio_ticker ON stock_transactions(portfolio_id, ticker);
CREATE INDEX IF NOT EXISTS idx_stock_tx_date ON stock_transactions(transaction_date DESC);

-- 4. TABEL: portfolio_holdings (Posisi saham aktif yang sedang dimiliki)
CREATE TABLE IF NOT EXISTS portfolio_holdings (
  id SERIAL PRIMARY KEY,
  portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  ticker VARCHAR(20) NOT NULL,
  total_shares NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_lots NUMERIC(12, 2) NOT NULL DEFAULT 0,
  avg_buy_price NUMERIC(18, 2) NOT NULL DEFAULT 0,  -- Rata-rata harga beli (average down/up)
  total_invested NUMERIC(18, 2) NOT NULL DEFAULT 0, -- Total modal tertanam (shares * avg_price)
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_portfolio_ticker UNIQUE (portfolio_id, ticker)
);
CREATE INDEX IF NOT EXISTS idx_holdings_portfolio ON portfolio_holdings(portfolio_id);

-- 5. TABEL: watchlists (Daftar pantau saham incaran)
CREATE TABLE IF NOT EXISTS watchlists (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticker VARCHAR(20) NOT NULL,
  target_buy_price NUMERIC(18, 2),
  target_sell_price NUMERIC(18, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_user_watchlist_ticker UNIQUE (user_id, ticker)
);
CREATE INDEX IF NOT EXISTS idx_watchlists_user ON watchlists(user_id);

-- 6. TABEL: price_alerts (Pemicu alert notifikasi Telegram saat harga menyentuh target)
CREATE TABLE IF NOT EXISTS price_alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticker VARCHAR(20) NOT NULL,
  target_price NUMERIC(18, 2) NOT NULL,
  condition VARCHAR(10) NOT NULL,      -- 'ABOVE' atau 'BELOW'
  status VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE', 'TRIGGERED', 'CANCELLED'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  triggered_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON price_alerts(status) WHERE status = 'ACTIVE';

-- 7. TABEL: chat_logs (Riwayat percakapan pengguna & pemanggilan tool AI Gemini)
CREATE TABLE IF NOT EXISTS chat_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  role VARCHAR(20) NOT NULL,           -- 'user', 'assistant', 'system', 'tool'
  message TEXT NOT NULL,
  tool_calls JSONB,                    -- Log payload Function Calling yang dieksekusi
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_chat_logs_user_date ON chat_logs(user_id, created_at DESC);
