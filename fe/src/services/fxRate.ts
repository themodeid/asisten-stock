"use client";

import { useState, useEffect } from "react";
import { api } from "@/services/api";

interface FxRateInfo {
  rate: number;
  source: string;
  updatedAt: string;
  isLive: boolean;
}

// Default fallback rate
const FALLBACK_RATE = 16250;

// Module-level cache
let cachedRate: number | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Fetch the current USD/IDR rate from backend API with client-side caching.
 */
export async function fetchFxRate(): Promise<number> {
  // Return cached value if still fresh
  if (cachedRate && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedRate;
  }

  try {
    const res = await api.get("/market/fx-rate");
    if (res.data?.data?.rate) {
      const rate = Number(res.data.data.rate);
      cachedRate = rate;
      cacheTimestamp = Date.now();
      return rate;
    }
  } catch (err) {
    console.warn("Failed to fetch FX rate, using fallback:", err);
  }

  return cachedRate ?? FALLBACK_RATE;
}

/**
 * React hook to get the current USD/IDR exchange rate.
 * Fetches from API on mount and caches for 30 minutes.
 */
export function useFxRate(): { rate: number; isLoading: boolean } {
  const [rate, setRate] = useState<number>(cachedRate || FALLBACK_RATE);
  const [isLoading, setIsLoading] = useState(!cachedRate);

  useEffect(() => {
    fetchFxRate().then((r) => {
      setRate(r);
      setIsLoading(false);
    });
  }, []);

  return { rate, isLoading };
}
