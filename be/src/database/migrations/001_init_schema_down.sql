-- =============================================================================
-- ROLLBACK UNIFIED INITIAL DATABASE SCHEMA
-- =============================================================================

DROP TABLE IF EXISTS chat_logs CASCADE;
DROP TABLE IF EXISTS price_alerts CASCADE;
DROP TABLE IF EXISTS watchlists CASCADE;
DROP TABLE IF EXISTS portfolio_holdings CASCADE;
DROP TABLE IF EXISTS stock_transactions CASCADE;
DROP TABLE IF EXISTS portfolios CASCADE;
DROP TABLE IF EXISTS users CASCADE;
