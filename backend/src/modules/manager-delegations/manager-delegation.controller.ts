import type { Request, RequestHandler, Response } from "express";
import { AppError } from "../../common/errors/app-error.js";
import { authErrors } from "../auth/auth.errors.js";
import * as service from "./manager-delegation.service.js";

function userId(req: Request) {
  if (!req.auth) throw authErrors.authenticationRequired();
  return req.auth.userId;
}

function delegationId(req: Request) {
  const id = req.params.delegationId;
  if (typeof id !== "string") {
    throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "delegationId must be a valid UUID" });
  }
  return id;
}

const respond = (req: Request, res: Response, data: unknown, status = 200) =>
  res.status(status).json({ success: true, data, meta: { requestId: req.requestId, timestamp: new Date().toISOString() } });

export const createManagerDelegationController: RequestHandler = async (req, res, next) => {
  try { respond(req, res, { delegation: await service.createManagerDelegation(userId(req), req.body) }, 201); } catch (error) { next(error); }
};
export const listProviderDelegationsController: RequestHandler = async (req, res, next) => {
  try { respond(req, res, { delegations: await service.listProviderDelegations(userId(req)) }); } catch (error) { next(error); }
};
export const listManagerDelegationsController: RequestHandler = async (req, res, next) => {
  try { respond(req, res, { delegations: await service.listManagerDelegations(userId(req)) }); } catch (error) { next(error); }
};
export const getProviderDelegationController: RequestHandler = async (req, res, next) => {
  try { respond(req, res, { delegation: await service.getProviderDelegation(userId(req), delegationId(req)) }); } catch (error) { next(error); }
};
export const getManagerDelegationController: RequestHandler = async (req, res, next) => {
  try { respond(req, res, { delegation: await service.getManagerDelegation(userId(req), delegationId(req)) }); } catch (error) { next(error); }
};
export const updateManagerDelegationController: RequestHandler = async (req, res, next) => {
  try { respond(req, res, { delegation: await service.updateManagerDelegationPermissions(userId(req), delegationId(req), req.body) }); } catch (error) { next(error); }
};
export const acceptManagerDelegationController: RequestHandler = async (req, res, next) => {
  try { respond(req, res, { delegation: await service.acceptManagerDelegation(userId(req), delegationId(req)) }); } catch (error) { next(error); }
};
export const rejectManagerDelegationController: RequestHandler = async (req, res, next) => {
  try { respond(req, res, { delegation: await service.rejectManagerDelegation(userId(req), delegationId(req)) }); } catch (error) { next(error); }
};
export const endManagerDelegationController: RequestHandler = async (req, res, next) => {
  try { respond(req, res, { delegation: await service.endManagerDelegation(userId(req), delegationId(req)) }); } catch (error) { next(error); }
};
