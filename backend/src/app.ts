import express from "express";
import cors from "cors";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";

import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { requestId } from "./common/middleware/request-id.js";
import { csrfProtection } from "./common/middleware/csrf-protection.js";
import { notFoundHandler } from "./common/middleware/not-found.js";
import { errorHandler } from "./common/middleware/error-handler.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";
import { vehicleRouter } from "./modules/vehicles/vehicle.routes.js";
import { propertyRouter } from "./modules/properties/property.routes.js";
import { swaggerSpec } from "./config/swagger.js";

export const app = express();

app.disable("x-powered-by");

if (env.TRUST_PROXY_HOPS > 0) {
  app.set("trust proxy", env.TRUST_PROXY_HOPS);
}

const getClientIp = (req: express.Request) =>
  req.ip || req.socket.remoteAddress || "unknown";

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

if (env.ENABLE_API_DOCS) {
  app.get("/api-docs.json", (_req, res) => res.status(200).json(swaggerSpec));
  app.use(
    "/api-docs",
    helmet({ contentSecurityPolicy: false }),
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customSiteTitle: "ParkEase BD API Documentation",
      customCss: ".swagger-ui .topbar { display: none }",
      swaggerOptions: {
        persistAuthorization: true,
        withCredentials: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
      },
    }),
  );
}

app.use(helmet());

app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));

app.use(cookieParser());

app.use(express.json({ limit: "32kb" }));

app.use(express.urlencoded({ extended: false, limit: "32kb" }));

app.use(csrfProtection);

/**
 * @openapi
 * /:
 *   get:
 *     tags: [Health]
 *     summary: Get API service information
 *     operationId: getServiceInformation
 *     responses:
 *       200:
 *         description: The API process is running.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   enum: [true]
 *                 data:
 *                   type: object
 *                   properties:
 *                     service:
 *                       type: string
 *                       example: ParkEase API
 *                     message:
 *                       type: string
 *                       example: ParkEase API is running
 *                   required: [service, message]
 *                 meta:
 *                   $ref: '#/components/schemas/Meta'
 *               required: [success, data, meta]
 */
app.get("/", (req, res) =>
  res.status(200).json({
    success: true,
    data: { service: env.APP_NAME, message: "ParkEase API is running" },
    meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
  }),
);

app.use("/health", healthRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/vehicles", vehicleRouter);
app.use("/api/v1/owner/properties", propertyRouter);

app.use(notFoundHandler);
app.use(errorHandler);
