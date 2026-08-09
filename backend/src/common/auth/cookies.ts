import type {
  Response
} from "express";

import { env } from "../../config/env.js";

const isProduction =
  env.NODE_ENV === "production";

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string
): void {
  res.cookie(
    "access_token",
    accessToken,
    {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge:
        env.JWT_ACCESS_EXPIRES_MINUTES *
        60 *
        1000
    }
  );

  res.cookie(
    "refresh_token",
    refreshToken,
    {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge:
        env.JWT_REFRESH_EXPIRES_DAYS *
        24 *
        60 *
        60 *
        1000
    }
  );
}

export function clearAuthCookies(
  res: Response
): void {
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");
}