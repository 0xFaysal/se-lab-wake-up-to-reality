import type { RequestHandler } from "express";
import { AppError } from "../errors/app-error.js";
import { UserStatus } from "../../../generated/prisma/client.js";
import { findAccessSession } from "../../modules/auth/auth.repository.js";
import { verifyAccessToken } from "../auth/jwt.js";

/* This middleware authenticates incoming requests by verifying the access token provided in the request's cookies.
It checks for the presence of the access token, verifies its validity, and retrieves the associated user session from the database.
If the token is valid and the session is active, it attaches the user's authentication information to the request object for further processing.
If any of these checks fail, it responds with an appropriate error indicating that authentication is required or that the token is invalid. */

export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const authHeader = req.header("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : undefined;
    const token = req.cookies?.access_token || bearerToken;

    if (!token) {
      throw new AppError({
        statusCode: 401,
        code: "AUTH_REQUIRED",
        message: "Authentication is required",
      });
    }

    const payload = await verifyAccessToken(token);

    const session = await findAccessSession({
      sessionId: payload.sessionId,
      userId: payload.userId,
    });

    if (
      !session ||
      (session.user.status !== UserStatus.ACTIVE &&
        session.user.status !== UserStatus.PENDING)
    ) {
      throw new AppError({
        statusCode: 401,
        code: "AUTH_INVALID_TOKEN",
        message: "Authentication token is invalid",
      });
    }

    req.auth = {
      userId: session.user.id,
      sessionId: session.id,
      roles: session.user.roles.map((role) => role.role),
      status: session.user.status,
      mustChangePassword: session.user.mustChangePassword,
      emailVerified: session.user.emailVerifiedAt !== null,
      phoneVerified: session.user.phoneVerifiedAt !== null,
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
