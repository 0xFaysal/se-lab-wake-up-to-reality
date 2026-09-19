import { prisma } from "./prisma.js";
import { connectRedis } from "./redis.js";

let initializationPromise: Promise<void> | undefined;

export async function ensureInfrastructure() {
  if (!initializationPromise) {
    initializationPromise = Promise.all([prisma.$connect(), connectRedis()])
      .then(() => undefined)
      .catch((error: unknown) => {
        initializationPromise = undefined;
        throw error;
      });
  }

  await initializationPromise;
}
