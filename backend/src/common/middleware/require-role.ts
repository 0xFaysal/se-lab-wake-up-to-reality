import type { RequestHandler } from "express";
import type { UserRoleType } from "../../../generated/prisma/client.js";
import { authErrors } from "../../modules/auth/auth.errors.js";

export function requireRole(...allowedRoles: UserRoleType[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) {
      next(authErrors.authenticationRequired());
      return;
    }

    if (!req.auth.roles.some((role) => allowedRoles.includes(role))) {
      next(authErrors.forbidden());
      return;
    }

    next();
  };
}
