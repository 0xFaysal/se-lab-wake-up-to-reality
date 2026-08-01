import type { RequestHandler } from "express";
import { AppError } from "../errors/app-error.js";
export const notFoundHandler: RequestHandler = (req, _res, next) =>
  next(
    new AppError({
      statusCode: 404,
      code: "ROUTE_NOT_FOUND",
      message: `Route ${req.method} ${req.originalUrl} was not found`,
    }),
  );
