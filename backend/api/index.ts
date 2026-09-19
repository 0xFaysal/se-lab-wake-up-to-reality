import type { Request, Response } from "express";

import { app } from "../src/app.js";
import { ensureInfrastructure } from "../src/config/infrastructure.js";
import { logger } from "../src/config/logger.js";

export default async function handler(req: Request, res: Response) {
  try {
    await ensureInfrastructure();
    app(req, res);
  } catch (error) {
    logger.error({ error }, "Serverless infrastructure initialization failed");

    if (!res.headersSent) {
      res.status(503).json({
        success: false,
        error: {
          code: "SERVICE_DEPENDENCY_UNAVAILABLE",
          message: "The service is temporarily unavailable",
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }
  }
}
