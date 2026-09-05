import Redis from "ioredis";
import { ENV } from "../config/env";

interface MemoryCacheEntry {
  data: any;
  expiresAt: number;
}

class CacheManager {
  private memoryCache = new Map<string, MemoryCacheEntry>();
  private redisClient: Redis | null = null;
  private isRedisConnected = false;

  constructor() {
    this.initRedis();
    // Periodic memory cleanup every 2 minutes
    setInterval(() => this.cleanupMemoryCache(), 2 * 60 * 1000);
  }

  private initRedis() {
    if (!ENV.USE_REDIS && !process.env.REDIS_URL) {
      return;
    }

    try {
      this.redisClient = new Redis(ENV.REDIS_URL, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          if (times > 3) return null; // Don't spam reconnects if Redis isn't installed
          return Math.min(times * 1000, 3000);
        },
      });

      this.redisClient.on("connect", () => {
        this.isRedisConnected = true;
        console.log("⚡ [Cache] Redis connected successfully. Distributed L2 cache active.");
      });

      this.redisClient.on("error", (err) => {
        this.isRedisConnected = false;
        // Suppress noisy logs, silently fall back to L1 in-memory cache
      });

      this.redisClient.connect().catch(() => {
        this.isRedisConnected = false;
      });
    } catch {
      this.isRedisConnected = false;
    }
  }

  public async get<T>(key: string): Promise<T | null> {
    // 1. Check L1 Memory Cache first (sub-millisecond)
    const memEntry = this.memoryCache.get(key);
    if (memEntry) {
      if (memEntry.expiresAt > Date.now()) {
        return memEntry.data as T;
      }
      this.memoryCache.delete(key);
    }

    // 2. Check L2 Redis Cache if connected
    if (this.isRedisConnected && this.redisClient) {
      try {
        const raw = await this.redisClient.get(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          // Backfill L1 Memory Cache for subsequent instant reads
          this.memoryCache.set(key, {
            data: parsed,
            expiresAt: Date.now() + 60 * 1000,
          });
          return parsed as T;
        }
      } catch {
        // Fallback to null
      }
    }

    return null;
  }

  public async set(key: string, value: any, ttlSeconds: number = 60): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;

    // Save to L1 Memory Cache
    this.memoryCache.set(key, {
      data: value,
      expiresAt,
    });

    // Save to L2 Redis Cache if connected
    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.set(key, JSON.stringify(value), "EX", ttlSeconds);
      } catch {
        // Ignore Redis set errors
      }
    }
  }

  public async del(key: string): Promise<void> {
    this.memoryCache.delete(key);
    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.del(key);
      } catch {
        //
      }
    }
  }

  private cleanupMemoryCache() {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiresAt <= now) {
        this.memoryCache.delete(key);
      }
    }
  }
}

export const cache = new CacheManager();
