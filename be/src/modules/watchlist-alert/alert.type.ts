export interface WatchlistItem {
  id: number;
  user_id: number;
  ticker: string;
  target_buy_price?: number;
  target_sell_price?: number;
  notes?: string;
  created_at: Date;
  // Computed:
  current_price?: number;
  day_change_percent?: number;
  company_name?: string;
  asset_type?: string;
  currency?: string;
}

export interface PriceAlert {
  id: number;
  user_id: number;
  ticker: string;
  target_price: number;
  condition: "ABOVE" | "BELOW";
  status: "ACTIVE" | "TRIGGERED" | "CANCELLED";
  created_at: Date;
  triggered_at?: Date;
  telegram_id?: number;
}
