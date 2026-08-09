import {
  SignJWT,
  jwtVerify
} from "jose";

import { env } from "../../config/env.js";

const accessSecret = new TextEncoder().encode(
  env.JWT_ACCESS_SECRET
);

const refreshSecret = new TextEncoder().encode(
  env.JWT_REFRESH_SECRET
);

export type AccessTokenPayload = {
  userId: string;
  roles: string[];
};

export type RefreshTokenPayload = {
  userId: string;
  sessionId: string;
};

export async function signAccessToken(
  payload: AccessTokenPayload
): Promise<string> {
  return new SignJWT({
    roles: payload.roles
  })
    .setProtectedHeader({
      alg: "HS256"
    })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(
      `${env.JWT_ACCESS_EXPIRES_MINUTES}m`
    )
    .sign(accessSecret);
}

export async function verifyAccessToken(
  token: string
): Promise<AccessTokenPayload> {
  const result = await jwtVerify(
    token,
    accessSecret
  );

  return {
    userId: result.payload.sub!,
    roles: result.payload.roles as string[]
  };
}

export async function signRefreshToken(
  payload: RefreshTokenPayload
): Promise<string> {
  return new SignJWT({
    sessionId: payload.sessionId
  })
    .setProtectedHeader({
      alg: "HS256"
    })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(
      `${env.JWT_REFRESH_EXPIRES_DAYS}d`
    )
    .sign(refreshSecret);
}

export async function verifyRefreshToken(
  token: string
): Promise<RefreshTokenPayload> {
  const result = await jwtVerify(
    token,
    refreshSecret
  );

  return {
    userId: result.payload.sub!,
    sessionId: result.payload.sessionId as string
  };
}