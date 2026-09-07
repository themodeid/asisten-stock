import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config();

function getEnv(name: string, defaultValue?: string): string {
  const val = process.env[name]?.trim();
  if (!val) {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`❌ Environment variable '${name}' is required.`);
  }
  return val;
}

function getEnvInt(name: string, defaultValue: number): number {
  const val = process.env[name]?.trim();
  if (!val) return defaultValue;
  const parsed = Number(val);
  if (!Number.isFinite(parsed)) {
    throw new Error(`❌ Environment variable '${name}' must be a valid number.`);
  }
  return parsed;
}

function getEnvBool(name: string, defaultValue: boolean): boolean {
  const val = process.env[name]?.trim();
  if (!val) return defaultValue;
  return val.toLowerCase() === "true" || val === "1";
}

export const ENV = {
  NODE_ENV: getEnv("NODE_ENV", "development"),
  PORT: getEnvInt("PORT", 3050),
  DATABASE_URL: getEnv(
    "DATABASE_URL",
    "postgresql://postgres:postgres_password_dev@localhost:5450/asisten_stock_db"
  ),
  CORS_ORIGIN: getEnv("CORS_ORIGIN", "http://localhost:3051,http://localhost:3000"),
  JSON_BODY_LIMIT: getEnv("JSON_BODY_LIMIT", "10mb"),
  RATE_LIMIT_WINDOW_MS: getEnvInt("RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000),
  RATE_LIMIT_MAX: getEnvInt("RATE_LIMIT_MAX", 200),
  GEMINI_API_KEY: getEnv("GEMINI_API_KEY", ""),
  GEMINI_MODEL: getEnv("GEMINI_MODEL", "gemini-2.5-flash"),
  REDIS_URL: getEnv("REDIS_URL", "redis://localhost:6379"),
  USE_REDIS: getEnvBool("USE_REDIS", false),
  TELEGRAM_BOT_TOKEN: getEnv("TELEGRAM_BOT_TOKEN", ""),
  TELEGRAM_WEBHOOK_URL: getEnv("TELEGRAM_WEBHOOK_URL", ""),
  TELEGRAM_USE_POLLING: getEnvBool("TELEGRAM_USE_POLLING", true),
  JWT_SECRET: getEnv("JWT_SECRET", "asisten-stock-secret-key-change-in-production-2026"),
  JWT_EXPIRES_IN: getEnv("JWT_EXPIRES_IN", "7d"),
} as const;
