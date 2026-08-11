import type { Request, RequestHandler } from "express";
import { AppError } from "../../common/errors/app-error.js";
import { authErrors } from "../auth/auth.errors.js";
import * as vehicleService from "./vehicle.service.js";

function requireUserId(req: Request): string {
  if (!req.auth) throw authErrors.authenticationRequired();
  return req.auth.userId;
}

function requireVehicleId(req: Request): string {
  const vehicleId = req.params.vehicleId;
  if (typeof vehicleId !== "string") {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "Vehicle ID must be a valid UUID",
    });
  }
  return vehicleId;
}

function responseMeta(req: Request) {
  return { requestId: req.requestId, timestamp: new Date().toISOString() };
}

export const createVehicleController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const vehicle = await vehicleService.createVehicle(
      requireUserId(req),
      req.body,
    );
    res.status(201).json({
      success: true,
      data: { vehicle },
      meta: responseMeta(req),
    });
  } catch (error) {
    next(error);
  }
};

export const listVehiclesController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const vehicles = await vehicleService.listVehicles(requireUserId(req));
    res.status(200).json({
      success: true,
      data: { vehicles },
      meta: responseMeta(req),
    });
  } catch (error) {
    next(error);
  }
};

export const getVehicleController: RequestHandler = async (req, res, next) => {
  try {
    const vehicle = await vehicleService.getVehicle(
      requireUserId(req),
      requireVehicleId(req),
    );
    res.status(200).json({
      success: true,
      data: { vehicle },
      meta: responseMeta(req),
    });
  } catch (error) {
    next(error);
  }
};

export const updateVehicleController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const vehicle = await vehicleService.updateVehicle(
      requireUserId(req),
      requireVehicleId(req),
      req.body,
    );
    res.status(200).json({
      success: true,
      data: { vehicle },
      meta: responseMeta(req),
    });
  } catch (error) {
    next(error);
  }
};

export const setDefaultVehicleController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const vehicle = await vehicleService.setDefaultVehicle(
      requireUserId(req),
      requireVehicleId(req),
    );
    res.status(200).json({
      success: true,
      data: { vehicle },
      meta: responseMeta(req),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteVehicleController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    await vehicleService.deleteVehicle(
      requireUserId(req),
      requireVehicleId(req),
    );
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
