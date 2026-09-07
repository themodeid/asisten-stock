"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

let socketInstance: Socket | null = null;

/**
 * Get or create the Socket.IO client singleton.
 * Connects to the backend WebSocket server.
 */
function getSocket(): Socket {
  if (!socketInstance) {
    const backendUrl =
      typeof window !== "undefined" && window.location.hostname !== "localhost"
        ? `http://${window.location.hostname}:3050`
        : "http://localhost:3050";

    socketInstance = io(backendUrl, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    });

    socketInstance.on("connect", () => {
      console.log("🔌 WebSocket connected:", socketInstance?.id);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("🔌 WebSocket disconnected:", reason);
    });
  }
  return socketInstance;
}

/**
 * Hook to subscribe to portfolio real-time updates.
 * Automatically joins the portfolio room and listens for updates.
 */
export function usePortfolioUpdates(
  portfolioId: number,
  onUpdate: (data: any) => void
) {
  const callbackRef = useRef(onUpdate);
  callbackRef.current = onUpdate;

  useEffect(() => {
    const socket = getSocket();

    // Join the portfolio room
    socket.emit("join:portfolio", portfolioId);

    const handler = (data: any) => {
      callbackRef.current(data);
    };

    socket.on("portfolio:update", handler);

    return () => {
      socket.off("portfolio:update", handler);
    };
  }, [portfolioId]);
}

/**
 * Hook to subscribe to price alert notifications.
 */
export function useAlertNotifications(
  onAlert: (data: {
    ticker: string;
    currentPrice: number;
    targetPrice: number;
    condition: string;
  }) => void
) {
  const callbackRef = useRef(onAlert);
  callbackRef.current = onAlert;

  useEffect(() => {
    const socket = getSocket();

    const handler = (data: any) => {
      callbackRef.current(data);
    };

    socket.on("alert:triggered", handler);

    return () => {
      socket.off("alert:triggered", handler);
    };
  }, []);
}

/**
 * Hook to subscribe to market briefings (morning/evening).
 */
export function useMarketBriefing(
  onBriefing: (data: { type: "morning" | "evening"; message: string }) => void
) {
  const callbackRef = useRef(onBriefing);
  callbackRef.current = onBriefing;

  useEffect(() => {
    const socket = getSocket();

    const handler = (data: any) => {
      callbackRef.current(data);
    };

    socket.on("market:briefing", handler);

    return () => {
      socket.off("market:briefing", handler);
    };
  }, []);
}
