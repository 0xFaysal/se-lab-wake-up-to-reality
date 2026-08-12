import { Router } from "express";
import { UserRoleType } from "../../../generated/prisma/client.js";
import { authenticate } from "../../common/middleware/auth.js";
import { requireAccountReady } from "../../common/middleware/require-account-ready.js";
import { requireRole } from "../../common/middleware/require-role.js";
import { validate } from "../../common/middleware/validate.js";
import {
  acceptGuardAssignmentController,
  getGuardAssignmentController,
  listGuardAssignmentsController,
  rejectGuardAssignmentController,
} from "./guard-assignment.controller.js";
import {
  guardAssignmentIdParamSchema,
  listGuardAssignmentsQuerySchema,
  rejectGuardAssignmentSchema,
} from "./guard-assignment.schema.js";

export const guardAssignmentRouter = Router();

guardAssignmentRouter.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
guardAssignmentRouter.use(authenticate, requireRole(UserRoleType.GUARD));

/**
 * @openapi
 * /api/v1/guard/assignments:
 *   get:
 *     tags: [Guard Assignments]
 *     summary: List the authenticated Guard's own assignments
 *     operationId: listGuardAssignments
 *     security: [{ accessCookie: [] }]
 *     parameters:
 *       - { name: status, in: query, schema: { $ref: '#/components/schemas/GuardAssignmentStatus' } }
 *       - { name: page, in: query, schema: { type: integer, minimum: 1, default: 1 } }
 *       - { name: limit, in: query, schema: { type: integer, minimum: 1, maximum: 100, default: 20 } }
 *     responses:
 *       200:
 *         description: Only assignments addressed to the authenticated Guard.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/GuardAssignmentListResponse' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
guardAssignmentRouter.get(
  "/assignments",
  validate(listGuardAssignmentsQuerySchema),
  listGuardAssignmentsController,
);

/**
 * @openapi
 * /api/v1/guard/assignments/{assignmentId}:
 *   get:
 *     tags: [Guard Assignments]
 *     summary: Get the authenticated Guard's assignment
 *     operationId: getGuardAssignment
 *     security: [{ accessCookie: [] }]
 *     parameters:
 *       - { name: assignmentId, in: path, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Guard-facing Property and assignment details.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/GuardAssignmentResponse' }
 *       404: { description: Assignment was not found for this Guard. }
 */
guardAssignmentRouter.get(
  "/assignments/:assignmentId",
  validate(guardAssignmentIdParamSchema),
  getGuardAssignmentController,
);

/**
 * @openapi
 * /api/v1/guard/assignments/{assignmentId}/accept:
 *   post:
 *     tags: [Guard Assignments]
 *     summary: Accept a pending assignment
 *     description: Requires completed password setup, mandatory email verification, and an ACTIVE Guard account. Phone verification is optional.
 *     operationId: acceptGuardAssignment
 *     security: [{ accessCookie: [] }]
 *     parameters:
 *       - { name: assignmentId, in: path, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Assignment is now ACTIVE.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/GuardAssignmentResponse' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { description: Assignment was not found for this Guard. }
 *       409: { description: Invalid transition or concurrent state conflict. }
 */
guardAssignmentRouter.post(
  "/assignments/:assignmentId/accept",
  requireAccountReady,
  validate(guardAssignmentIdParamSchema),
  acceptGuardAssignmentController,
);

/**
 * @openapi
 * /api/v1/guard/assignments/{assignmentId}/reject:
 *   post:
 *     tags: [Guard Assignments]
 *     summary: Reject a pending assignment
 *     description: An authenticated Guard may reject without completing onboarding; account readiness is required only for acceptance.
 *     operationId: rejectGuardAssignment
 *     security: [{ accessCookie: [] }]
 *     parameters:
 *       - { name: assignmentId, in: path, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/RejectGuardAssignmentRequest' }
 *     responses:
 *       200:
 *         description: Assignment is now CANCELLED.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/GuardAssignmentResponse' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { description: Assignment was not found for this Guard. }
 *       409: { description: Invalid transition or concurrent state conflict. }
 */
guardAssignmentRouter.post(
  "/assignments/:assignmentId/reject",
  validate(rejectGuardAssignmentSchema),
  rejectGuardAssignmentController,
);
