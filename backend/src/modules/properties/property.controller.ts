import type { Request, RequestHandler } from "express";
import { AppError } from "../../common/errors/app-error.js";
import { authErrors } from "../auth/auth.errors.js";
import * as propertyService from "./property.service.js";

function requireOwnerUserId(req: Request): string {
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

function responseMeta(req: Request) {
  return { requestId: req.requestId, timestamp: new Date().toISOString() };
}

export const createPropertyController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const property = await propertyService.createProperty(
      requireOwnerUserId(req),
      req.body,
    );
    res.status(201).json({
      success: true,
      data: { property },
      meta: responseMeta(req),
    });
  } catch (error) {
    next(error);
  }
};

export const findPossiblePropertyMatchesController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const possibleMatches = await propertyService.findPossiblePropertyMatches(
      req.body,
    );
    res.status(200).json({
      success: true,
      data: { possibleMatches },
      meta: responseMeta(req),
    });
  } catch (error) {
    next(error);
  }
};

export const listPropertiesController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const properties = await propertyService.listProperties(
      requireOwnerUserId(req),
    );
    res.status(200).json({
      success: true,
      data: { properties },
      meta: responseMeta(req),
    });
  } catch (error) {
    next(error);
  }
};

export const getPropertyController: RequestHandler = async (req, res, next) => {
  try {
    const property = await propertyService.getProperty(
      requireOwnerUserId(req),
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

export const updatePropertyController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const property = await propertyService.updateProperty(
      requireOwnerUserId(req),
      requirePropertyId(req),
      req.body,
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

export const deletePropertyController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    await propertyService.deleteProperty(
      requireOwnerUserId(req),
      requirePropertyId(req),
    );
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
