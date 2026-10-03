/**
 * Vercel serverless entry point.
 *
 * Vercel invokes this module as a serverless function for every request.
 * It cannot call app.listen() — instead it exports a handler that Vercel
 * wraps and invokes directly.
 *
 * Connections are initialised lazily on the first cold-start and the
 * Promise is cached so subsequent warm requests skip the await.
 *
 * NOTE: The email delivery worker is intentionally not started here.
 * Vercel terminates the Node.js process after every response, so polling
 * loops (setTimeout) never fire reliably in serverless.  Trigger the
 * worker from a Vercel Cron Job or an external scheduler instead.
 */
import type { IncomingMessage, ServerResponse } from "http";
import { randomUUID } from "node:crypto";
import { app } from "../src/app.js";
import { prisma } from "../src/config/prisma.js";
import { connectRedis } from "../src/config/redis.js";
import { logger } from "../src/config/logger.js";
import {
  initializationErrorMetadata,
  serverInitializationFailure,
} from "../src/common/errors/server-init-error.js";

/** Cached initialisation promise — resolved once per cold start. */
let initPromise: Promise<void> | undefined;

function getInitPromise(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      await prisma.$connect();
    })().catch((err) => {
      initPromise = undefined;
      throw err;
    });
  }
  return initPromise;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    await Promise.all([
      getInitPromise(),
      connectRedis().catch((redisError: unknown) => {
        logger.error(
          { error: initializationErrorMetadata(redisError) },
          "Redis connection unavailable",
        );
      }),
    ]);
    // Express accepts Node's raw IncomingMessage / ServerResponse
    app(req, res);
  } catch (error) {
    const requestId = randomUUID();
    logger.error(
      { requestId, error: initializationErrorMetadata(error) },
      "Server initialization failed",
    );
    if (!res.headersSent) {
      res.statusCode = 503;
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Retry-After", "5");
      res.setHeader("x-request-id", requestId);
      res.end(
        JSON.stringify({
          ...serverInitializationFailure(requestId),
        }),
      );
    }
  }
}
