import type { ErrorRequestHandler } from "express";
import { AppError } from "../errors/app-error.js";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const appError =
    error instanceof AppError
      ? error
      : new AppError({
          statusCode: 500,
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
          isOperational: false,
        });

  const hideInternalError =
    env.NODE_ENV === "production" && !appError.isOperational;
  const payload = {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode: appError.statusCode,
    code: appError.code,
    error,
  };

  appError.statusCode >= 500
    ? logger.error(payload, "Request failed")
    : logger.warn(payload, "Request rejected");

  res.status(appError.statusCode).json({
    success: false,
    error: {
      code: hideInternalError ? "INTERNAL_SERVER_ERROR" : appError.code,
      message: hideInternalError
        ? "An unexpected error occurred"
        : appError.message,
      ...(!hideInternalError && appError.details !== undefined
        ? { details: appError.details }
        : {}),
    },
    meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
  });
};
