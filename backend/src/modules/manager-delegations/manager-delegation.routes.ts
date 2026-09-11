import { Router } from "express";
import { UserRoleType } from "../../../generated/prisma/client.js";
import { authenticate } from "../../common/middleware/auth.js";
import { requireAccountReady } from "../../common/middleware/require-account-ready.js";
import { requireRole } from "../../common/middleware/require-role.js";
import { validate } from "../../common/middleware/validate.js";
import * as controller from "./manager-delegation.controller.js";
import {
  createManagerDelegationSchema,
  managerDelegationIdSchema,
  updateManagerDelegationPermissionsSchema,
} from "./manager-delegation.schema.js";

export const managerDelegationRouter = Router();
managerDelegationRouter.use(authenticate);

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
 * /api/v1/manager/delegations:
 *   get:
 *     tags: [Manager Delegations]
 *     summary: List delegations addressed to the authenticated Manager
 *     security: [{ accessCookie: [] }]
 *     responses: { 200: { description: Manager delegation list. } }
 */

managerDelegationRouter.post(
  "/provider/manager-delegations",
  requireAccountReady,
  requireRole(UserRoleType.PROVIDER),
  validate(createManagerDelegationSchema),
  controller.createManagerDelegationController,
);
managerDelegationRouter.get(
  "/provider/manager-delegations",
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
 * /api/v1/manager/delegations/{delegationId}/reject:
 *   post:
 *     tags: [Manager Delegations]
 *     summary: Reject a pending Manager delegation
 *     security: [{ accessCookie: [] }]
 *     responses: { 200: { description: Delegation cancelled. } }
 */
managerDelegationRouter.get(
  "/provider/manager-delegations/:delegationId",
  requireAccountReady,
  requireRole(UserRoleType.PROVIDER),
  validate(managerDelegationIdSchema),
  controller.getProviderDelegationController,
);
managerDelegationRouter.patch(
  "/provider/manager-delegations/:delegationId/permissions",
  requireAccountReady,
  requireRole(UserRoleType.PROVIDER),
  validate(updateManagerDelegationPermissionsSchema),
  controller.updateManagerDelegationController,
);
managerDelegationRouter.delete(
  "/provider/manager-delegations/:delegationId",
  requireAccountReady,
  requireRole(UserRoleType.PROVIDER),
  validate(managerDelegationIdSchema),
  controller.endManagerDelegationController,
);
managerDelegationRouter.get(
  "/manager/delegations",
  requireRole(UserRoleType.MANAGER),
  controller.listManagerDelegationsController,
);
managerDelegationRouter.post(
  "/manager/delegations/:delegationId/accept",
  requireAccountReady,
  requireRole(UserRoleType.MANAGER),
  validate(managerDelegationIdSchema),
  controller.acceptManagerDelegationController,
);
managerDelegationRouter.post(
  "/manager/delegations/:delegationId/reject",
  requireRole(UserRoleType.MANAGER),
  validate(managerDelegationIdSchema),
  controller.rejectManagerDelegationController,
);
