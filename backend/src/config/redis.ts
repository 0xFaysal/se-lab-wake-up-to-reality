import { createClient } from "redis";
import { env } from "./env.js";
import { logger } from "./logger.js";

export const redis = createClient({
  url: env.REDIS_URL,
  disableOfflineQueue: true,
  socket: {
    connectTimeout: 3_000,
    // In serverless (Vercel), connections are dropped between invocations.
    // Cap retries so a bad URL fails fast instead of hanging the function.
    reconnectStrategy: (retries) => {
      if (retries >= 1)
        return new Error("Redis reconnect failed after bounded attempts");
      return Math.min(retries * 200, 1000);
    },
  },
});

redis.on("error", (error) => logger.error({ error }, "Redis client error"));

redis.on("reconnecting", () => logger.warn("Redis reconnecting"));

/**
 * Ensure the Redis client is connected.
 *
 * Safe to call on every request in serverless environments — the client
 * caches the connection and reconnects only when the socket has been
 * dropped (e.g. after a Vercel idle timeout).
 */
let connectionPromise: Promise<void> | undefined;

export async function connectRedis() {
  if (connectionPromise) return connectionPromise;
  // An open socket owns its reconnect handshake; calling connect again throws.
  if (redis.isOpen) return;
  connectionPromise = redis
    .connect()
    .then(() => undefined)
    .finally(() => {
      connectionPromise = undefined;
    });
  return connectionPromise;
}
