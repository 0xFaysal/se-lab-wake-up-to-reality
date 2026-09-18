import { Router } from "express";
import { UserRoleType } from "../../../generated/prisma/client.js";
import { authenticate } from "../../common/middleware/auth.js";
import { requireAccountReady } from "../../common/middleware/require-account-ready.js";
import { requireRole } from "../../common/middleware/require-role.js";
import { validate } from "../../common/middleware/validate.js";
import * as controller from "./guard-assignment.controller.js";
import {
  addPropertyGuardSchema,
  createCanonicalProviderGuardAssignmentSchema,
  createProviderGuardAssignmentSchema,
  guardAssignmentIdParamSchema,
  guardMembershipIdSchema,
  listGuardAssignmentsQuerySchema,
  listGuardMembershipsQuerySchema,
  propertyIdParamSchema,
  propertyGuardMembershipParamsSchema,
  updateGuardAssignmentSchema,
} from "./guard-assignment.schema.js";

export const guardAssignmentRouter = Router();

/** @openapi
 * /api/v1/properties/{propertyId}/guards:
 *   post:
 *     tags: [Property Guards]
 *     summary: Invite a Guard into the shared Property Guard pool
 *     security: [{ accessCookie: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateGuardInvitationRequest' }
 *     responses:
 *       201:
 *         description: Property Guard membership invitation created.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PropertyGuardMembershipResponse' }
 *   get:
 *     tags: [Property Guards]
 *     summary: List shared Property Guard memberships
 *     security: [{ accessCookie: [] }]
 *     responses: { 200: { description: Authorized Property Guard membership list. } }
 */
guardAssignmentRouter.post(
  "/properties/:propertyId/guards",
  authenticate,
  requireAccountReady,
  requireRole(UserRoleType.PROVIDER, UserRoleType.MANAGER),
  validate(addPropertyGuardSchema),
  controller.addPropertyGuardController,
);
guardAssignmentRouter.get(
  "/properties/:propertyId/guards",
  authenticate,
  requireAccountReady,
  requireRole(UserRoleType.PROVIDER, UserRoleType.MANAGER, UserRoleType.ADMIN),
  validate(propertyIdParamSchema),
  controller.listPropertyGuardsController,
);

/** @openapi
 * /api/v1/provider/properties/{propertyId}/guard-assignments:
 *   post:
 *     tags: [Guard Assignments]
 *     summary: Assign an active Property Guard to the current Provider scope
 *     security: [{ accessCookie: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateProviderGuardAssignmentRequest' }
 *     responses:
 *       201:
 *         description: Provider Guard assignment created.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ProviderGuardAssignmentResponse' }
 *       409: { description: Membership is not active or assignment already exists. }
 * /api/v1/provider/guard-assignments:
 *   post:
 *     tags: [Guard Assignments]
 *     summary: Create a Provider-scoped Guard assignment
 *     security: [{ accessCookie: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CanonicalCreateProviderGuardAssignmentRequest' }
 *     responses:
 *       201:
 *         description: Provider Guard assignment created.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ProviderGuardAssignmentResponse' }
 *   get:
 *     tags: [Guard Assignments]
 *     summary: List only Provider-owned or explicitly delegated Guard assignments
 *     security: [{ accessCookie: [] }]
 *     responses: { 200: { description: Scoped assignment list. } }
 * /api/v1/provider/guard-assignments/{assignmentId}:
 *   get:
 *     tags: [Guard Assignments]
 *     summary: Read one authorized Provider Guard assignment
 *     security: [{ accessCookie: [] }]
 *     responses:
 *       200:
 *         description: Scoped assignment detail.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ProviderGuardAssignmentResponse' }
 *       404: { description: Assignment is absent or outside the caller's scope. }
 *   patch:
 *     tags: [Guard Assignments]
 *     summary: Update, suspend, or resume a scoped Guard assignment
 *     security: [{ accessCookie: [] }]
 *     responses: { 200: { description: Assignment updated. } }
 *   delete:
 *     tags: [Guard Assignments]
 *     summary: End a scoped Guard assignment
 *     security: [{ accessCookie: [] }]
 *     responses: { 204: { description: Assignment ended. } }
 * /api/v1/guard/property-memberships:
 *   get:
 *     tags: [Property Guards]
 *     summary: List the authenticated Guard's Property memberships
 *     security: [{ accessCookie: [] }]
 *     responses: { 200: { description: Guard membership list. } }
 * /api/v1/guard/property-memberships/{membershipId}/accept:
 *   post:
 *     tags: [Property Guards]
 *     summary: Accept a pending Property Guard membership
 *     security: [{ accessCookie: [] }]
 *     responses: { 200: { description: Membership activated. } }
 * /api/v1/guard/property-memberships/{membershipId}/reject:
 *   post:
 *     tags: [Property Guards]
 *     summary: Reject a pending Property Guard membership
 *     security: [{ accessCookie: [] }]
 *     responses: { 200: { description: Membership cancelled. } }
 * /api/v1/guard/provider-assignments:
 *   get:
 *     tags: [Guard Assignments]
 *     summary: List the authenticated Guard's provider-specific assignments
 *     security: [{ accessCookie: [] }]
 *     responses: { 200: { description: Guard-facing assignment list. } }
 * /api/v1/admin/properties/{propertyId}/guards/{membershipId}:
 *   delete:
 *     tags: [Property Guards]
 *     summary: Remove a Guard from a Property after all assignments end
 *     security: [{ accessCookie: [] }]
 *     responses: { 204: { description: Membership ended. }, 409: { description: Active Provider assignments still exist. } }
 */

