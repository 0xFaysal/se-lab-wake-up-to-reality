import { Router } from "express";
import { UserRoleType } from "../../../generated/prisma/client.js";
import { authenticate } from "../../common/middleware/auth.js";
import { requireAccountReady } from "../../common/middleware/require-account-ready.js";
import { requireRole } from "../../common/middleware/require-role.js";
import { validate } from "../../common/middleware/validate.js";
import {
  endOwnerAssignmentController,
  getOwnerAssignmentController,
  listOwnerAssignmentsController,
  updateOwnerAssignmentController,
} from "./guard-assignment.controller.js";
import {
  guardAssignmentIdParamSchema,
  listOwnerGuardAssignmentsQuerySchema,
  updateGuardAssignmentSchema,
} from "./guard-assignment.schema.js";

export const ownerGuardAssignmentRouter = Router();

ownerGuardAssignmentRouter.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
ownerGuardAssignmentRouter.use(
  authenticate,
  requireAccountReady,
  requireRole(UserRoleType.PARKING_OWNER),
);

/**
 * @openapi
 * /api/v1/owner/guard-assignments:
 *   get:
 *     tags: [Owner Guard Assignments]
 *     summary: List assignments belonging to the Owner's Properties
 *     operationId: listOwnerGuardAssignments
 *     security: [{ accessCookie: [] }]
 *     parameters:
 *       - { name: propertyId, in: query, schema: { type: string, format: uuid } }
 *       - { name: status, in: query, schema: { $ref: '#/components/schemas/GuardAssignmentStatus' } }
 *       - { name: page, in: query, schema: { type: integer, minimum: 1, default: 1 } }
 *       - { name: limit, in: query, schema: { type: integer, minimum: 1, maximum: 100, default: 20 } }
 *     responses:
 *       200:
 *         description: Owner-scoped Guard assignments with masked contacts.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OwnerGuardAssignmentListResponse' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
ownerGuardAssignmentRouter.get(
  "/guard-assignments",
  validate(listOwnerGuardAssignmentsQuerySchema),
  listOwnerAssignmentsController,
);

/**
 * @openapi
 * /api/v1/owner/guard-assignments/{assignmentId}:
 *   get:
 *     tags: [Owner Guard Assignments]
 *     summary: Get an Owner-scoped Guard assignment
 *     operationId: getOwnerGuardAssignment
 *     security: [{ accessCookie: [] }]
 *     parameters:
 *       - { name: assignmentId, in: path, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Assignment details.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OwnerGuardAssignmentResponse' }
 *       404: { description: Assignment was not found for this Owner. }
 *   patch:
 *     tags: [Owner Guard Assignments]
 *     summary: Update shift, suspend, or resume an assignment
 *     description: Changing an accepted shift requires Guard re-acceptance.
 *     operationId: updateOwnerGuardAssignment
 *     security: [{ accessCookie: [] }]
 *     parameters:
 *       - { name: assignmentId, in: path, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateGuardAssignmentRequest' }
 *     responses:
 *       200:
 *         description: Assignment updated.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OwnerGuardAssignmentResponse' }
 *       409: { description: Invalid transition or concurrent state conflict. }
 *   delete:
 *     tags: [Owner Guard Assignments]
 *     summary: Cancel a pending invitation or end an active assignment
 *     operationId: endOwnerGuardAssignment
 *     security: [{ accessCookie: [] }]
 *     parameters:
 *       - { name: assignmentId, in: path, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       204: { description: Assignment cancelled or ended. }
 *       404: { description: Assignment was not found for this Owner. }
 *       409: { description: Invalid transition or concurrent state conflict. }
 */
ownerGuardAssignmentRouter.get(
  "/guard-assignments/:assignmentId",
  validate(guardAssignmentIdParamSchema),
  getOwnerAssignmentController,
);
ownerGuardAssignmentRouter.patch(
  "/guard-assignments/:assignmentId",
  validate(updateGuardAssignmentSchema),
  updateOwnerAssignmentController,
);
ownerGuardAssignmentRouter.delete(
  "/guard-assignments/:assignmentId",
  validate(guardAssignmentIdParamSchema),
  endOwnerAssignmentController,
);
