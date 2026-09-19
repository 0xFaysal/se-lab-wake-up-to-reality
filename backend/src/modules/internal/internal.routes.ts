import { createHash, timingSafeEqual } from "node:crypto";
import { Router } from "express";

import { AppError } from "../../common/errors/app-error.js";
import { env } from "../../config/env.js";
import {
  enqueueDueEmailCampaigns,
  processEmailDeliveryBatch,
} from "../admin/control/email-management.service.js";

export const internalRouter = Router();

function matchesCronSecret(value: string | undefined) {
  const expected = env.EMAIL_WORKER_CRON_SECRET;
  if (!value || !expected) return false;

  const suppliedDigest = createHash("sha256").update(value).digest();
  const expectedDigest = createHash("sha256").update(expected).digest();
  return timingSafeEqual(suppliedDigest, expectedDigest);
}

internalRouter.post("/jobs/email-delivery", async (req, res) => {
  const authorization = req.header("authorization");
  const suppliedSecret = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : undefined;

  if (!matchesCronSecret(suppliedSecret)) {
    throw new AppError({
      statusCode: 401,
      code: "INTERNAL_JOB_UNAUTHORIZED",
      message: "Internal job authorization failed",
    });
  }

  const scheduled = await enqueueDueEmailCampaigns();
  const deliveries = await processEmailDeliveryBatch();

  res.status(200).json({
    success: true,
    data: { scheduled, deliveries },
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  });
});
