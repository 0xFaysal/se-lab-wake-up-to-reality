import type { Response } from "express";

import { env } from "../../config/env.js";

const isProduction = env.NODE_ENV === "production";
const sameSite = env.COOKIE_SAME_SITE;

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
  refreshExpiresAt: Date,
): void {
  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    priority: "high",
    path: "/",
    maxAge: env.JWT_ACCESS_EXPIRES_MINUTES * 60 * 1000,
  });

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    priority: "high",
    path: "/api/v1/auth",
    maxAge: Math.max(0, refreshExpiresAt.getTime() - Date.now()),
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    priority: "high",
    path: "/",
  });
  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    priority: "high",
    path: "/api/v1/auth",
  });
}
