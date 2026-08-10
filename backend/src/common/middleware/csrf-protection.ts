import type { RequestHandler } from "express";
import { AppError } from "../errors/app-error.js";
import { env } from "../../config/env.js";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);
const configuredOrigins = new Set([
  new URL(env.CORS_ORIGIN).origin,
  ...(env.API_PUBLIC_URL ? [new URL(env.API_PUBLIC_URL).origin] : []),
]);

export const csrfProtection: RequestHandler = (req, _res, next) => {
  if (safeMethods.has(req.method)) {
    next();
    return;
  }

  const origin = req.header("origin");
  const fetchSite = req.header("sec-fetch-site");
  const requestOrigin = `${req.protocol}://${req.get("host")}`;
  if (
    (origin && !configuredOrigins.has(origin) && origin !== requestOrigin) ||
    fetchSite === "cross-site"
  ) {
    next(
      new AppError({
        statusCode: 403,
        code: "CSRF_REQUEST_REJECTED",
        message: "Cross-site request was rejected",
      }),
    );
    return;
  }

  next();
};
