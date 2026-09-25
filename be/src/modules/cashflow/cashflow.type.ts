export type CashflowType = "INCOME" | "EXPENSE" | "TRANSFER";

export type CashflowCategory =
  | "MAKANAN"
  | "TRANSPORT"
  | "GAJI"
  | "INVESTASI"
  | "BELANJA"
  | "TAGIHAN"
  | "HIBURAN"
  | "KESEHATAN"
  | "PENDIDIKAN"
  | "TRANSFER"
  | "LAINNYA";

export interface CashflowTransaction {
  id: number;
  user_id: number;
  wallet_id?: number;
  wallet_name?: string;
  to_wallet_id?: number;
  to_wallet_name?: string;
  type: CashflowType;
  category: CashflowCategory | string;
  amount: number;
  currency: string;
  description?: string;
  transaction_date: Date | string;
  source: "MANUAL" | "AI_CHAT" | "AI_RECEIPT";
  receipt_image_url?: string;
  created_at: Date;
}

export interface CreateCashflowInput {
  wallet_id?: number;
  wallet_name?: string;
  to_wallet_id?: number;
  to_wallet_name?: string;
  type: CashflowType;
  category: CashflowCategory | string;
  amount: number;
  currency?: string;
  description?: string;
  transaction_date?: string;
  source?: "MANUAL" | "AI_CHAT" | "AI_RECEIPT";
  receipt_image_url?: string;
}

export interface UpdateCashflowInput {
  wallet_id?: number;
  to_wallet_id?: number;
  type?: CashflowType;
  category?: CashflowCategory | string;
  amount?: number;
  description?: string;
  transaction_date?: string;
}

export interface CashflowSummary {
  total_income: number;
  total_expense: number;
  net_savings: number;
  total_cash_balance: number;
  category_breakdown: { category: string; amount: number; percentage: number }[];
  period: { month: number; year: number };
}
