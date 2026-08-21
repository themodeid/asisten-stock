import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import helmet from "helmet";
import { pool } from "./config/database";
import { runMigrations } from "./database/migrationRunner";
import routes from "./routes/index";
import { errorHandler } from "./middlewares/errorHandler";
import { ENV } from "./config/env";
import { initTelegramBot } from "./modules/telegram/telegram.bot";
import { initScheduler } from "./modules/scheduler/scheduler.service";

export const app = express();

// ======================================================
// 🛠️ MIDDLEWARES
// ======================================================

const allowedOrigins = ENV.CORS_ORIGIN
  ? ENV.CORS_ORIGIN.split(",").map((o) => o.trim())
  : ["http://localhost:3000", "http://localhost:3051"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
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

app.use(express.urlencoded({ extended: true, limit: ENV.JSON_BODY_LIMIT }));
app.use(express.json({ limit: ENV.JSON_BODY_LIMIT }));

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
    message: "Jarvis Stock Assistant Backend is healthy",
    timestamp: new Date().toISOString(),
    env: ENV.NODE_ENV,
  });
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
  console.log("===================================");
  console.log("🤖 Starting Jarvis Stock Backend Server...");

  try {
    // 1. TEST DATABASE CONNECTION
    await pool.query("SELECT 1;");
    console.log("✅ PostgreSQL Database connected successfully");

    // 2. RUN AUTO-MIGRATIONS
    await runMigrations();

    // 3. INITIALIZE TELEGRAM BOT
    initTelegramBot();

    // 4. INITIALIZE SCHEDULER
    initScheduler();

    // 5. START HTTP SERVER
    app.listen(ENV.PORT, () => {
      console.log("===================================");
      console.log("🚀 Jarvis Backend is up and running!");
      console.log(`🌐 Base API URL : http://localhost:${ENV.PORT}/api`);
      console.log(`🕒 System Time  : ${new Date().toLocaleString()}`);
      console.log("===================================");
    });
  } catch (error) {
    console.error("===================================");
    console.error("❌ Server failed to start:", error);
    console.error("===================================");
    // Don't exit immediately in local dev mode if DB is not up yet
    console.log("💡 Tip: Start PostgreSQL using 'npm run docker:db' or check your DATABASE_URL in .env");
  }
}

if (process.env.NODE_ENV !== "test") {
  startServer();
}
