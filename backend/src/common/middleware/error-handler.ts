import type { ErrorRequestHandler } from "express";
import { AppError } from "../errors/app-error.js";
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
  res
    .status(appError.statusCode)
    .json({
      success: false,
      error: {
        code: appError.code,
        message: appError.message,
        ...(appError.details !== undefined
          ? { details: appError.details }
          : {}),
      },
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
    });
};
