import { logger } from "../config/logger.js";
import {
  enqueueDueEmailCampaigns,
  processEmailDeliveryBatch,
} from "../modules/admin/control/email-management.service.js";

export type EmailDeliveryWorker = {
  stop: () => Promise<void>;
};

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

export function startEmailDeliveryWorker(pollIntervalMs: number): EmailDeliveryWorker {
  let stopping = false;
  let running = false;
  let timer: NodeJS.Timeout | undefined;

  async function run() {
    if (stopping || running) return;
    running = true;
    try {
      const scheduled = await enqueueDueEmailCampaigns();
      const deliveries = await processEmailDeliveryBatch();
      if (scheduled.campaigns > 0 || deliveries.processed > 0 || deliveries.recovered > 0) {
        logger.info({ scheduled, deliveries }, "Email delivery worker batch completed");
      }
    } catch (error) {
      logger.error({ error }, "Email delivery worker batch failed");
    } finally {
      running = false;
      if (!stopping) timer = setTimeout(() => void run(), pollIntervalMs);
    }
  }

  logger.info({ pollIntervalMs }, "Email delivery worker started");
  void run();

  return {
    async stop() {
      stopping = true;
      if (timer) clearTimeout(timer);
      while (running) await wait(25);
      logger.info("Email delivery worker stopped");
    },
  };
}
