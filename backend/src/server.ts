import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { prisma } from "./config/prisma.js";
import { redis } from "./config/redis.js";
import { ensureInfrastructure } from "./config/infrastructure.js";
import { startEmailDeliveryWorker } from "./workers/email-delivery.runner.js";

async function bootstrap() {
  await ensureInfrastructure();

  logger.info("PostgreSQL and Redis connected");

  const emailWorker = env.EMAIL_WORKER_ENABLED
    ? startEmailDeliveryWorker(env.EMAIL_WORKER_POLL_INTERVAL_MS)
    : null;

  const server = app.listen(env.PORT, () => {
    logger.info(
      { port: env.PORT, environment: env.NODE_ENV },
      `${env.APP_NAME} started`,
    );

    if (env.ENABLE_API_DOCS) {
      const publicUrl = env.API_PUBLIC_URL ?? `http://localhost:${env.PORT}`;
      logger.info(
        { url: `${publicUrl}/api-docs` },
        "Swagger documentation available",
      );
    }
  });

  let shuttingDown = false;

  async function shutdown(signal: string) {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.info({ signal }, "Graceful shutdown started");
    server.close(async (closeError) => {
      if (emailWorker) await emailWorker.stop();
      await Promise.allSettled([
        prisma.$disconnect(),
        redis.isOpen ? redis.quit() : Promise.resolve(),
      ]);
      logger.info("Graceful shutdown completed");
      process.exit(closeError ? 1 : 0);
    });

    setTimeout(() => {
      logger.fatal("Forced shutdown");
      process.exit(1);
    }, 10000).unref();
  }

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

bootstrap().catch(async (error) => {
  logger.fatal({ error }, "Application startup failed");

  await Promise.allSettled([
    prisma.$disconnect(),
    redis.isOpen ? redis.quit() : Promise.resolve(),
  ]);
  process.exit(1);
});
