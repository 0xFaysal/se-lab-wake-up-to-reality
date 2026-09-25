import type { RequestHandler } from "express";
import { clearAuthCookies, setAuthCookies } from "../../common/auth/cookies.js";
import { AppError } from "../../common/errors/app-error.js";
import { authErrors } from "./auth.errors.js";
import {
  changeInitialPassword,
  confirmVerificationCode,
  getCurrentUser,
  loginUser,
  logoutAllUserSessions,
  logoutUser,
  refreshAuthSession,
  registerUser,
  requestPasswordReset,
  requestVerificationCode,
  resetPassword,
} from "./auth.service.js";

function getClientIp(req: Parameters<RequestHandler>[0]): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function getUserAgent(req: Parameters<RequestHandler>[0]): string {
  return req.header("user-agent") ?? "unknown";
}

export const registerController: RequestHandler = async (req, res, next) => {
  try {
    const result = await registerUser({
      ...req.body,
      userAgent: getUserAgent(req),
      ipAddress: getClientIp(req),
    });

    setAuthCookies(
      res,
      result.accessToken,
      result.refreshToken,
      result.refreshExpiresAt,
    );

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        nextAction: result.nextAction,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const loginController: RequestHandler = async (req, res, next) => {
  try {
    const result = await loginUser({
      ...req.body,
      userAgent: getUserAgent(req),
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
      data: {
        user: result.user,
        nextAction: result.nextAction,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshController: RequestHandler = async (req, res, next) => {
  try {
    const refreshToken =
      req.cookies?.refresh_token ||
      (typeof req.body?.refreshToken === "string"
        ? req.body.refreshToken.trim()
        : undefined) ||
      req.header("x-refresh-token");

    if (!refreshToken) {
      throw new AppError({
        statusCode: 401,
        code: "AUTH_REFRESH_TOKEN_REQUIRED",
        message: "Refresh token is required",
      });
    }

    const result = await refreshAuthSession({
      refreshToken,
      userAgent: getUserAgent(req),
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
      data: {
        user: result.user,
        nextAction: result.nextAction,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logoutController: RequestHandler = async (req, res, next) => {
  try {
    const refreshToken =
      req.cookies?.refresh_token ||
      (typeof req.body?.refreshToken === "string"
        ? req.body.refreshToken.trim()
        : undefined) ||
      req.header("x-refresh-token");
    await logoutUser(refreshToken);
    clearAuthCookies(res);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const logoutAllController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) throw authErrors.authenticationRequired();

    await logoutAllUserSessions(req.auth.userId);
    clearAuthCookies(res);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const meController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({
        statusCode: 401,
        code: "AUTH_REQUIRED",
        message: "Authentication is required",
      });
    }

    const user = await getCurrentUser(req.auth.userId);

    res.status(200).json({
      success: true,
      data: {
        user,
      },
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const changeInitialPasswordController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    if (!req.auth) {
      throw new AppError({
        statusCode: 401,
        code: "AUTH_REQUIRED",
        message: "Authentication is required",
      });
    }

    const result = await changeInitialPassword({
      userId: req.auth.userId,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
      userAgent: getUserAgent(req),
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
      data: {
        user: result.user,
        nextAction: result.nextAction,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const requestPasswordResetController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const result = await requestPasswordReset(req.body.identifier);

    res.status(202).json({
      success: true,
      data: {
        message: "If an account exists, reset instructions have been generated",
        ...result,
      },
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
};

export const resetPasswordController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    await resetPassword(req.body);
    clearAuthCookies(res);

    res.status(200).json({
      success: true,
      data: { message: "Password has been reset successfully" },
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
};

function requestVerificationController(
  channel: "email" | "phone",
): RequestHandler {
  return async (req, res, next) => {
    try {
      if (!req.auth) throw authErrors.authenticationRequired();
      const result = await requestVerificationCode(req.auth.userId, channel);

      res.status(202).json({
        success: true,
        data: result,
        meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  };
}

function confirmVerificationController(
  channel: "email" | "phone",
): RequestHandler {
  return async (req, res, next) => {
    try {
      if (!req.auth) throw authErrors.authenticationRequired();
      await confirmVerificationCode(req.auth.userId, channel, req.body.code);

      res.status(200).json({
        success: true,
        data: { verified: true, channel },
        meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const requestEmailVerificationController =
  requestVerificationController("email");

export const confirmEmailVerificationController =
  confirmVerificationController("email");

export const requestPhoneVerificationController =
  requestVerificationController("phone");
export const confirmPhoneVerificationController =
  confirmVerificationController("phone");
