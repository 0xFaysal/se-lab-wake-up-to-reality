import { createClient } from "redis";
import { env } from "./env.js";
import { logger } from "./logger.js";

export const redis = createClient({
  url: env.REDIS_URL,
  socket: {
    connectTimeout: 5_000,
    reconnectStrategy: (retries) => {
      if (retries >= 3) return new Error("Redis reconnect limit reached");
      return Math.min(100 * 2 ** retries, 1_000);
    },
  },
});

let connectionPromise: Promise<void> | undefined;

redis.on("error", (error) => logger.error({ error }, "Redis client error"));

redis.on("reconnecting", () => logger.warn("Redis reconnecting"));

export async function connectRedis() {
  if (redis.isReady) return;

  if (!connectionPromise) {
    connectionPromise = (
      redis.isOpen ? Promise.resolve() : redis.connect().then(() => undefined)
    ).finally(() => {
      connectionPromise = undefined;
    });
  }

  await connectionPromise;
}
