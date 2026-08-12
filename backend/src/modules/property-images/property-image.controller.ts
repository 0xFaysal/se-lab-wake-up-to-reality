import type { Request, RequestHandler } from "express";
import { AppError } from "../../common/errors/app-error.js";
import { authErrors } from "../auth/auth.errors.js";
import * as propertyImageService from "./property-image.service.js";

function requireUserId(req: Request): string {
  if (!req.auth) throw authErrors.authenticationRequired();
  return req.auth.userId;
}

function requireParam(req: Request, name: "propertyId" | "imageId"): string {
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

function responseMeta(req: Request) {
  return { requestId: req.requestId, timestamp: new Date().toISOString() };
}

export const uploadPropertyImagesController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const files = Array.isArray(req.files) ? req.files : [];
    const images = await propertyImageService.uploadPropertyImages(
      requireUserId(req),
      requireParam(req, "propertyId"),
      files,
    );
    res.status(201).json({
      success: true,
      data: { images },
      meta: responseMeta(req),
    });
  } catch (error) {
    next(error);
  }
};

export const listPropertyImagesController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const images = await propertyImageService.listPropertyImages(
      requireUserId(req),
      requireParam(req, "propertyId"),
    );
    res.status(200).json({
      success: true,
      data: { images },
      meta: responseMeta(req),
    });
  } catch (error) {
    next(error);
  }
};

export const reorderPropertyImagesController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const images = await propertyImageService.reorderPropertyImages(
      requireUserId(req),
      requireParam(req, "propertyId"),
      req.body,
    );
    res.status(200).json({
      success: true,
      data: { images },
      meta: responseMeta(req),
    });
  } catch (error) {
    next(error);
  }
};

export const deletePropertyImageController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    await propertyImageService.deletePropertyImage(
      requireUserId(req),
      requireParam(req, "propertyId"),
      requireParam(req, "imageId"),
    );
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
