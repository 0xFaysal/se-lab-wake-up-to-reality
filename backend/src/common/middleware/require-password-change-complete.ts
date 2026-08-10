import type { RequestHandler } from "express";
import { AppError } from "../errors/app-error.js";
import { authErrors } from "../../modules/auth/auth.errors.js";

export const requirePasswordChangeComplete: RequestHandler = (
  req,
  _res,
  next,
) => {
  if (!req.auth) {
    next(authErrors.authenticationRequired());
    return;
  }

  if (req.auth.mustChangePassword) {
    next(
      new AppError({
        statusCode: 403,
        code: "AUTH_INITIAL_PASSWORD_CHANGE_REQUIRED",
        message: "You must change your initial password before continuing",
      }),
    );
    return;
  }

  next();
};
