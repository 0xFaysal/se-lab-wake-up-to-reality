import express from "express";
import cors from "cors";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { UserRoleType } from "../generated/prisma/client.js";

import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { requestId } from "./common/middleware/request-id.js";
import { csrfProtection } from "./common/middleware/csrf-protection.js";
import { notFoundHandler } from "./common/middleware/not-found.js";
import { errorHandler } from "./common/middleware/error-handler.js";
import { authenticate } from "./common/middleware/auth.js";
import { requireAccountReady } from "./common/middleware/require-account-ready.js";
import { requireRole } from "./common/middleware/require-role.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";
import { vehicleRouter } from "./modules/vehicles/vehicle.routes.js";
import { propertyRouter } from "./modules/properties/property.routes.js";
import { adminPropertyRouter } from "./modules/admin/properties/admin-property.routes.js";
import { adminOperationsRouter } from "./modules/admin/operations/admin-operations.routes.js";
import { adminControlRouter } from "./modules/admin/control/admin-control.routes.js";
import { guardAssignmentRouter } from "./modules/guard-assignments/guard-assignment.routes.js";
import { propertyGovernanceRouter } from "./modules/property-governance/property-governance.routes.js";
import { managerDelegationRouter } from "./modules/manager-delegations/manager-delegation.routes.js";
import { propertyImageRouter } from "./modules/property-images/property-image.routes.js";
import { marketplaceRouter } from "./modules/marketplace/marketplace.routes.js";
import { paymentRouter } from "./modules/payments/payment.routes.js";
import { enqueueDueEmailCampaigns, processEmailDeliveryBatch } from "./modules/admin/control/email-management.service.js";
import { swaggerSpec } from "./config/swagger.js";

export const app = express();

app.disable("x-powered-by"); // Disable the X-Powered-By header for security reasons

// Set up trust proxy if the app is behind a reverse proxy (e.g., Nginx, Heroku, etc.)
if (env.TRUST_PROXY_HOPS > 0) {
  app.set("trust proxy", env.TRUST_PROXY_HOPS);
}

const getClientIp = (req: express.Request) =>
  req.ip || req.socket.remoteAddress || "unknown";

app.use(requestId); // Assign a unique request ID to each incoming request for better traceability

// Set up Pino HTTP logger middleware for logging incoming requests and responses
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

app.use(helmet()); // Set security-related HTTP headers using Helmet

app.use(cors({ origin: env.CORS_ORIGIN, credentials: true })); // Enable Cross-Origin Resource Sharing (CORS) for the specified origin with credentials support

app.use(cookieParser()); // Parse cookies from incoming requests and populate req.cookies

app.use(express.json({ limit: "32kb" })); // Parse incoming JSON requests with a size limit of 32kb and populate req.body

app.use(express.urlencoded({ extended: false, limit: "32kb" })); // Parse incoming URL-encoded requests with a size limit of 32kb and populate req.body

app.use(csrfProtection); // Apply CSRF protection middleware to prevent Cross-Site Request Forgery attacks

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

/**
 * Internal email worker tick — called by Vercel Cron (or any external scheduler)
 * every minute to process due email campaigns and send queued deliveries.
 *
 * Protected by a shared secret (CRON_SECRET env var) so random internet traffic
 * cannot trigger mass email sends. Vercel Cron sends this header automatically
 * when CRON_SECRET is configured in the dashboard.
 */
app.post("/internal/email-worker/tick", async (req, res) => {
  const cronSecret = process.env["CRON_SECRET"];
  const authHeader = req.header("authorization");
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const scheduled = await enqueueDueEmailCampaigns();
    const deliveries = await processEmailDeliveryBatch();
    logger.info({ scheduled, deliveries }, "Email worker tick completed");
    res.status(200).json({ success: true, data: { scheduled, deliveries } });
  } catch (error) {
    logger.error({ error }, "Email worker tick failed");
    res.status(500).json({ success: false, error: "Email worker tick failed" });
  }
});

app.use("/health", healthRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/vehicles", vehicleRouter);
app.use("/api/v1", paymentRouter);
// Marketplace owns the nested parking-resource routes below /provider/properties.
// Mount it before the Property router so delegated Managers reach its scoped
// permission checks instead of being rejected by the Provider-only router.
app.use("/api/v1", marketplaceRouter);
app.use("/api/v1/provider/properties", propertyRouter);
app.use("/api/v1/owner/properties", propertyRouter);
app.use(
  "/api/v1/properties",
  authenticate,
  requireAccountReady,
  requireRole(UserRoleType.PROVIDER, UserRoleType.MANAGER, UserRoleType.ADMIN),
  propertyImageRouter,
);
app.use("/api/v1", guardAssignmentRouter);
app.use("/api/v1/admin", adminOperationsRouter);
app.use("/api/v1/admin", adminControlRouter);
app.use("/api/v1/admin/properties", adminPropertyRouter);
app.use("/api/v1", propertyGovernanceRouter);
app.use("/api/v1", managerDelegationRouter);

app.use(notFoundHandler);
app.use(errorHandler);
