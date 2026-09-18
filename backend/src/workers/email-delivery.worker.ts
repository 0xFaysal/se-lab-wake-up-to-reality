import { logger } from "../config/logger.js";
import { prisma } from "../config/prisma.js";
import {
  enqueueDueEmailCampaigns,
  processEmailDeliveryBatch,
} from "../modules/admin/control/email-management.service.js";

async function main() {
  const scheduled = await enqueueDueEmailCampaigns();
  const deliveries = await processEmailDeliveryBatch();
  logger.info({ scheduled, deliveries }, "Email delivery worker run completed");
}

main()
  .catch((error: unknown) => {
    logger.error({ error }, "Email delivery worker run failed");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
