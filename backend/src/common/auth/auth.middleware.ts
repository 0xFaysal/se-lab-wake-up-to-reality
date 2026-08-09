import type { RequestHandler } from "express";
import { AppError } from "../errors/app-error.js";
import { verifyAccessToken } from "./jwt.js";

export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const token = req.cookies?.access_token;

    if (!token) {
      throw new AppError({
        statusCode: 401,
        code: "AUTH_REQUIRED",
        message: "Authentication is required",
      });
    }

    const payload = await verifyAccessToken(token);

    req.auth = {
      userId: payload.userId,
      roles: payload.roles,
    };

    next();
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError({
            statusCode: 401,
            code: "AUTH_INVALID_TOKEN",
            message: "Authentication token is invalid",
          }),
    );
  }
};
