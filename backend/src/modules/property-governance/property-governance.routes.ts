import { Router } from "express";
import { UserRoleType } from "../../../generated/prisma/client.js";
import { authenticate } from "../../common/middleware/auth.js";
import { requireAccountReady } from "../../common/middleware/require-account-ready.js";
import { requireRole } from "../../common/middleware/require-role.js";
import { validate } from "../../common/middleware/validate.js";
import {
  createPropertyChangeProposalController,
  getBuildingManagerController,
  getPropertyChangeProposalController,
  leaveProviderMembershipController,
  listBuildingManagerNominationsController,
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
  buildingManagerVoteSchema,
  commonRulesSchema,
  membershipVerificationSchema,
  propertyChangeProposalSchema,
  propertyChangeProposalIdSchema,
  propertyChangeVoteSchema,
  propertyGovernanceIdSchema,
  temporaryClosureSchema,
} from "./property-governance.schema.js";

export const propertyGovernanceRouter = Router();
const noStore = (
  _req: Parameters<typeof authenticate>[0],
  res: Parameters<typeof authenticate>[1],
  next: Parameters<typeof authenticate>[2],
) => {
  res.setHeader("Cache-Control", "no-store");
  next();
};

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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/GovernanceVoteRequest' }
 *     responses: { 200: { description: Membership verification updated. } }
 * /api/v1/properties/{propertyId}/building-manager/nominations:
 *   post:
 *     tags: [Property Governance]
 *     summary: Nominate a Property-scoped Building Manager
 *     security: [{ accessCookie: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/BuildingManagerNominationRequest' }
 *     responses: { 201: { description: Nomination created or activated for a sole Provider. } }
 *   get:
 *     tags: [Property Governance]
 *     summary: List Building Manager nomination history and votes
 *     security: [{ accessCookie: [] }]
 *     responses: { 200: { description: Authorized nomination history. } }
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/GovernanceVoteRequest' }
 *     responses: { 200: { description: Vote recorded and unanimity evaluated. }, 409: { description: Duplicate vote or stale nomination. } }
 * /api/v1/properties/{propertyId}/common-rules:
 *   patch:
 *     tags: [Property Governance]
 *     summary: Update shared common rules with live authority and version check
 *     security: [{ accessCookie: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CommonPropertyRulesUpdateRequest' }
 *     responses: { 200: { description: Common rules updated. }, 409: { description: Stale Property version. } }
 * /api/v1/properties/{propertyId}/temporary-closure:
 *   patch:
 *     tags: [Property Governance]
 *     summary: Close or reopen a Property temporarily
 *     security: [{ accessCookie: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/TemporaryClosureUpdateRequest' }
 *     responses: { 200: { description: Temporary closure state updated. } }
 * /api/v1/properties/{propertyId}/change-proposals:
 *   post:
 *     tags: [Property Governance]
 *     summary: Propose a versioned shared change in multi-provider mode
 *     security: [{ accessCookie: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/PropertyChangeProposalRequest' }
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/GovernanceVoteRequest' }
 *     responses: { 200: { description: Vote recorded; unanimous current approvals apply a non-stale proposal. } }
 * /api/v1/properties/{propertyId}/change-proposals/{proposalId}:
 *   get:
 *     tags: [Property Governance]
 *     summary: Read one shared Property change proposal and its votes
 *     security: [{ accessCookie: [] }]
 *     responses: { 200: { description: Authorized proposal detail. }, 404: { description: Proposal not found in this Property scope. } }
 */

propertyGovernanceRouter.post(
  "/provider/properties/:propertyId/membership",
  authenticate,
  requireAccountReady,
  noStore,
  requireRole(UserRoleType.PROVIDER),
  validate(propertyGovernanceIdSchema),
  requestProviderMembershipController,
);
propertyGovernanceRouter.delete(
  "/provider/properties/:propertyId/membership",
  authenticate,
  requireAccountReady,
  noStore,
  requireRole(UserRoleType.PROVIDER),
  validate(propertyGovernanceIdSchema),
  leaveProviderMembershipController,
);
propertyGovernanceRouter.patch(
  "/admin/properties/:propertyId/providers/:membershipId/verification",
  authenticate,
  requireAccountReady,
  noStore,
  requireRole(UserRoleType.ADMIN),
  validate(membershipVerificationSchema),
  verifyProviderMembershipController,
);

propertyGovernanceRouter.post(
  "/properties/:propertyId/building-manager/nominations",
  authenticate,
  requireAccountReady,
  noStore,
  requireRole(UserRoleType.PROVIDER),
  validate(buildingManagerNominationSchema),
  nominateBuildingManagerController,
);
propertyGovernanceRouter.get(
  "/properties/:propertyId/building-manager",
  authenticate,
  requireAccountReady,
  noStore,
  validate(propertyGovernanceIdSchema),
  getBuildingManagerController,
);
propertyGovernanceRouter.get(
  "/properties/:propertyId/building-manager/nominations",
  authenticate,
  requireAccountReady,
  noStore,
  validate(propertyGovernanceIdSchema),
  listBuildingManagerNominationsController,
);
propertyGovernanceRouter.post(
  "/properties/:propertyId/building-manager/nominations/:assignmentId/vote",
  authenticate,
  requireAccountReady,
  noStore,
  requireRole(UserRoleType.PROVIDER),
  validate(buildingManagerVoteSchema),
  voteBuildingManagerController,
);

propertyGovernanceRouter.patch(
  "/properties/:propertyId/common-rules",
  authenticate,
  requireAccountReady,
  noStore,
  validate(commonRulesSchema),
  updateCommonRulesController,
);
propertyGovernanceRouter.patch(
  "/properties/:propertyId/temporary-closure",
  authenticate,
  requireAccountReady,
  noStore,
  validate(temporaryClosureSchema),
  updateTemporaryClosureController,
);
propertyGovernanceRouter.post(
  "/properties/:propertyId/change-proposals",
  authenticate,
  requireAccountReady,
  noStore,
  requireRole(UserRoleType.PROVIDER),
  validate(propertyChangeProposalSchema),
  createPropertyChangeProposalController,
);
propertyGovernanceRouter.get(
  "/properties/:propertyId/change-proposals",
  authenticate,
  requireAccountReady,
  noStore,
  requireRole(UserRoleType.PROVIDER),
  validate(propertyGovernanceIdSchema),
  listPropertyChangeProposalsController,
);
propertyGovernanceRouter.get(
  "/properties/:propertyId/change-proposals/:proposalId",
  authenticate,
  requireAccountReady,
  noStore,
  requireRole(UserRoleType.PROVIDER),
  validate(propertyChangeProposalIdSchema),
  getPropertyChangeProposalController,
);
propertyGovernanceRouter.post(
  "/properties/:propertyId/change-proposals/:proposalId/vote",
  authenticate,
  requireAccountReady,
  noStore,
  requireRole(UserRoleType.PROVIDER),
  validate(propertyChangeVoteSchema),
  votePropertyChangeProposalController,
);
