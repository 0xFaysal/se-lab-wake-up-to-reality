import type { Request, RequestHandler, Response } from "express";
import { AppError } from "../../common/errors/app-error.js";
import { authErrors } from "../auth/auth.errors.js";
import {
  listGuardAssignmentsQuerySchema,
  listGuardMembershipsQuerySchema,
} from "./guard-assignment.schema.js";
import * as service from "./guard-assignment.service.js";

function userId(req: Request) {
  if (!req.auth) throw authErrors.authenticationRequired();
  return req.auth.userId;
}
function param(
  req: Request,
  name: "propertyId" | "membershipId" | "assignmentId",
) {
  const value = req.params[name];
  if (typeof value !== "string")
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: `${name} must be a valid UUID`,
    });
  return value;
}
function respond(req: Request, res: Response, data: unknown, status = 200) {
  res.status(status).json({
    success: true,
    data,
    meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
  });
}

export const addPropertyGuardController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    respond(
      req,
      res,
      {
        membership: await service.addPropertyGuard(
          userId(req),
          param(req, "propertyId"),
          req.body,
        ),
      },
      201,
    );
  } catch (error) {
    next(error);
  }
};
export const listPropertyGuardsController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    respond(req, res, {
      memberships: await service.listPropertyGuards(
        userId(req),
        param(req, "propertyId"),
      ),
    });
  } catch (error) {
    next(error);
  }
};
export const listMyGuardMembershipsController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const query = listGuardMembershipsQuerySchema.parse({
      query: req.query,
    }).query;
    respond(req, res, await service.listMyGuardMemberships(userId(req), query));
  } catch (error) {
    next(error);
  }
};
export const acceptGuardMembershipController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    respond(req, res, {
      membership: await service.respondToGuardMembership(
        userId(req),
        param(req, "membershipId"),
        true,
      ),
    });
  } catch (error) {
    next(error);
  }
};
export const rejectGuardMembershipController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    respond(req, res, {
      membership: await service.respondToGuardMembership(
        userId(req),
        param(req, "membershipId"),
        false,
      ),
    });
  } catch (error) {
    next(error);
  }
};
export const createProviderGuardAssignmentController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    respond(
      req,
      res,
      {
        assignment: await service.createProviderGuardAssignment(
          userId(req),
          param(req, "propertyId"),
          req.body,
        ),
      },
      201,
    );
  } catch (error) {
    next(error);
  }
};
export const createCanonicalProviderGuardAssignmentController: RequestHandler =
  async (req, res, next) => {
    try {
      const { propertyId, ...input } = req.body;
      respond(
        req,
        res,
        {
          assignment: await service.createProviderGuardAssignment(
            userId(req),
            propertyId,
            input,
          ),
        },
        201,
      );
    } catch (error) {
      next(error);
    }
  };
export const listProviderAssignmentsController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const query = listGuardAssignmentsQuerySchema.parse({
      query: req.query,
    }).query;
    respond(
      req,
      res,
      await service.listProviderAssignments(userId(req), query),
    );
  } catch (error) {
    next(error);
  }
};
export const getProviderAssignmentController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    respond(req, res, {
      assignment: await service.getProviderAssignment(
        userId(req),
        param(req, "assignmentId"),
      ),
    });
  } catch (error) {
    next(error);
  }
};
export const listMyProviderAssignmentsController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const query = listGuardAssignmentsQuerySchema.parse({
      query: req.query,
    }).query;
    respond(
      req,
      res,
      await service.listMyProviderAssignments(userId(req), query),
    );
  } catch (error) {
    next(error);
  }
};
export const updateProviderGuardAssignmentController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    respond(req, res, {
      assignment: await service.updateProviderGuardAssignment(
        userId(req),
        param(req, "assignmentId"),
        req.body,
      ),
    });
  } catch (error) {
    next(error);
  }
};
export const endProviderGuardAssignmentController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    await service.endProviderGuardAssignment(
      userId(req),
      param(req, "assignmentId"),
    );
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
export const removePropertyGuardController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    await service.removePropertyGuard(
      userId(req),
      param(req, "propertyId"),
      param(req, "membershipId"),
    );
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const inviteGuardController = addPropertyGuardController;
export const listOwnerAssignmentsController = listProviderAssignmentsController;
export const updateOwnerAssignmentController =
  updateProviderGuardAssignmentController;
export const endOwnerAssignmentController =
  endProviderGuardAssignmentController;
export const listGuardAssignmentsController =
  listMyProviderAssignmentsController;
export const acceptGuardAssignmentController = acceptGuardMembershipController;
export const rejectGuardAssignmentController = rejectGuardMembershipController;
