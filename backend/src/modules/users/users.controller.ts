import type { RequestHandler } from "express";
import { clearAuthCookies, setAuthCookies } from "../../common/auth/cookies.js";
import { AppError } from "../../common/errors/app-error.js";
import { authErrors } from "../auth/auth.errors.js";
import {
  changePassword,
  listUserSessions,
  revokeUserSession,
} from "../auth/auth.service.js";
import { createGuardAccount, createManagerAccount } from "./users.service.js";

function getClientIp(req: Parameters<RequestHandler>[0]): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

export const createGuardController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) throw authErrors.authenticationRequired();

    const result = await createGuardAccount({
      actorUserId: req.auth.userId,
      actorRoles: req.auth.roles,
      ...req.body,
    });

    res.status(201).json({
      success: true,
      data: result,
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
};

export const createManagerController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) throw authErrors.authenticationRequired();
    const result = await createManagerAccount({
      actorUserId: req.auth.userId,
      actorRoles: req.auth.roles,
      ...req.body,
    });
    res.status(201).json({
      success: true,
      data: result,
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
};

export const changePasswordController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    if (!req.auth) throw authErrors.authenticationRequired();

    const result = await changePassword({
      userId: req.auth.userId,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
      userAgent: req.header("user-agent") ?? "unknown",
      ipAddress: getClientIp(req),
    });

    setAuthCookies(
      res,
      result.accessToken,
      result.refreshToken,
      result.refreshExpiresAt,
    );

    res.status(200).json({
      success: true,
      data: { user: result.user, nextAction: result.nextAction },
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
};

export const listSessionsController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    if (!req.auth) throw authErrors.authenticationRequired();

    const sessions = await listUserSessions(
      req.auth.userId,
      req.auth.sessionId,
    );

    res.status(200).json({
      success: true,
      data: { sessions },
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
};

export const revokeSessionController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    if (!req.auth) throw authErrors.authenticationRequired();

    const sessionId = req.params.sessionId;

    if (typeof sessionId !== "string") {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "Session ID must be a valid UUID",
      });
    }

    await revokeUserSession(req.auth.userId, sessionId);

    if (sessionId === req.auth.sessionId) clearAuthCookies(res);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
