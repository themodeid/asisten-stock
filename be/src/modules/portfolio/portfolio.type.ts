export interface Portfolio {
  id: number;
  user_id: number;
  name: string;
  cash_balance: number;
  created_at: Date;
  updated_at: Date;
}

export interface PortfolioHolding {
  id: number;
  portfolio_id: number;
  ticker: string;
  total_shares: number;
  total_lots: number;
  avg_buy_price: number;
  total_invested: number;
  updated_at: Date;
  // Dynamic computed fields with live market data:
  current_price?: number;
  market_value?: number;
  floating_pnl?: number;
  floating_pnl_percent?: number;
  weight_percent?: number;
  company_name?: string;
}

export interface PortfolioSummary {
  portfolio_id: number;
  portfolio_name: string;
  cash_balance: number;
  total_invested: number;
  total_market_value: number;
  total_net_worth: number;
  total_floating_pnl: number;
  total_floating_pnl_percent: number;
  holdings_count: number;
  holdings: PortfolioHolding[];
}
