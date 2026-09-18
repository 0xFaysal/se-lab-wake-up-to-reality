import { Router } from "express";
import { UserRoleType } from "../../../../generated/prisma/client.js";
import { authenticate } from "../../../common/middleware/auth.js";
import { requireAccountReady } from "../../../common/middleware/require-account-ready.js";
import { requireRole } from "../../../common/middleware/require-role.js";
import { validate } from "../../../common/middleware/validate.js";
import * as controller from "./admin-operations.controller.js";
import * as schema from "./admin-operations.schema.js";

export const adminOperationsRouter = Router();

adminOperationsRouter.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
adminOperationsRouter.use(
  authenticate,
  requireAccountReady,
  requireRole(UserRoleType.ADMIN),
);

adminOperationsRouter.get("/dashboard/summary", controller.dashboardSummary);
adminOperationsRouter.get("/users", validate(schema.adminUsersQuerySchema), controller.listUsers);
adminOperationsRouter.get("/users/:id", validate(schema.adminEntityIdSchema), controller.getUser);
adminOperationsRouter.get("/properties", validate(schema.adminPropertiesQuerySchema), controller.listProperties);
adminOperationsRouter.get("/bookings", validate(schema.adminBookingsQuerySchema), controller.listBookings);
adminOperationsRouter.get("/bookings/:id", validate(schema.adminEntityIdSchema), controller.getBooking);
adminOperationsRouter.get("/sessions", validate(schema.adminSessionsQuerySchema), controller.listSessions);
adminOperationsRouter.get("/payments", validate(schema.adminPaymentsQuerySchema), controller.listPayments);
adminOperationsRouter.get("/payments/:id", validate(schema.adminEntityIdSchema), controller.getPayment);
adminOperationsRouter.get("/refunds", validate(schema.adminRefundsQuerySchema), controller.listRefunds);
adminOperationsRouter.get("/ledger/transactions", validate(schema.adminLedgerQuerySchema), controller.listLedger);
adminOperationsRouter.get("/ledger/transactions/:id", validate(schema.adminEntityIdSchema), controller.getLedgerTransaction);
adminOperationsRouter.get("/audit-events", validate(schema.adminAuditQuerySchema), controller.listAuditEvents);
adminOperationsRouter.get("/audit-events/:id", validate(schema.adminEntityIdSchema), controller.getAuditEvent);
adminOperationsRouter.get("/reviews", validate(schema.adminReviewsQuerySchema), controller.listReviews);
adminOperationsRouter.get("/system/health", controller.systemHealth);
adminOperationsRouter.get("/settings/capabilities", controller.capabilities);
