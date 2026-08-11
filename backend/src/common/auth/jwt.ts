import { SignJWT, jwtVerify } from "jose";

import { env } from "../../config/env.js";

const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);

const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

export type AccessTokenPayload = {
  userId: string;
  sessionId: string;
  roles: string[];
};

export type RefreshTokenPayload = {
  userId: string;
  sessionId: string;
};

export async function signAccessToken(
  payload: AccessTokenPayload,
): Promise<string> {
  return new SignJWT({
    roles: payload.roles,
    sessionId: payload.sessionId,
    tokenType: "access",
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setSubject(payload.userId)
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${env.JWT_ACCESS_EXPIRES_MINUTES}m`)
    .sign(accessSecret);
}

export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenPayload> {
  const result = await jwtVerify(token, accessSecret, {
    algorithms: ["HS256"],
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });

  if (
    result.payload.tokenType !== "access" ||
    typeof result.payload.sub !== "string" ||
    typeof result.payload.sessionId !== "string" ||
    !Array.isArray(result.payload.roles) ||
    !result.payload.roles.every((role) => typeof role === "string")
  ) {
    throw new Error("INVALID_ACCESS_TOKEN_PAYLOAD");
  }

  return {
    userId: result.payload.sub,
    sessionId: result.payload.sessionId,
    roles: result.payload.roles,
  };
}

export async function signRefreshToken(
  payload: RefreshTokenPayload,
  expiresAt: Date,
): Promise<string> {
  return new SignJWT({
    sessionId: payload.sessionId,
    tokenType: "refresh",
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setSubject(payload.userId)
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(refreshSecret);
}

export async function verifyRefreshToken(
  token: string,
): Promise<RefreshTokenPayload> {
  const result = await jwtVerify(token, refreshSecret, {
    algorithms: ["HS256"],
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });

  if (
    result.payload.tokenType !== "refresh" ||
    typeof result.payload.sub !== "string" ||
    typeof result.payload.sessionId !== "string"
  ) {
    throw new Error("INVALID_REFRESH_TOKEN_PAYLOAD");
  }

  return {
    userId: result.payload.sub,
    sessionId: result.payload.sessionId,
  };
}
