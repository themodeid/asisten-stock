import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { ENV } from "../../config/env";

let io: SocketIOServer | null = null;

/**
 * Initialize Socket.IO server attached to the HTTP server.
 * Enables real-time push notifications to the web dashboard.
 */
export const initSocketIO = (httpServer: HttpServer): void => {
  const allowedOrigins = ENV.CORS_ORIGIN
    ? ENV.CORS_ORIGIN.split(",").map((o) => o.trim())
    : ["http://localhost:3000", "http://localhost:3051"];

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (
          !origin ||
          allowedOrigins.includes(origin) ||
          allowedOrigins.includes("*") ||
          origin.includes("localhost") ||
          origin.includes("127.0.0.1") ||
          origin.startsWith("http://192.168.") ||
          origin.startsWith("http://10.")
        ) {
          callback(null, true);
        } else {
          callback(new Error("WebSocket CORS blocked"));
        }
      },
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    console.log(`🔌 WebSocket client connected: ${socket.id}`);

    socket.on("join:portfolio", (portfolioId: number) => {
      socket.join(`portfolio:${portfolioId}`);
      console.log(`📊 Client ${socket.id} joined portfolio room: ${portfolioId}`);
    });

    socket.on("disconnect", (reason) => {
      console.log(`🔌 WebSocket client disconnected: ${socket.id} (${reason})`);
    });
  });

  console.log("🔌 Socket.IO WebSocket server initialized");
};

/**
 * Get the Socket.IO server instance
 */
export const getIO = (): SocketIOServer | null => io;

/**
 * Emit portfolio update event to all clients in a portfolio room
 */
export const emitPortfolioUpdate = (portfolioId: number, data?: any): void => {
  if (io) {
    io.to(`portfolio:${portfolioId}`).emit("portfolio:update", {
      portfolioId,
      timestamp: new Date().toISOString(),
      ...data,
    });
  }
};

/**
 * Emit price alert triggered event
 */
export const emitAlertTriggered = (data: {
  ticker: string;
  currentPrice: number;
  targetPrice: number;
  condition: string;
  telegramId?: number;
}): void => {
  if (io) {
    io.emit("alert:triggered", {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Emit market briefing event (morning/evening)
 */
export const emitMarketBriefing = (type: "morning" | "evening", message: string): void => {
  if (io) {
    io.emit("market:briefing", {
      type,
      message,
      timestamp: new Date().toISOString(),
    });
  }
};
