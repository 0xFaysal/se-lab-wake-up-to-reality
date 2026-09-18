import { logger } from "../config/logger.js";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { startEmailDeliveryWorker } from "./email-delivery.runner.js";

async function main() {
  await prisma.$connect();
  const worker = startEmailDeliveryWorker(env.EMAIL_WORKER_POLL_INTERVAL_MS);
  await new Promise<void>((resolve) => {
    process.once("SIGINT", resolve);
    process.once("SIGTERM", resolve);
  });
  await worker.stop();
}

main()
  .catch((error: unknown) => {
    logger.error({ error }, "Email delivery worker run failed");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
