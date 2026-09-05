-- =============================================================================
-- SEED INITIAL DATA: Default User, Portfolio, Holdings, and Watchlist
-- =============================================================================

-- 1. Insert Default User
INSERT INTO users (id, telegram_id, first_name, username, risk_profile, currency, timezone)
VALUES (1, 123456789, 'Adam Wahyu', 'adam_investor', 'moderate', 'IDR', 'Asia/Jakarta')
ON CONFLICT (id) DO UPDATE 
SET first_name = EXCLUDED.first_name, username = EXCLUDED.username;

-- Adjust sequence for users table
SELECT setval('users_id_seq', (SELECT GREATEST(MAX(id), 1) FROM users));

-- 2. Insert Default Portfolio
INSERT INTO portfolios (id, user_id, name, cash_balance)
VALUES (1, 1, 'Portofolio Utama', 15000000)
ON CONFLICT (id) DO UPDATE
SET cash_balance = EXCLUDED.cash_balance;

-- Adjust sequence for portfolios table
SELECT setval('portfolios_id_seq', (SELECT GREATEST(MAX(id), 1) FROM portfolios));

-- 3. Insert Initial Holdings
INSERT INTO portfolio_holdings (portfolio_id, ticker, total_shares, total_lots, avg_buy_price, total_invested)
VALUES 
  (1, 'BBCA.JK', 1000, 10, 9200, 9200000),
  (1, 'BBRI.JK', 2000, 20, 4600, 9200000),
  (1, 'TLKM.JK', 1500, 15, 2750, 4125000)
ON CONFLICT (portfolio_id, ticker) DO UPDATE
SET total_shares = EXCLUDED.total_shares,
    total_lots = EXCLUDED.total_lots,
    avg_buy_price = EXCLUDED.avg_buy_price,
    total_invested = EXCLUDED.total_invested;

-- 4. Insert Initial Transactions
INSERT INTO stock_transactions (portfolio_id, ticker, type, lots, shares, price_per_share, total_amount, fee, notes, transaction_date)
VALUES 
  (1, 'BBCA.JK', 'BUY', 10, 1000, 9200, 9200000, 13800, 'Akumulasi Bluechip Big Bank', NOW() - INTERVAL '14 days'),
  (1, 'BBRI.JK', 'BUY', 20, 2000, 4600, 9200000, 13800, 'Dividen Play & Swing', NOW() - INTERVAL '7 days'),
  (1, 'TLKM.JK', 'BUY', 15, 1500, 2750, 4125000, 6188, 'Entry dekat area support', NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;

-- 5. Insert Watchlist
INSERT INTO watchlists (user_id, ticker, target_buy_price, target_sell_price, notes)
VALUES 
  (1, 'BMRI.JK', 6200, 7000, 'Tunggu pullback ke MA50'),
  (1, 'ASII.JK', 4900, 5600, 'Pantau rebound penjualan otomotif'),
  (1, 'GOTO.JK', 55, 75, 'Speculative swing entry support')
ON CONFLICT (user_id, ticker) DO UPDATE
SET target_buy_price = EXCLUDED.target_buy_price,
    target_sell_price = EXCLUDED.target_sell_price,
    notes = EXCLUDED.notes;

-- 6. Insert Price Alerts
INSERT INTO price_alerts (user_id, ticker, target_price, condition, status)
VALUES 
  (1, 'BBCA.JK', 10000, 'ABOVE', 'ACTIVE'),
  (1, 'ASII.JK', 5000, 'BELOW', 'ACTIVE')
ON CONFLICT DO NOTHING;
