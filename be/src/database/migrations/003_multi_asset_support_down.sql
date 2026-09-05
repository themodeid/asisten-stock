ALTER TABLE watchlists DROP CONSTRAINT IF EXISTS uq_user_watchlist_ticker_asset;
ALTER TABLE watchlists DROP COLUMN IF EXISTS asset_type, DROP COLUMN IF EXISTS currency;
ALTER TABLE watchlists ADD CONSTRAINT uq_user_watchlist_ticker UNIQUE (user_id, ticker);

ALTER TABLE portfolio_holdings DROP CONSTRAINT IF EXISTS uq_portfolio_ticker_asset;
ALTER TABLE portfolio_holdings DROP COLUMN IF EXISTS asset_type, DROP COLUMN IF EXISTS quantity, DROP COLUMN IF EXISTS currency;
ALTER TABLE portfolio_holdings ADD CONSTRAINT uq_portfolio_ticker UNIQUE (portfolio_id, ticker);

ALTER TABLE stock_transactions DROP COLUMN IF EXISTS asset_type, DROP COLUMN IF EXISTS quantity, DROP COLUMN IF EXISTS currency;