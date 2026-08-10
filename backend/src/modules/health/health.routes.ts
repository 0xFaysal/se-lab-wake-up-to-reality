import { Router } from "express";
import { prisma } from "../../config/prisma.js";
import { redis } from "../../config/redis.js";


export const healthRouter = Router();

/**
 * @openapi
 * /health/live:
 *   get:
 *     tags: [Health]
 *     summary: Check API process health
 *     operationId: getLiveness
 *     description: Returns successfully when the ParkEase API process is alive.
 *     responses:
 *       200:
 *         description: API process is alive.
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
 *                     status:
 *                       type: string
 *                       enum: [alive]
 *                     uptimeSeconds:
 *                       type: integer
 *                       minimum: 0
 *                   required: [status, uptimeSeconds]
 *                 meta:
 *                   $ref: '#/components/schemas/Meta'
 *               required: [success, data, meta]
 */
healthRouter.get("/live", (_req, res) =>
  res
    .status(200)
    .json({
      success: true,
      data: { status: "alive", uptimeSeconds: Math.floor(process.uptime()) },
      meta: { timestamp: new Date().toISOString() },
    }),
);

/**
 * @openapi
 * /health/ready:
 *   get:
 *     tags: [Health]
 *     summary: Check API readiness
 *     operationId: getReadiness
 *     description: Checks PostgreSQL and Redis connectivity.
 *     responses:
 *       200:
 *         description: API dependencies are ready.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReadinessResponse'
 *       503:
 *         description: One or more required dependencies are unavailable.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReadinessResponse'
 */
healthRouter.get("/ready", async (req, res) => {

  const checks = { postgres: false, redis: false };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.postgres = true;

  } catch {}


  try {
    checks.redis = (await redis.ping()) === "PONG";
  } catch {}

  
  const ready = checks.postgres && checks.redis;
  res
    .status(ready ? 200 : 503)
    .json({
      success: ready,
      data: { status: ready ? "ready" : "not_ready", checks },
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
    });
});
