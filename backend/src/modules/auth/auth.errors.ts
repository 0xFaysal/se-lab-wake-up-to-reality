import { AppError } from "../../common/errors/app-error.js";

export const authErrors = {
  invalidCredentials: () =>
    new AppError({
      statusCode: 401,
      code: "AUTH_INVALID_CREDENTIALS",
      message: "Invalid email/phone or password",
    }),

  invalidRefreshToken: () =>
    new AppError({
      statusCode: 401,
      code: "AUTH_INVALID_REFRESH_TOKEN",
      message: "Refresh token is invalid",
    }),

  refreshTokenReused: () =>
    new AppError({
      statusCode: 401,
      code: "AUTH_REFRESH_TOKEN_REUSED",
      message: "Refresh token has already been used",
    }),

  authenticationRequired: () =>
    new AppError({
      statusCode: 401,
      code: "AUTH_REQUIRED",
      message: "Authentication is required",
    }),

  forbidden: () =>
    new AppError({
      statusCode: 403,
      code: "AUTH_FORBIDDEN",
      message: "You do not have permission to perform this action",
    }),
};
