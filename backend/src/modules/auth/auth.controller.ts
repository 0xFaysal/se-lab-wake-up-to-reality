import type { RequestHandler } from "express";
import { clearAuthCookies, setAuthCookies } from "../../common/auth/cookies.js";
import { AppError } from "../../common/errors/app-error.js";
import {
  changeInitialPassword,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAuthSession,
  registerUser,
} from "./auth.service.js";

function getClientIp(req: Parameters<RequestHandler>[0]): string {
  return (
    req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

function getUserAgent(req: Parameters<RequestHandler>[0]): string {
  return req.header("user-agent") ?? "unknown";
}

export const registerController: RequestHandler = async (req, res, next) => {
  try {
    const user = await registerUser(req.body);

    res.status(201).json({
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

export const loginController: RequestHandler = async (req, res, next) => {
  try {
    const result = await loginUser({
      ...req.body,
      userAgent: getUserAgent(req),
      ipAddress: getClientIp(req),
    });

    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        nextAction: result.nextAction,
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
    const refreshToken = req.cookies?.refresh_token;

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

    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        nextAction: result.nextAction,
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
    await logoutUser(req.cookies?.refresh_token);
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

    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        nextAction: result.nextAction,
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
