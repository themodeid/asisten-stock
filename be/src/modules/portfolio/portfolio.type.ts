import { AssetType } from "../transactions/transaction.type";

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
  asset_type: AssetType;
  quantity: number;
  currency: string;
  total_shares?: number;
  total_lots?: number;
  avg_buy_price: number;
  total_invested: number;
  total_invested_idr?: number;
  updated_at: Date;
  // Dynamic computed fields with live market data:
  current_price?: number;
  market_value?: number;
  market_value_idr?: number;
  floating_pnl?: number;
  floating_pnl_percent?: number;
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
  total_net_worth: number;
  total_floating_pnl: number;
  total_floating_pnl_percent: number;
  holdings_count: number;
  holdings: PortfolioHolding[];
  asset_allocations?: AssetAllocation[];
}

export interface RebalanceItem {
  asset_type: AssetType;
  label: string;
  representative_ticker: string;
  current_value_idr: number;
  current_weight_percent: number;
  target_weight_percent: number;
  weight_gap_percent: number; // target - current
  status: "UNDERWEIGHT" | "BALANCED" | "OVERWEIGHT";
  recommended_inflow_idr: number; // Allocation from fresh cash
  recommended_inflow_percent: number;
  recommended_action: string;
}

export interface RebalancePlanResult {
  portfolio_id: number;
  strategy_name: string;
  description: string;
  current_total_value_idr: number;
  fresh_capital_idr: number;
  projected_total_value_idr: number;
  items: RebalanceItem[];
  summary_advice: string;
}

export interface TaxSimulationResult {
  ticker: string;
  asset_type: AssetType;
  gross_sell_amount_idr: number;
  sell_quantity?: number;
  estimated_cost_basis_idr: number;
  estimated_gross_profit_idr: number;
  pnl_percentage: number;
  tax_rate_percent: number;
  tax_type: string;
  regulation_reference: string;
  estimated_tax_withheld_idr: number;
  estimated_exchange_fee_idr: number;
  net_cash_received_idr: number;
  net_realized_profit_idr: number;
  spt_reporting_code: string;
  spt_reporting_guide: string;
}

export interface PortfolioTaxSummary {
  portfolio_id: number;
  total_unrealized_pnl_idr: number;
  holdings_tax_breakdown: {
    ticker: string;
    asset_type: AssetType;
    current_value_idr: number;
    floating_pnl_idr: number;
    pnl_percent: number;
    potential_exit_tax_idr: number;
    tax_rule: string;
  }[];
  annual_spt_summary: {
    total_crypto_assets_idr: number;
    total_idx_shares_idr: number;
    total_global_etf_idr: number;
    total_gold_assets_idr: number;
    total_estimated_tax_if_realized_idr: number;
  };
}




export interface FxHoldingItem {
  ticker: string;
  asset_type: AssetType;
  quantity: number;
  entry_price_usd: number;
  current_price_usd: number;
  total_invested_usd: number;
  current_market_value_usd: number;
  pure_asset_gain_usd: number;
  pure_asset_gain_idr: number;
  pure_asset_gain_percent: number;
  entry_usd_idr_rate: number;
  current_usd_idr_rate: number;
  fx_gain_idr: number;
  fx_gain_percent: number;
  total_net_gain_idr: number;
  total_net_gain_percent: number;
  fx_cushion_ratio_percent: number;
}

export interface PortfolioFxSummary {
  portfolio_id: number;
  current_usd_idr_rate: number;
  total_foreign_value_usd: number;
  total_foreign_value_idr: number;
  total_portfolio_value_idr: number;
  foreign_allocation_percent: number;
  total_pure_asset_gain_idr: number;
  total_fx_currency_gain_idr: number;
  total_net_foreign_gain_idr: number;
  blended_foreign_return_percent: number;
  items: FxHoldingItem[];
  hedging_summary: string;
}
