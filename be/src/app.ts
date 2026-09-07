import express from "express";
import http from "http";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { pool } from "./config/database";
import { runMigrations } from "./database/migrationRunner";
import routes from "./routes/index";
import { errorHandler } from "./middlewares/errorHandler";
import { sanitizeBody } from "./middlewares/sanitize";
import { ENV } from "./config/env";
import { initTelegramBot } from "./modules/telegram/telegram.bot";
import { initScheduler } from "./modules/scheduler/scheduler.service";
import { initSocketIO } from "./modules/websocket/socket.service";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import { logger } from "./config/logger";

export const app = express();
export const server = http.createServer(app);

// ======================================================
// 🛠️ MIDDLEWARES
// ======================================================

const allowedOrigins = ENV.CORS_ORIGIN
  ? ENV.CORS_ORIGIN.split(",").map((o) => o.trim())
  : ["http://localhost:3000", "http://localhost:3051"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes("*") ||
        origin.includes("localhost") ||
        origin.includes("127.0.0.1") ||
        origin.startsWith("http://192.168.") ||
        origin.startsWith("http://10.") ||
        origin.startsWith("http://172.")
      ) {
        callback(null, true);
      } else {
        callback(new Error(`Blocked by CORS: ${origin} is not allowed`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan("dev"));

// Rate Limiters
const stockApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    statusCode: 429,
    message: "Terlalu banyak permintaan ke server. Silakan coba beberapa saat lagi.",
  },
});
app.use("/api", stockApiLimiter);

// Per-user rate limiter for Gemini AI endpoints (expensive API calls)
const geminiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 AI requests per 15 minutes per user
  keyGenerator: (req) => (req as any).user?.userId?.toString() || req.ip || "unknown",
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    statusCode: 429,
    message: "Kuota AI tercapai. Maksimal 30 request per 15 menit. Silakan tunggu sebentar.",
  },
});
app.use("/api/gemini", geminiLimiter);

// Brute-force protection for login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    statusCode: 429,
    message: "Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.",
  },
});
app.use("/api/auth/login", loginLimiter);

app.use(express.urlencoded({ extended: true, limit: ENV.JSON_BODY_LIMIT }));
app.use(express.json({ limit: ENV.JSON_BODY_LIMIT }));

// Sanitize all request bodies (strip HTML tags)
app.use(sanitizeBody);

// Syntax Error Handler for Invalid JSON
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (err instanceof SyntaxError && "body" in err) {
      return res.status(400).json({
        status: "error",
        message: "Invalid JSON format",
        statusCode: 400,
      });
    }
    next(err);
  }
);

// Healthcheck
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Asisten+Stock Backend is healthy",
    timestamp: new Date().toISOString(),
    env: ENV.NODE_ENV,
  });
});

// ======================================================
// 📖 SWAGGER API DOCUMENTATION
// ======================================================
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api/docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// ======================================================
// 🛣️ ROUTES
// ======================================================

app.use("/api", routes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.method} ${req.path} not found`,
    statusCode: 404,
  });
});

// Centralized error handler
app.use(errorHandler);

// ======================================================
// 🚀 SERVER STARTUP
// ======================================================
async function startServer(): Promise<void> {
  logger.info("🤖 Starting Asisten+Stock Backend Server...");

  try {
    // 1. TEST DATABASE CONNECTION
    await pool.query("SELECT 1;");
    logger.info("✅ PostgreSQL Database connected successfully");

    // 2. RUN AUTO-MIGRATIONS
    await runMigrations();

    // 3. INITIALIZE TELEGRAM BOT
    initTelegramBot();

    // 4. INITIALIZE SCHEDULER
    initScheduler();

    // 5. INITIALIZE WEBSOCKET (Socket.IO)
    initSocketIO(server);

    // 6. START HTTP SERVER (with Socket.IO attached)
    server.listen(ENV.PORT, "0.0.0.0", () => {
      logger.info({
        port: ENV.PORT,
        baseUrl: `http://localhost:${ENV.PORT}/api`,
        docsUrl: `http://localhost:${ENV.PORT}/api/docs`,
        websocket: `ws://localhost:${ENV.PORT}`,
      }, "🚀 Asisten+Stock Backend is up and running!");
    });
  } catch (error) {
    logger.error({ err: error }, "❌ Server failed to start");
    logger.info("💡 Tip: Start PostgreSQL using 'npm run docker:db' or check your DATABASE_URL in .env");
  }
}

if (process.env.NODE_ENV !== "test") {
  startServer();
}
