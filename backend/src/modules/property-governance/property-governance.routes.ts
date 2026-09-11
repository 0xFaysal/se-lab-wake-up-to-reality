import { Router } from "express";
import { UserRoleType } from "../../../generated/prisma/client.js";
import { authenticate } from "../../common/middleware/auth.js";
import { requireAccountReady } from "../../common/middleware/require-account-ready.js";
import { requireRole } from "../../common/middleware/require-role.js";
import { validate } from "../../common/middleware/validate.js";
import {
  createPropertyChangeProposalController,
  getBuildingManagerController,
  leaveProviderMembershipController,
  listPropertyChangeProposalsController,
  nominateBuildingManagerController,
  requestProviderMembershipController,
  updateCommonRulesController,
  updateTemporaryClosureController,
  verifyProviderMembershipController,
  voteBuildingManagerController,
  votePropertyChangeProposalController,
} from "./property-governance.controller.js";
import {
  buildingManagerNominationSchema,
  commonRulesSchema,
  governanceVoteSchema,
  membershipVerificationSchema,
  propertyChangeProposalSchema,
  propertyGovernanceIdSchema,
  temporaryClosureSchema,
} from "./property-governance.schema.js";

export const propertyGovernanceRouter = Router();
propertyGovernanceRouter.use(authenticate, requireAccountReady);
propertyGovernanceRouter.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

/** @openapi
 * /api/v1/provider/properties/{propertyId}/membership:
 *   post:
 *     tags: [Property Governance]
 *     summary: Request Provider membership in an existing canonical Property
 *     security: [{ accessCookie: [] }]
 *     responses: { 201: { description: Pending Provider membership created. }, 409: { description: Current membership already exists. } }
 *   delete:
 *     tags: [Property Governance]
 *     summary: Leave an active verified Property membership
 *     security: [{ accessCookie: [] }]
 *     responses: { 204: { description: Provider membership ended. } }
 * /api/v1/admin/properties/{propertyId}/providers/{membershipId}/verification:
 *   patch:
 *     tags: [Property Governance]
 *     summary: Verify or reject a pending Provider membership
 *     security: [{ accessCookie: [] }]
 *     responses: { 200: { description: Membership verification updated. } }
 * /api/v1/properties/{propertyId}/building-manager/nominations:
 *   post:
 *     tags: [Property Governance]
 *     summary: Nominate a Property-scoped Building Manager
 *     security: [{ accessCookie: [] }]
 *     responses: { 201: { description: Nomination created or activated for a sole Provider. } }
 * /api/v1/properties/{propertyId}/building-manager:
 *   get:
 *     tags: [Property Governance]
 *     summary: Read the current Building Manager governance state
 *     security: [{ accessCookie: [] }]
 *     responses: { 200: { description: Current assignment or null. } }
 * /api/v1/properties/{propertyId}/building-manager/nominations/{assignmentId}/vote:
 *   post:
 *     tags: [Property Governance]
 *     summary: Cast one verified Provider vote on a nomination
 *     security: [{ accessCookie: [] }]
 *     responses: { 200: { description: Vote recorded and unanimity evaluated. }, 409: { description: Duplicate vote or stale nomination. } }
 * /api/v1/properties/{propertyId}/common-rules:
 *   patch:
 *     tags: [Property Governance]
 *     summary: Update shared common rules with live authority and version check
 *     security: [{ accessCookie: [] }]
 *     responses: { 200: { description: Common rules updated. }, 409: { description: Stale Property version. } }
 * /api/v1/properties/{propertyId}/temporary-closure:
 *   patch:
 *     tags: [Property Governance]
 *     summary: Close or reopen a Property temporarily
 *     security: [{ accessCookie: [] }]
 *     responses: { 200: { description: Temporary closure state updated. } }
 * /api/v1/properties/{propertyId}/change-proposals:
 *   post:
 *     tags: [Property Governance]
 *     summary: Propose a versioned shared change in multi-provider mode
 *     security: [{ accessCookie: [] }]
 *     responses: { 201: { description: Proposal and proposer's approval vote created. } }
 *   get:
 *     tags: [Property Governance]
 *     summary: List Property change proposals for verified Providers
 *     security: [{ accessCookie: [] }]
 *     responses: { 200: { description: Authorized proposal list. } }
 * /api/v1/properties/{propertyId}/change-proposals/{proposalId}/vote:
 *   post:
 *     tags: [Property Governance]
 *     summary: Vote on and conditionally apply a shared change proposal
 *     security: [{ accessCookie: [] }]
 *     responses: { 200: { description: Vote recorded; unanimous current approvals apply a non-stale proposal. } }
 */

propertyGovernanceRouter.post(
  "/provider/properties/:propertyId/membership",
  requireRole(UserRoleType.PROVIDER),
  validate(propertyGovernanceIdSchema),
  requestProviderMembershipController,
);
propertyGovernanceRouter.delete(
  "/provider/properties/:propertyId/membership",
  requireRole(UserRoleType.PROVIDER),
  validate(propertyGovernanceIdSchema),
  leaveProviderMembershipController,
);
propertyGovernanceRouter.patch(
  "/admin/properties/:propertyId/providers/:membershipId/verification",
  requireRole(UserRoleType.ADMIN),
  validate(membershipVerificationSchema),
  verifyProviderMembershipController,
);

propertyGovernanceRouter.post(
  "/properties/:propertyId/building-manager/nominations",
  requireRole(UserRoleType.PROVIDER),
  validate(buildingManagerNominationSchema),
  nominateBuildingManagerController,
);
propertyGovernanceRouter.get(
  "/properties/:propertyId/building-manager",
  validate(propertyGovernanceIdSchema),
  getBuildingManagerController,
);
propertyGovernanceRouter.post(
  "/properties/:propertyId/building-manager/nominations/:assignmentId/vote",
  requireRole(UserRoleType.PROVIDER),
  validate(governanceVoteSchema),
  voteBuildingManagerController,
);

propertyGovernanceRouter.patch(
  "/properties/:propertyId/common-rules",
  validate(commonRulesSchema),
  updateCommonRulesController,
);
propertyGovernanceRouter.patch(
  "/properties/:propertyId/temporary-closure",
  validate(temporaryClosureSchema),
  updateTemporaryClosureController,
);
propertyGovernanceRouter.post(
  "/properties/:propertyId/change-proposals",
  requireRole(UserRoleType.PROVIDER),
  validate(propertyChangeProposalSchema),
  createPropertyChangeProposalController,
);
propertyGovernanceRouter.get(
  "/properties/:propertyId/change-proposals",
  requireRole(UserRoleType.PROVIDER),
  validate(propertyGovernanceIdSchema),
  listPropertyChangeProposalsController,
);
propertyGovernanceRouter.post(
  "/properties/:propertyId/change-proposals/:proposalId/vote",
  requireRole(UserRoleType.PROVIDER),
  validate(governanceVoteSchema),
  votePropertyChangeProposalController,
);
