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
import { app } from "../src/app.js";
import { prisma } from "../src/config/prisma.js";
import { connectRedis } from "../src/config/redis.js";

/** Cached initialisation promise — resolved once per cold start. */
let initPromise: Promise<void> | undefined;

function getInitPromise(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      await prisma.$connect();
      await connectRedis();
    })();
  }
  return initPromise;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  await getInitPromise();
  // Express accepts Node's raw IncomingMessage / ServerResponse
  app(req, res);
}
