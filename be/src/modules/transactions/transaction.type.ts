export interface StockTransaction {
  id: number;
  portfolio_id: number;
  ticker: string;
  type: "BUY" | "SELL";
  lots: number;
  shares: number;
  price_per_share: number;
  total_amount: number;
  fee: number;
  transaction_date: Date;
  notes?: string;
  created_at: Date;
}

export interface CreateTransactionInput {
  portfolio_id: number;
  ticker: string;
  type: "BUY" | "SELL";
  lots: number;
  price_per_share: number;
  fee?: number;
  transaction_date?: Date | string;
  notes?: string;
}
