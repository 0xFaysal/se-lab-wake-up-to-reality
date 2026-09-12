import type { Request, RequestHandler } from "express";
import { AppError } from "../../../common/errors/app-error.js";
import { authErrors } from "../../auth/auth.errors.js";
import * as adminPropertyService from "./admin-property.service.js";
import { pendingAdminPropertiesSchema } from "./admin-property.schema.js";

function requireAdminUserId(req: Request): string {
  if (!req.auth) throw authErrors.authenticationRequired();
  return req.auth.userId;
}

function requirePropertyId(req: Request): string {
  const propertyId = req.params.propertyId;
  if (typeof propertyId !== "string") {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "Property ID must be a valid UUID",
    });
  }
  return propertyId;
}

function requireDuplicatePropertyId(req: Request): string {
  const duplicateId = req.params.duplicateId;
  if (typeof duplicateId !== "string") {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "Duplicate Property ID must be a valid UUID",
    });
  }
  return duplicateId;
}

function responseMeta(req: Request) {
  return { requestId: req.requestId, timestamp: new Date().toISOString() };
}

export const listPendingPropertiesController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const query = pendingAdminPropertiesSchema.parse({
      query: req.query,
    }).query;
    const result = await adminPropertyService.listPendingProperties(query);
    res.status(200).json({
      success: true,
      data: result,
      meta: responseMeta(req),
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminPropertyController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const property = await adminPropertyService.getAdminProperty(
      requirePropertyId(req),
    );
    res.status(200).json({
      success: true,
      data: { property },
      meta: responseMeta(req),
    });
  } catch (error) {
    next(error);
  }
};

export const verifyAdminPropertyController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const verification = await adminPropertyService.verifyProperty(
      requireAdminUserId(req),
      requirePropertyId(req),
      req.body,
    );
    res.status(200).json({
      success: true,
      data: { verification },
      meta: responseMeta(req),
    });
  } catch (error) {
    next(error);
  }
};

export const mergeAdminPropertiesController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const merge = await adminPropertyService.mergeDuplicateProperties(
      requireAdminUserId(req),
      req.body,
    );
    res.status(200).json({
      success: true,
      data: { merge },
      meta: responseMeta(req),
    });
  } catch (error) {
    next(error);
  }
};

export const mergeAdminPropertyByIdController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const merge = await adminPropertyService.mergeDuplicateProperties(
      requireAdminUserId(req),
      {
        ...req.body,
        duplicatePropertyId: requireDuplicatePropertyId(req),
      },
    );
    res.status(200).json({
      success: true,
      data: { merge },
      meta: responseMeta(req),
    });
  } catch (error) {
    next(error);
  }
};
