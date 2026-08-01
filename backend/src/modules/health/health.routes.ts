import { Router } from "express";
import { prisma } from "../../config/prisma.js";
import { redis } from "../../config/redis.js";


export const healthRouter = Router();


healthRouter.get("/live", (_req, res) =>
  res
    .status(200)
    .json({
      success: true,
      data: { status: "alive", uptimeSeconds: Math.floor(process.uptime()) },
      meta: { timestamp: new Date().toISOString() },
    }),
);


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
