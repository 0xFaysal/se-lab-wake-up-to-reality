import { Router } from "express";
import { UserRoleType } from "../../../generated/prisma/client.js";
import { authenticate } from "../../common/middleware/auth.js";
import { requireAccountReady } from "../../common/middleware/require-account-ready.js";
import { requireRole } from "../../common/middleware/require-role.js";
import { validate } from "../../common/middleware/validate.js";
import * as controller from "./manager-delegation.controller.js";
import {
  createManagerDelegationByIdentifierSchema,
  createManagerDelegationSchema,
  managerDelegationIdSchema,
  updateManagerDelegationPermissionsSchema,
} from "./manager-delegation.schema.js";

export const managerDelegationRouter = Router();

/** @openapi
 * /api/v1/provider/manager-delegations:
 *   post:
 *     tags: [Manager Delegations]
 *     summary: Invite a Manager with provider-scoped permissions
 *     security: [{ accessCookie: [] }]
 *     responses: { 201: { description: Delegation invitation created. }, 409: { description: A current delegation already exists. } }
 *   get:
 *     tags: [Manager Delegations]
 *     summary: List delegations granted by the authenticated Provider
 *     security: [{ accessCookie: [] }]
 *     responses: { 200: { description: Provider-scoped delegation list. } }
 * /api/v1/provider/manager-delegations/by-identifier:
 *   post:
 *     tags: [Manager Delegations]
 *     summary: Invite an existing Manager by exact email or Bangladesh phone
 *     description: Resolves one eligible existing Manager account, then creates a Provider-scoped delegation with explicit permissions and resource scope.
 *     security: [{ accessCookie: [] }]
 *     responses:
 *       201: { description: Delegation invitation created. }
 *       404: { description: No eligible Manager account matched the identifier. }
 *       409: { description: A current delegation already exists for this Manager and Provider scope. }
 * /api/v1/manager/delegations:
 *   get:
 *     tags: [Manager Delegations]
 *     summary: List delegations addressed to the authenticated Manager
 *     security: [{ accessCookie: [] }]
 *     responses: { 200: { description: Manager delegation list. } }
 */

managerDelegationRouter.post(
  "/provider/manager-delegations",
  authenticate,
  requireAccountReady,
  requireRole(UserRoleType.PROVIDER),
  validate(createManagerDelegationSchema),
  controller.createManagerDelegationController,
);
managerDelegationRouter.post(
  "/provider/manager-delegations/by-identifier",
  authenticate,
  requireAccountReady,
  requireRole(UserRoleType.PROVIDER),
  validate(createManagerDelegationByIdentifierSchema),
  controller.createManagerDelegationByIdentifierController,
);
managerDelegationRouter.get(
  "/provider/manager-delegations",
  authenticate,
  requireAccountReady,
  requireRole(UserRoleType.PROVIDER),
  controller.listProviderDelegationsController,
);
/** @openapi
 * /api/v1/provider/manager-delegations/{delegationId}:
 *   get:
 *     tags: [Manager Delegations]
 *     summary: Get one Provider-owned delegation
 *     security: [{ accessCookie: [] }]
 *     responses: { 200: { description: IDOR-scoped delegation detail. }, 404: { description: Delegation not found. } }
 *   delete:
 *     tags: [Manager Delegations]
 *     summary: End or cancel a Provider-owned delegation
 *     security: [{ accessCookie: [] }]
 *     responses: { 200: { description: Delegation ended or cancelled. } }
 * /api/v1/provider/manager-delegations/{delegationId}/permissions:
 *   patch:
 *     tags: [Manager Delegations]
 *     summary: Replace delegated permissions and resource scope
 *     security: [{ accessCookie: [] }]
 *     responses: { 200: { description: Live permission set replaced atomically. } }
 * /api/v1/manager/delegations/{delegationId}/accept:
 *   post:
 *     tags: [Manager Delegations]
 *     summary: Accept a pending Manager delegation
 *     security: [{ accessCookie: [] }]
 *     responses: { 200: { description: Delegation activated. }, 409: { description: State changed or invitation expired. } }
 * /api/v1/manager/delegations/{delegationId}:
 *   get:
 *     tags: [Manager Delegations]
 *     summary: Get one delegation addressed to the authenticated Manager
 *     security: [{ accessCookie: [] }]
 *     responses: { 200: { description: Manager-scoped delegation detail. }, 404: { description: Delegation not found. } }
 * /api/v1/manager/delegations/{delegationId}/reject:
 *   post:
 *     tags: [Manager Delegations]
 *     summary: Reject a pending Manager delegation
 *     security: [{ accessCookie: [] }]
 *     responses: { 200: { description: Delegation cancelled. } }
 */
managerDelegationRouter.get(
  "/provider/manager-delegations/:delegationId",
  authenticate,
  requireAccountReady,
  requireRole(UserRoleType.PROVIDER),
  validate(managerDelegationIdSchema),
  controller.getProviderDelegationController,
);
managerDelegationRouter.patch(
  "/provider/manager-delegations/:delegationId/permissions",
  authenticate,
  requireAccountReady,
  requireRole(UserRoleType.PROVIDER),
  validate(updateManagerDelegationPermissionsSchema),
  controller.updateManagerDelegationController,
);
managerDelegationRouter.delete(
  "/provider/manager-delegations/:delegationId",
  authenticate,
  requireAccountReady,
  requireRole(UserRoleType.PROVIDER),
  validate(managerDelegationIdSchema),
  controller.endManagerDelegationController,
);
managerDelegationRouter.post(
  "/provider/manager-delegations/:delegationId/suspend",
  authenticate,
  requireAccountReady,
  requireRole(UserRoleType.PROVIDER),
  validate(managerDelegationIdSchema),
  controller.suspendManagerDelegationController,
);
managerDelegationRouter.post(
  "/provider/manager-delegations/:delegationId/resume",
  authenticate,
  requireAccountReady,
  requireRole(UserRoleType.PROVIDER),
  validate(managerDelegationIdSchema),
  controller.resumeManagerDelegationController,
);
managerDelegationRouter.get(
  "/manager/delegations",
  authenticate,
  requireRole(UserRoleType.MANAGER),
  controller.listManagerDelegationsController,
);
managerDelegationRouter.get(
  "/manager/delegations/:delegationId",
  authenticate,
  requireRole(UserRoleType.MANAGER),
  validate(managerDelegationIdSchema),
  controller.getManagerDelegationController,
);
managerDelegationRouter.post(
  "/manager/delegations/:delegationId/accept",
  authenticate,
  requireAccountReady,
  requireRole(UserRoleType.MANAGER),
  validate(managerDelegationIdSchema),
  controller.acceptManagerDelegationController,
);
managerDelegationRouter.post(
  "/manager/delegations/:delegationId/reject",
  authenticate,
  requireRole(UserRoleType.MANAGER),
  validate(managerDelegationIdSchema),
  controller.rejectManagerDelegationController,
);
