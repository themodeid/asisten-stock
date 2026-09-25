-- =============================================================================
-- RECORD TRANSACTIONS & CASH RECONCILIATION (24 SEPTEMBER 2026)
-- =============================================================================

-- 1. Pastikan seluruh dompet/rekening kas tercatat di portfolios
INSERT INTO portfolios (user_id, name, cash_balance)
SELECT 1, 'GoPay', 79000.00
WHERE NOT EXISTS (SELECT 1 FROM portfolios WHERE user_id = 1 AND name = 'GoPay');

INSERT INTO portfolios (user_id, name, cash_balance)
SELECT 1, 'DANA', 12000.00
WHERE NOT EXISTS (SELECT 1 FROM portfolios WHERE user_id = 1 AND name = 'DANA');

-- 2. Update saldo kas riil terkini Mas Aang
UPDATE portfolios SET cash_balance = 380000.00 WHERE user_id = 1 AND name = 'Bank BCA';
UPDATE portfolios SET cash_balance = 200000.00 WHERE user_id = 1 AND name = 'Cash Dompet';
UPDATE portfolios SET cash_balance = 79000.00 WHERE user_id = 1 AND name = 'GoPay';
UPDATE portfolios SET cash_balance = 12000.00 WHERE user_id = 1 AND name = 'DANA';
UPDATE portfolios SET cash_balance = 0.00 WHERE user_id = 1 AND name = 'Pluang Saldo';

-- 3. Catat transaksi mutasi cashflow
INSERT INTO cashflow_transactions (user_id, wallet_id, type, category, amount, currency, description, transaction_date, source)
SELECT 1, p.id, 'EXPENSE', 'INVESTASI', 500000.00, 'IDR', 'Top Up Investasi Pluang untuk VT (Vanguard World ETF)', '2026-09-23 13:00:00', 'MANUAL'
FROM portfolios p WHERE p.user_id = 1 AND p.name = 'Bank BCA'
AND NOT EXISTS (SELECT 1 FROM cashflow_transactions WHERE user_id = 1 AND description = 'Top Up Investasi Pluang untuk VT (Vanguard World ETF)');

-- 4. Catat transaksi pembelian VT di stock_transactions
INSERT INTO stock_transactions (portfolio_id, ticker, asset_type, type, quantity, lots, shares, price_per_share, total_amount, currency, notes, transaction_date)
VALUES (1, 'VT', 'ETF', 'BUY', 0.20, 0, 0, 2500000.00, 500000.00, 'IDR', 'Pembelian VT (Vanguard Total World Stock ETF) Pluang', '2026-09-23 13:06:00');

-- Update holding VT
UPDATE portfolio_holdings
SET quantity = 0.55000000,
    avg_buy_price = 2105212.73,
    total_invested = 1157867.00,
    updated_at = NOW()
WHERE portfolio_id = 1 AND ticker = 'VT';

-- 5. Catat transaksi jual USDT dan beli PAXG
INSERT INTO stock_transactions (portfolio_id, ticker, asset_type, type, quantity, lots, shares, price_per_share, total_amount, currency, notes, transaction_date)
VALUES 
  (1, 'USDT-USD', 'CRYPTO', 'SELL', 12.23, 0, 0, 16353.00, 200000.00, 'IDR', 'Konversi/Jual USDT Pluang untuk Beli Emas PAXG', '2026-09-23 13:05:00'),
  (1, 'PAXG-USD', 'GOLD', 'BUY', 0.0051, 0, 0, 39825294.00, 203109.00, 'IDR', 'Pembelian Emas Digital PAXG (PAX Gold) Pluang', '2026-09-23 13:05:00');

-- Update holding USDT (sisa saldo dust)
UPDATE portfolio_holdings
SET quantity = 0.42000000,
    total_invested = 6858.00,
    updated_at = NOW()
WHERE portfolio_id = 1 AND ticker = 'USDT-USD';

-- Insert atau update holding PAXG (Emas)
INSERT INTO portfolio_holdings (portfolio_id, ticker, asset_type, quantity, total_shares, total_lots, avg_buy_price, total_invested, currency)
VALUES (1, 'PAXG-USD', 'GOLD', 0.00510000, 0, 0, 39825294.00, 203109.00, 'IDR')
ON CONFLICT (portfolio_id, ticker, asset_type) DO UPDATE
SET quantity = EXCLUDED.quantity,
    avg_buy_price = EXCLUDED.avg_buy_price,
    total_invested = EXCLUDED.total_invested,
    updated_at = NOW();
