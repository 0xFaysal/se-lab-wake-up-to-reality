import { logger } from "../config/logger.js";
import { reconcileMarketplaceLifecycle } from "../modules/marketplace/marketplace.service.js";

const POLL_INTERVAL_MS = 60_000;

export type BookingLifecycleWorker = {
  stop: () => Promise<void>;
};

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

export function startBookingLifecycleWorker(): BookingLifecycleWorker {
  let stopping = false;
  let running = false;
  let timer: NodeJS.Timeout | undefined;

  async function run() {
    if (stopping || running) return;
    running = true;
    try {
      const result = await reconcileMarketplaceLifecycle();
      if (
        result.expiredHolds > 0 ||
        result.expiredBookings.processed > 0 ||
        result.noShows.processed > 0 ||
        result.expiredCredentials > 0
      )
        logger.info(result, "Marketplace lifecycle reconciled");
    } catch (error) {
      logger.error({ error }, "Booking lifecycle worker batch failed");
    } finally {
      running = false;
      if (!stopping) timer = setTimeout(() => void run(), POLL_INTERVAL_MS);
    }
  }

  logger.info(
    { pollIntervalMs: POLL_INTERVAL_MS },
    "Booking lifecycle worker started",
  );
  void run();

  return {
    async stop() {
      stopping = true;
      if (timer) clearTimeout(timer);
      while (running) await wait(25);
      logger.info("Booking lifecycle worker stopped");
    },
  };
}
