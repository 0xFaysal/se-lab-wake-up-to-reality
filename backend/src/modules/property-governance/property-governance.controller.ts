import type { Request, RequestHandler } from "express";
import { AppError } from "../../common/errors/app-error.js";
import { authErrors } from "../auth/auth.errors.js";
import * as service from "./property-governance.service.js";

function userId(req: Request) {
  if (!req.auth) throw authErrors.authenticationRequired();
  return req.auth.userId;
}

function param(req: Request, name: string) {
  const value = req.params[name];
  if (typeof value !== "string") {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: `${name} must be a valid UUID`,
    });
  }
  return value;
}

function meta(req: Request) {
  return { requestId: req.requestId, timestamp: new Date().toISOString() };
}

function handler(
  action: (req: Request) => Promise<unknown>,
  statusCode = 200,
): RequestHandler {
  return async (req, res, next) => {
    try {
      const result = await action(req);
      if (statusCode === 204) {
        res.status(204).send();
        return;
      }
      res.status(statusCode).json({ success: true, data: result, meta: meta(req) });
    } catch (error) {
      next(error);
    }
  };
}

export const requestProviderMembershipController = handler(
  async (req) => ({
    membership: await service.requestProviderMembership(
      userId(req),
      param(req, "propertyId"),
    ),
  }),
  201,
);

export const leaveProviderMembershipController = handler(async (req) => {
  await service.leaveProviderMembership(userId(req), param(req, "propertyId"));
}, 204);

export const verifyProviderMembershipController = handler(async (req) => ({
  membership: await service.verifyProviderMembership(
    userId(req),
    param(req, "propertyId"),
    param(req, "membershipId"),
    req.body,
  ),
}));

export const nominateBuildingManagerController = handler(
  async (req) => ({
    assignment: await service.nominateBuildingManager(
      userId(req),
      param(req, "propertyId"),
      req.body,
    ),
  }),
  201,
);

export const getBuildingManagerController = handler(async (req) => ({
  assignment: await service.getBuildingManager(
    param(req, "propertyId"),
    userId(req),
  ),
}));

export const listBuildingManagerNominationsController = handler(
  async (req) => ({
    assignments: await service.listBuildingManagerNominations(
      param(req, "propertyId"),
      userId(req),
    ),
  }),
);

export const voteBuildingManagerController = handler(async (req) => ({
  assignment: await service.voteForBuildingManager(
    userId(req),
    param(req, "propertyId"),
    param(req, "assignmentId"),
    req.body,
  ),
}));

export const updateCommonRulesController = handler(async (req) => ({
  result: await service.updateCommonRules(
    userId(req),
    param(req, "propertyId"),
    req.body,
  ),
}));

export const updateTemporaryClosureController = handler(async (req) => ({
  result: await service.updateTemporaryClosure(
    userId(req),
    param(req, "propertyId"),
    req.body,
  ),
}));

export const createPropertyChangeProposalController = handler(
  async (req) => ({
    proposal: await service.createPropertyChangeProposal(
      userId(req),
      param(req, "propertyId"),
      req.body,
    ),
  }),
  201,
);

export const listPropertyChangeProposalsController = handler(async (req) => ({
  proposals: await service.listPropertyChangeProposals(
    userId(req),
    param(req, "propertyId"),
  ),
}));

export const getPropertyChangeProposalController = handler(async (req) => ({
  proposal: await service.getPropertyChangeProposal(
    userId(req),
    param(req, "propertyId"),
    param(req, "proposalId"),
  ),
}));

export const votePropertyChangeProposalController = handler(async (req) => ({
  result: await service.voteOnPropertyChangeProposal(
    userId(req),
    param(req, "propertyId"),
    param(req, "proposalId"),
    req.body,
  ),
}));
