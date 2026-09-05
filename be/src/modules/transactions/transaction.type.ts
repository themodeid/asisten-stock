export type AssetType =
  | "STOCK"
  | "CRYPTO"
  | "ETF"
  | "BOND"
  | "MUTUAL_FUND"
  | "GOLD"
  | "CASH";

export interface StockTransaction {
  id: number;
  portfolio_id: number;
  ticker: string;
  asset_type: AssetType;
  type: "BUY" | "SELL";
  lots?: number;
  shares?: number;
  quantity: number;
  price_per_share: number;
  currency: string;
  total_amount: number;
  fee: number;
  transaction_date: Date;
  notes?: string;
  created_at: Date;
}

export interface CreateTransactionInput {
  portfolio_id: number;
  ticker: string;
  asset_type?: AssetType;
  type: "BUY" | "SELL";
  lots?: number;
  quantity?: number;
  price_per_share?: number;
  total_budget?: number; // Nominal uang (e.g. 5 juta, 100 USD)
  currency?: string;
  fee?: number;
  transaction_date?: Date | string;
  notes?: string;
}

