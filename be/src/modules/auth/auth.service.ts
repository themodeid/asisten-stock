import crypto from "crypto";
import { pool } from "../../config/database";
import { User } from "../users/user.type";

export interface UserFinancialProfile {
  id: number;
  username: string;
  first_name: string;
  full_name: string;
  age: number;
  occupation: string;
  monthly_income: number;
  monthly_expenses: number;
  monthly_surplus: number;
  emergency_fund_months: number;
  risk_profile: "conservative" | "moderate" | "aggressive";
  investment_goals: string;
  time_horizon_years: number;
  strategy_preference: string;
  currency: string;
  timezone: string;
}

export const hashPassword = (password: string, salt?: string): { salt: string; hash: string } => {
  const actualSalt = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, actualSalt, 1000, 64, "sha512").toString("hex");
  return { salt: actualSalt, hash };
};

export const verifyPassword = (password: string, salt: string, expectedHash: string): boolean => {
  const { hash } = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(expectedHash, "hex"));
};

export const authenticateUser = async (username: string, password: string): Promise<UserFinancialProfile | null> => {
  const cleanUsername = username.trim().toLowerCase();

  const { rows } = await pool.query(
    `SELECT id, username, first_name, full_name, age, occupation, 
            monthly_income, monthly_expenses, emergency_fund_months, 
            risk_profile, investment_goals, time_horizon_years, strategy_preference,
            currency, timezone, password_hash, password_salt
     FROM users 
     WHERE LOWER(username) = $1
     LIMIT 1;`,
    [cleanUsername]
  );

  if (rows.length === 0) return null;
  const user = rows[0];

  // If user has no password set yet, auto-hash the provided password for first-time setup
  if (!user.password_hash || !user.password_salt) {
    if (!password || password.length < 6) {
      return null; // Reject weak passwords on first setup
    }
    const { salt, hash } = hashPassword(password);
    await pool.query("UPDATE users SET password_salt = $1, password_hash = $2 WHERE id = $3;", [salt, hash, user.id]);
    return formatProfileResponse(user);
  }

  const isValid = verifyPassword(password, user.password_salt, user.password_hash);
  if (!isValid) return null;

  return formatProfileResponse(user);
};

export const getUserFinancialProfile = async (userId: number = 1): Promise<UserFinancialProfile | null> => {
  const { rows } = await pool.query(
    `SELECT id, username, first_name, full_name, age, occupation, 
            monthly_income, monthly_expenses, emergency_fund_months, 
            risk_profile, investment_goals, time_horizon_years, strategy_preference,
            currency, timezone
     FROM users 
     WHERE id = $1;`,
    [userId]
  );

  if (rows.length === 0) return null;
  return formatProfileResponse(rows[0]);
};

export const updateFinancialProfile = async (
  userId: number = 1,
  data: Partial<UserFinancialProfile>
): Promise<UserFinancialProfile | null> => {
  const { rows } = await pool.query(
    `UPDATE users
     SET full_name = COALESCE($1, full_name),
         age = COALESCE($2, age),
         occupation = COALESCE($3, occupation),
         monthly_income = COALESCE($4, monthly_income),
         monthly_expenses = COALESCE($5, monthly_expenses),
         emergency_fund_months = COALESCE($6, emergency_fund_months),
         risk_profile = COALESCE($7, risk_profile),
         investment_goals = COALESCE($8, investment_goals),
         time_horizon_years = COALESCE($9, time_horizon_years),
         strategy_preference = COALESCE($10, strategy_preference),
         updated_at = NOW()
     WHERE id = $11
     RETURNING id, username, first_name, full_name, age, occupation, 
               monthly_income, monthly_expenses, emergency_fund_months, 
               risk_profile, investment_goals, time_horizon_years, strategy_preference,
               currency, timezone;`,
    [
      data.full_name || null,
      data.age !== undefined ? Number(data.age) : null,
      data.occupation || null,
      data.monthly_income !== undefined ? Number(data.monthly_income) : null,
      data.monthly_expenses !== undefined ? Number(data.monthly_expenses) : null,
      data.emergency_fund_months !== undefined ? Number(data.emergency_fund_months) : null,
      data.risk_profile || null,
      data.investment_goals || null,
      data.time_horizon_years !== undefined ? Number(data.time_horizon_years) : null,
      data.strategy_preference || null,
      userId,
    ]
  );

  if (rows.length === 0) return null;
  return formatProfileResponse(rows[0]);
};

export const updatePassword = async (
  userId: number = 1,
  oldPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> => {
  const { rows } = await pool.query(
    "SELECT password_hash, password_salt FROM users WHERE id = $1;",
    [userId]
  );

  if (rows.length === 0) {
    return { success: false, message: "Pengguna tidak ditemukan." };
  }

  const user = rows[0];
  if (user.password_hash && user.password_salt) {
    const isValid = verifyPassword(oldPassword, user.password_salt, user.password_hash);
    if (!isValid) {
      return { success: false, message: "Password lama tidak cocok." };
    }
  }

  if (newPassword.length < 6) {
    return { success: false, message: "Password baru minimal 6 karakter." };
  }

  const { salt, hash } = hashPassword(newPassword);
  await pool.query(
    "UPDATE users SET password_salt = $1, password_hash = $2, updated_at = NOW() WHERE id = $3;",
    [salt, hash, userId]
  );

  return { success: true, message: "Password berhasil diperbarui." };
};

function formatProfileResponse(row: any): UserFinancialProfile {
  const income = Number(row.monthly_income || 0);
  const expenses = Number(row.monthly_expenses || 0);
  return {
    id: row.id,
    username: row.username || "adamwahyukur",
    first_name: row.first_name || "Adam",
    full_name: row.full_name || "Adam Wahyu Kurniawan",
    age: Number(row.age || 25),
    occupation: row.occupation || "Investor & Professional",
    monthly_income: income,
    monthly_expenses: expenses,
    monthly_surplus: Math.max(0, income - expenses),
    emergency_fund_months: Number(row.emergency_fund_months || 6),
    risk_profile: row.risk_profile || "moderate",
    investment_goals: row.investment_goals || "Financial Independence / Dana Pensiun & Dividen Pasif",
    time_horizon_years: Number(row.time_horizon_years || 10),
    strategy_preference: row.strategy_preference || "Pertumbuhan seimbang: DCA berkala di ETF Global VT, Saham Bluechip Dividen, Kripto terukur, dan Emas sebagai pelindung nilai.",
    currency: row.currency || "IDR",
    timezone: row.timezone || "Asia/Jakarta",
  };
}
