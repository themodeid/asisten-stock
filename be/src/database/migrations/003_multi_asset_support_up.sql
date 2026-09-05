-- =============================================================================
-- MIGRATION 003: MULTI-ASSET SUPPORT (Saham, Crypto, ETF, Bonds, Gold, Kas)
-- =============================================================================

-- 1. Alter stock_transactions to support multi-asset
ALTER TABLE stock_transactions 
  ADD COLUMN IF NOT EXISTS asset_type VARCHAR(20) DEFAULT 'STOCK',
  ADD COLUMN IF NOT EXISTS quantity NUMERIC(24, 8) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'IDR';

UPDATE stock_transactions SET quantity = shares WHERE quantity = 0 OR quantity IS NULL;

-- 2. Alter portfolio_holdings to support multi-asset
ALTER TABLE portfolio_holdings
  ADD COLUMN IF NOT EXISTS asset_type VARCHAR(20) DEFAULT 'STOCK',
  ADD COLUMN IF NOT EXISTS quantity NUMERIC(24, 8) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'IDR';

UPDATE portfolio_holdings SET quantity = total_shares WHERE quantity = 0 OR quantity IS NULL;

-- Drop old unique constraint on (portfolio_id, ticker) and create new one including asset_type
ALTER TABLE portfolio_holdings DROP CONSTRAINT IF EXISTS uq_portfolio_ticker;
ALTER TABLE portfolio_holdings ADD CONSTRAINT uq_portfolio_ticker_asset UNIQUE (portfolio_id, ticker, asset_type);

-- 3. Alter watchlists to support multi-asset
ALTER TABLE watchlists
  ADD COLUMN IF NOT EXISTS asset_type VARCHAR(20) DEFAULT 'STOCK',
  ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'IDR';

ALTER TABLE watchlists DROP CONSTRAINT IF EXISTS uq_user_watchlist_ticker;
ALTER TABLE watchlists ADD CONSTRAINT uq_user_watchlist_ticker_asset UNIQUE (user_id, ticker, asset_type);

-- 4. Allow nullable lots and shares for non-stock multi-asset
ALTER TABLE stock_transactions ALTER COLUMN lots DROP NOT NULL;
ALTER TABLE stock_transactions ALTER COLUMN shares DROP NOT NULL;
ALTER TABLE stock_transactions ALTER COLUMN lots SET DEFAULT 0;
ALTER TABLE stock_transactions ALTER COLUMN shares SET DEFAULT 0;

ALTER TABLE portfolio_holdings ALTER COLUMN total_lots DROP NOT NULL;
ALTER TABLE portfolio_holdings ALTER COLUMN total_shares DROP NOT NULL;
ALTER TABLE portfolio_holdings ALTER COLUMN total_lots SET DEFAULT 0;
ALTER TABLE portfolio_holdings ALTER COLUMN total_shares SET DEFAULT 0;

-- 5. Seed Combined Multi-Asset Holdings (Pluang + Reku)
UPDATE portfolios SET cash_balance = 1893 WHERE id = 1;

INSERT INTO portfolio_holdings (portfolio_id, ticker, asset_type, quantity, total_shares, total_lots, avg_buy_price, total_invested, currency)
VALUES
  (1, 'BTC-USD', 'CRYPTO', 0.004364, 0, 0, 1641857699, 7165067, 'IDR'),
  (1, 'VT', 'ETF', 0.35, 0, 0, 1879620, 657867, 'IDR'),
  (1, 'USDT-USD', 'CRYPTO', 12.65, 0, 0, 16352, 206858, 'IDR')
ON CONFLICT (portfolio_id, ticker, asset_type) DO UPDATE
SET quantity = EXCLUDED.quantity,
    avg_buy_price = EXCLUDED.avg_buy_price,
    total_invested = EXCLUDED.total_invested,
    currency = EXCLUDED.currency;

INSERT INTO stock_transactions (portfolio_id, ticker, asset_type, type, quantity, lots, shares, price_per_share, total_amount, currency, notes, transaction_date)
VALUES
  (1, 'BTC-USD', 'CRYPTO', 'BUY', 0.003106, 0, 0, 1751437218, 5439964, 'IDR', 'Akumulasi Bitcoin Kripto Reku', NOW() - INTERVAL '30 days'),
  (1, 'BTC-USD', 'CRYPTO', 'BUY', 0.001258, 0, 0, 1371306041, 1725103, 'IDR', 'Akumulasi Bitcoin Pluang', NOW() - INTERVAL '14 days'),
  (1, 'VT', 'ETF', 'BUY', 0.35, 0, 0, 1879620, 657867, 'IDR', 'Vanguard Total World ETF Pluang', NOW() - INTERVAL '10 days'),
  (1, 'USDT-USD', 'CRYPTO', 'BUY', 12.65, 0, 0, 16352, 206858, 'IDR', 'Tether Stablecoin Pluang', NOW() - INTERVAL '7 days')
ON CONFLICT DO NOTHING;