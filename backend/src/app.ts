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

const getClientIp = (req: express.Request) =>
  req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
  req.socket.remoteAddress ||
  "unknown";

app.use(requestId);

app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.requestId,
    customLogLevel: (_req, res, error) => {
      if (error || res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
    customSuccessMessage: (req, res, responseTime) =>
      `${req.method} ${req.url} -> ${res.statusCode} (${responseTime.toFixed(
        0,
      )}ms)`,
    customErrorMessage: (req, res, error) =>
      `${req.method} ${req.url} -> ${res.statusCode} (${error.message})`,
    customProps: (req) => ({
      requestId: req.requestId,
      clientIp: getClientIp(req),
      userAgent: req.header("user-agent") ?? "unknown",
    }),
  }),
);

app.use(helmet());

app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));

app.use(express.json({ limit: "1mb" }));

app.use(express.urlencoded({ extended: false, limit: "1mb" }));

app.get("/", (req, res) =>
  res.status(200).json({
    success: true,
    data: { service: env.APP_NAME, message: "ParkEase API is running" },
    meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
  }),
);

app.use("/health", healthRouter);

app.use(notFoundHandler);
app.use(errorHandler);
