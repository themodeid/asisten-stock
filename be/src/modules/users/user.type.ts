export interface User {
  id: number;
  telegram_id: number;
  first_name?: string;
  username?: string;
  risk_profile: "conservative" | "moderate" | "aggressive";
  currency: string;
  timezone: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  telegram_id: number;
  first_name?: string;
  username?: string;
  risk_profile?: "conservative" | "moderate" | "aggressive";
  currency?: string;
  timezone?: string;
}
