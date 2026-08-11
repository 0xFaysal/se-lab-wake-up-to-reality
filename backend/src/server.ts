import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { prisma } from "./config/prisma.js";
import { connectRedis, redis } from "./config/redis.js";

async function bootstrap() {
  await prisma.$connect();

  logger.info("PostgreSQL connected");

  await connectRedis();

  logger.info("Redis connected");

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