guardAssignmentRouter.post(
  "/provider/properties/:propertyId/guard-assignments",
  authenticate,
  requireAccountReady,
  requireRole(UserRoleType.PROVIDER, UserRoleType.MANAGER),
  validate(createProviderGuardAssignmentSchema),
  controller.createProviderGuardAssignmentController,
);
guardAssignmentRouter.post(
  "/provider/guard-assignments",
  authenticate,
  requireAccountReady,
  requireRole(UserRoleType.PROVIDER, UserRoleType.MANAGER),
  validate(createCanonicalProviderGuardAssignmentSchema),
  controller.createCanonicalProviderGuardAssignmentController,
);
guardAssignmentRouter.get(
  "/provider/guard-assignments",
  authenticate,
  requireAccountReady,
  requireRole(UserRoleType.PROVIDER, UserRoleType.MANAGER),
  validate(listGuardAssignmentsQuerySchema),
  controller.listProviderAssignmentsController,
);
guardAssignmentRouter.get(
  "/provider/guard-assignments/:assignmentId",
  authenticate,
  requireAccountReady,
  requireRole(UserRoleType.PROVIDER, UserRoleType.MANAGER),
  validate(guardAssignmentIdParamSchema),
  controller.getProviderAssignmentController,
);
guardAssignmentRouter.patch(
  "/provider/guard-assignments/:assignmentId",
  authenticate,
  requireAccountReady,
  requireRole(UserRoleType.PROVIDER, UserRoleType.MANAGER),
  validate(updateGuardAssignmentSchema),
  controller.updateProviderGuardAssignmentController,
);
guardAssignmentRouter.delete(
  "/provider/guard-assignments/:assignmentId",
  authenticate,
  requireAccountReady,
  requireRole(UserRoleType.PROVIDER, UserRoleType.MANAGER),
  validate(guardAssignmentIdParamSchema),
  controller.endProviderGuardAssignmentController,
);

guardAssignmentRouter.get(
  "/guard/property-memberships",
  authenticate,
  requireRole(UserRoleType.GUARD),
  validate(listGuardMembershipsQuerySchema),
  controller.listMyGuardMembershipsController,
);
guardAssignmentRouter.post(
  "/guard/property-memberships/:membershipId/accept",
  authenticate,
  requireAccountReady,
  requireRole(UserRoleType.GUARD),
  validate(guardMembershipIdSchema),
  controller.acceptGuardMembershipController,
);
guardAssignmentRouter.post(
  "/guard/property-memberships/:membershipId/reject",
  authenticate,
  requireRole(UserRoleType.GUARD),
  validate(guardMembershipIdSchema),
  controller.rejectGuardMembershipController,
);
guardAssignmentRouter.get(
  "/guard/provider-assignments",
  authenticate,
  requireRole(UserRoleType.GUARD),
  validate(listGuardAssignmentsQuerySchema),
  controller.listMyProviderAssignmentsController,
);

guardAssignmentRouter.delete(
  "/admin/properties/:propertyId/guards/:membershipId",
  authenticate,
  requireAccountReady,
  requireRole(UserRoleType.ADMIN),
  validate(propertyGuardMembershipParamsSchema),
  controller.removePropertyGuardController,
);
