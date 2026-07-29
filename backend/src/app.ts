import express from "express";
import cors from "cors";
import helmet from "helmet";
import { pinoHttp } from "pino-http";

import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { requestId } from "./common/middleware/request-id.js";
import { notFoundHandler } from "./common/middleware/not-found.js";
import { errorHandler } from "./common/middleware/error-handler.js";
import { healthRouter } from "./modules/health/health.routes.js";

export const app = express();

app.disable("x-powered-by");

app.use(requestId);
app.use(pinoHttp({ logger }));

app.use(helmet());

app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));

app.use(express.json({ limit: "1mb" }));

app.use(express.urlencoded({ extended: false, limit: "1mb" }));

app.get("/", (req, res) =>
  res
    .status(200)
    .json({
      success: true,
      data: { service: env.APP_NAME, message: "ParkEase API is running" },
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
    }),
);

app.use("/health", healthRouter);

app.use(notFoundHandler);
app.use(errorHandler);
