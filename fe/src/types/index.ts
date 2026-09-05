export type AssetType =
  | "STOCK"
  | "CRYPTO"
  | "ETF"
  | "BOND"
  | "MUTUAL_FUND"
  | "GOLD"
  | "CASH";

export interface StockHolding {
  id: number;
  portfolio_id: number;
  ticker: string;
  asset_type?: AssetType;
  quantity?: number;
  currency?: string;
  total_shares?: number;
  total_lots?: number;
  avg_buy_price: number;
  total_invested: number;
  total_invested_idr?: number;
  current_price: number;
  market_value: number;
  market_value_idr?: number;
  floating_pnl: number;
  floating_pnl_percent: number;
  weight_percent?: number;
  company_name?: string;
}

export interface AssetAllocation {
  asset_type: AssetType;
  label: string;
  total_value: number;
  percentage: number;
  count: number;
}

export interface PortfolioSummary {
  portfolio_id: number;
  portfolio_name: string;
  cash_balance: number;
  total_invested: number;
  total_market_value: number;
  total_value?: number;
  total_net_worth: number;
  total_floating_pnl: number;
  total_floating_pnl_percent: number;
  holdings_count: number;
  holdings: StockHolding[];
  asset_allocations?: AssetAllocation[];
}

export interface StockTransaction {
  id: number;
  portfolio_id: number;
  ticker: string;
  asset_type?: AssetType;
  type: "BUY" | "SELL";
  lots?: number;
  shares?: number;
  quantity?: number;
  price_per_share: number;
  currency?: string;
  total_amount: number;
  fee: number;
  transaction_date: string;
  notes?: string;
}

export interface WatchlistItem {
  id: number;
  user_id: number;
  ticker: string;
  asset_type?: AssetType;
  target_buy_price?: number;
  target_sell_price?: number;
  notes?: string;
  current_price?: number;
  day_change_percent?: number;
  company_name?: string;
}

export interface StockQuote {
  ticker: string;
  name: string;
  currency: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketVolume: number;
  trailingPE?: number;
  priceToBook?: number;
  dividendYield?: number;
  returnOnEquity?: number;
}

export interface ChatMessage {
  id?: string | number;
  role: "user" | "assistant" | "system";
  message: string;
  tool_calls?: any;
  created_at?: string;
}

