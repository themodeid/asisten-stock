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