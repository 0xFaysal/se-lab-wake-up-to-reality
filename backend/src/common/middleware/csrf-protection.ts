import type { RequestHandler } from "express";
import { AppError } from "../errors/app-error.js";
import { env } from "../../config/env.js";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]); // Define a set of HTTP methods that are considered safe and do not require CSRF protection
const gatewayCallbackPaths = new Set([
  "/api/v1/payments/sslcommerz/ipn",
  "/api/v1/payments/sslcommerz/success",
  "/api/v1/payments/sslcommerz/fail",
  "/api/v1/payments/sslcommerz/cancel",
]);

// Define a set of configured origins that are allowed to make requests to the server.
const configuredOrigins = new Set([
  new URL(env.CORS_ORIGIN).origin,
  ...(env.API_PUBLIC_URL ? [new URL(env.API_PUBLIC_URL).origin] : []),
]);

/* This middleware checks for CSRF protection by validating the request's origin and fetch site headers.
It allows safe methods (GET, HEAD, OPTIONS) to pass through without checks. For other methods,
it verifies that the request's origin is either in the configured origins or matches the request's own origin.
If the request fails these checks, it responds with a 403 error indicating that the cross-site request was rejected.*/

export const csrfProtection: RequestHandler = (req, _res, next) => {
  if (safeMethods.has(req.method) || gatewayCallbackPaths.has(req.path)) {
    next();
    return;
  }

  const origin = req.header("origin");
  const fetchSite = req.header("sec-fetch-site");
  const requestOrigin = `${req.protocol}://${req.get("host")}`;
  const originIsAllowed = !!origin &&
    (configuredOrigins.has(origin) || origin === requestOrigin);

  if (
    (origin && !originIsAllowed) ||
    (fetchSite === "cross-site" && !originIsAllowed)
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
