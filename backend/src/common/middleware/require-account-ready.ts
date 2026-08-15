import type { RequestHandler } from "express";
import { UserStatus } from "../../../generated/prisma/client.js";
import { AppError } from "../errors/app-error.js";
import { authErrors } from "../../modules/auth/auth.errors.js";

/* This middleware ensures that the user's account is ready for use.
It checks if the user has completed the initial password change, verified their email, and that their account is active.
If any of these conditions are not met, it responds with an appropriate error.
Otherwise, it allows the request to proceed. */

export const requireAccountReady: RequestHandler = (req, _res, next) => {
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

  if (!req.auth.emailVerified) {
    next(
      new AppError({
        statusCode: 403,
        code: "AUTH_EMAIL_VERIFICATION_REQUIRED",
        message: "You must verify your email before continuing",
      }),
    );
    return;
  }

  if (req.auth.status !== UserStatus.ACTIVE) {
    next(
      new AppError({
        statusCode: 403,
        code: "AUTH_ACCOUNT_NOT_ACTIVE",
        message: "This account is not active",
      }),
    );
    return;
  }

  next();
};
