import type { NextFunction, Request, Response } from "express";
import * as service from "./admin-operations.service.js";

function parameter(req: Request): string {
  const value = req.params.id;
  if (typeof value !== "string") throw new Error("Missing route identifier");
  return value;
}

function action(handler: (req: Request) => Promise<unknown> | unknown) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await handler(req);
      res.status(200).json({
        success: true,
        data,
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const dashboardSummary = action(() => service.getDashboardSummary());
export const listUsers = action((req) =>
  service.listAdminUsers(req.query as never),
);
export const getUser = action((req) => service.getAdminUser(parameter(req)));
export const listProperties = action((req) =>
  service.listAdminProperties(req.query as never),
);
export const listBookings = action((req) =>
  service.listAdminBookings(req.query as never),
);
export const getBooking = action((req) =>
  service.getAdminBooking(parameter(req)),
);
export const listSessions = action((req) =>
  service.listAdminSessions(req.query as never),
);
export const listPayments = action((req) =>
  service.listAdminPayments(req.query as never),
);
export const getPayment = action((req) =>
  service.getAdminPayment(parameter(req)),
);
export const listRefunds = action((req) =>
  service.listAdminRefunds(req.query as never),
);
export const listLedger = action((req) =>
  service.listAdminLedger(req.query as never),
);
export const getLedgerTransaction = action((req) =>
  service.getAdminLedgerTransaction(parameter(req)),
);
export const listAuditEvents = action((req) =>
  service.listAdminAuditEvents(req.query as never),
);
export const getAuditEvent = action((req) =>
  service.getAdminAuditEvent(parameter(req)),
);
export const listReviews = action((req) =>
  service.listAdminReviews(req.query as never),
);
export const systemHealth = action(() => service.getAdminSystemHealth());
export const capabilities = action(() => service.getAdminCapabilities());
