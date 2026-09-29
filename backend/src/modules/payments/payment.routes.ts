import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { z } from "zod";
import { authenticate } from "../../common/middleware/auth.js";
import { requireAccountReady } from "../../common/middleware/require-account-ready.js";
import { requireRole } from "../../common/middleware/require-role.js";
import { sensitiveAccountRateLimit } from "../../common/middleware/rate-limit.js";
import { UserRoleType } from "../../../generated/prisma/client.js";
import { env } from "../../config/env.js";
import * as service from "./payment.service.js";

export const paymentRouter = Router();
const uuid = z.uuid();
const idempotencyKey = z.string().trim().min(8).max(100);

function respond(req: Request, res: Response, data: unknown, status = 200) {
  res.status(status).json({
    success: true,
    data,
    meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
  });
}

function action(
  handler: (req: Request, res: Response) => Promise<unknown>,
  status = 200,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await handler(req, res);
      if (!res.headersSent) respond(req, res, data, status);
    } catch (error) {
      next(error);
    }
  };
}

const callbackSchema = z
  .object({
    tran_id: z.string().min(1).max(30),
    val_id: z.string().min(1).max(200).optional(),
  })
  .passthrough();
const frontendBaseUrl = () => env.FRONTEND_BASE_URL ?? env.CORS_ORIGIN;

paymentRouter.post(
  "/payments/sslcommerz/ipn",
  action(async (req, res) => {
    const payload = callbackSchema.parse(req.body);
    if (payload.val_id)
      await service.validateAndCaptureSslCommerz(
        payload.tran_id,
        payload.val_id,
      );
    res.status(200).send("OK");
  }),
);

paymentRouter.all(
  "/payments/sslcommerz/success",
  action(async (req, res) => {
    const payload = callbackSchema.parse({ ...req.query, ...req.body });
    const payment = payload.val_id
      ? await service.validateAndCaptureSslCommerz(
          payload.tran_id,
          payload.val_id,
        )
      : null;
    const paymentId =
      payment?.id ??
      (await service.findPaymentIdByTransaction(payload.tran_id)) ??
      "";
    res.redirect(
      303,
      `${frontendBaseUrl()}/driver/payments/return?paymentId=${encodeURIComponent(paymentId)}`,
    );
  }),
);

paymentRouter.all(
  "/payments/sslcommerz/fail",
  action(async (req, res) => {
    const payload = callbackSchema.parse({ ...req.query, ...req.body });
    const paymentId = await service.recordGatewayExit(
      payload.tran_id,
      "FAILED",
    );
    res.redirect(
      303,
      `${frontendBaseUrl()}/driver/payments/return?result=failed${paymentId ? `&paymentId=${encodeURIComponent(paymentId)}` : ""}`,
    );
  }),
);

paymentRouter.all(
  "/payments/sslcommerz/cancel",
  action(async (req, res) => {
    const payload = callbackSchema.parse({ ...req.query, ...req.body });
    const paymentId = await service.recordGatewayExit(
      payload.tran_id,
      "CANCELLED",
    );
    res.redirect(
      303,
      `${frontendBaseUrl()}/driver/payments/return?result=cancelled${paymentId ? `&paymentId=${encodeURIComponent(paymentId)}` : ""}`,
    );
  }),
);

const requireDriverAuth = [
  authenticate,
  requireAccountReady,
  requireRole(UserRoleType.DRIVER),
];

paymentRouter.post(
  "/bookings/:bookingId/payments/sslcommerz/session",
  ...requireDriverAuth,
  sensitiveAccountRateLimit,
  action(async (req) => {
    const bookingId = uuid.parse(req.params.bookingId);
    const key = idempotencyKey.parse(
      req.header("idempotency-key") ?? req.body?.idempotencyKey,
    );
    const useWallet = req.body?.useWallet !== false;
    return service.initiateSslCommerzSession(
      req.auth!.userId,
      bookingId,
      key,
      useWallet,
    );
  }, 201),
);

paymentRouter.post(
  "/bookings/:bookingId/settlement/payments/sslcommerz/session",
  ...requireDriverAuth,
  sensitiveAccountRateLimit,
  action(async (req) => {
    const bookingId = uuid.parse(req.params.bookingId);
    const key = idempotencyKey.parse(
      req.header("idempotency-key") ?? req.body?.idempotencyKey,
    );
    return service.initiateSettlementSession(req.auth!.userId, bookingId, key);
  }, 201),
);

paymentRouter.get(
  "/payments/:paymentId",
  ...requireDriverAuth,
  action(async (req) =>
    service.getDriverPayment(
      req.auth!.userId,
      uuid.parse(req.params.paymentId),
    ),
  ),
);

paymentRouter.get(
  "/refunds/:refundId",
  ...requireDriverAuth,
  action(async (req) =>
    service.getAndReconcileDriverRefund(
      req.auth!.userId,
      uuid.parse(req.params.refundId),
    ),
  ),
);
