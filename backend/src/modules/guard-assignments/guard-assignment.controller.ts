import type { Request, RequestHandler } from "express";
import { AppError } from "../../common/errors/app-error.js";
import { authErrors } from "../auth/auth.errors.js";
import {
  listGuardAssignmentsQuerySchema,
  listOwnerGuardAssignmentsQuerySchema,
} from "./guard-assignment.schema.js";
import * as service from "./guard-assignment.service.js";

function requireUserId(req: Request): string {
  if (!req.auth) throw authErrors.authenticationRequired();
  return req.auth.userId;
}

function requireParam(
  req: Request,
  name: "propertyId" | "assignmentId",
): string {
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

export const inviteGuardController: RequestHandler = async (req, res, next) => {
  try {
    const assignment = await service.inviteGuard(
      requireUserId(req),
      requireParam(req, "propertyId"),
      req.body,
    );
    res.status(201).json({
      success: true,
      data: { assignment },
      meta: meta(req),
    });
  } catch (error) {
    next(error);
  }
};

export const listOwnerAssignmentsController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const query = listOwnerGuardAssignmentsQuerySchema.parse({
      query: req.query,
    }).query;
    const result = await service.listOwnerAssignments(
      requireUserId(req),
      query,
    );
    res.status(200).json({ success: true, data: result, meta: meta(req) });
  } catch (error) {
    next(error);
  }
};

export const getOwnerAssignmentController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const assignment = await service.getOwnerAssignment(
      requireUserId(req),
      requireParam(req, "assignmentId"),
    );
    res.status(200).json({
      success: true,
      data: { assignment },
      meta: meta(req),
    });
  } catch (error) {
    next(error);
  }
};

export const updateOwnerAssignmentController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const assignment = await service.updateOwnerAssignment(
      requireUserId(req),
      requireParam(req, "assignmentId"),
      req.body,
    );
    res.status(200).json({
      success: true,
      data: { assignment },
      meta: meta(req),
    });
  } catch (error) {
    next(error);
  }
};

export const endOwnerAssignmentController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    await service.endOwnerAssignment(
      requireUserId(req),
      requireParam(req, "assignmentId"),
    );
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const listGuardAssignmentsController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const query = listGuardAssignmentsQuerySchema.parse({
      query: req.query,
    }).query;
    const result = await service.listGuardAssignments(
      requireUserId(req),
      query,
    );
    res.status(200).json({ success: true, data: result, meta: meta(req) });
  } catch (error) {
    next(error);
  }
};

export const getGuardAssignmentController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const assignment = await service.getGuardAssignment(
      requireUserId(req),
      requireParam(req, "assignmentId"),
    );
    res.status(200).json({
      success: true,
      data: { assignment },
      meta: meta(req),
    });
  } catch (error) {
    next(error);
  }
};

export const acceptGuardAssignmentController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const assignment = await service.acceptGuardAssignment(
      requireUserId(req),
      requireParam(req, "assignmentId"),
    );
    res.status(200).json({
      success: true,
      data: { assignment },
      meta: meta(req),
    });
  } catch (error) {
    next(error);
  }
};

export const rejectGuardAssignmentController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const assignment = await service.rejectGuardAssignment(
      requireUserId(req),
      requireParam(req, "assignmentId"),
    );
    res.status(200).json({
      success: true,
      data: { assignment },
      meta: meta(req),
    });
  } catch (error) {
    next(error);
  }
};
