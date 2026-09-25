import type { Request, RequestHandler } from "express";
import { hashToken } from "../auth/token-hash.js";
import { AppError } from "../errors/app-error.js";
import { redis } from "../../config/redis.js";

type RateLimitOptions = {
  windowMs: number;
  limit: number;
  keyPrefix: string;
  identities?:
    ((req: Request) => Array<{ value: string; limit: number }>) | undefined;
};

const incrementScript = `
  local blocked = 0
  local lowest_remaining = 2147483647
  local limiting_limit = 0
  local longest_ttl = 0

  for index, key in ipairs(KEYS) do
    local limit = tonumber(ARGV[index + 1])
    local count = redis.call("INCR", key)
    if count == 1 then
      redis.call("PEXPIRE", key, ARGV[1])
    end

    local ttl = redis.call("PTTL", key)
    local remaining = limit - count
    if remaining < 0 then
      remaining = 0
    end
    if remaining < lowest_remaining then
      lowest_remaining = remaining
      limiting_limit = limit
    end
    if count > limit then
      blocked = 1
    end
    if ttl > longest_ttl then
      longest_ttl = ttl
    end
  end

  return { blocked, limiting_limit, lowest_remaining, longest_ttl }
`;

function createRateLimit(options: RateLimitOptions): RequestHandler {
  return async (req, res, next) => {
    try {
      const identities = options.identities?.(req) ?? [
        { value: `ip:${req.ip ?? "unknown"}`, limit: options.limit },
      ];
      const testNamespace =
        process.env.NODE_ENV === "test" ? `test:${process.pid}:` : "";
      const keys = identities.map(
        (identity) =>
          `rate-limit:${testNamespace}${options.keyPrefix}:${hashToken(identity.value)}`,
      );
      const reply = (await redis.eval(incrementScript, {
        keys,
        arguments: [
          String(options.windowMs),
          ...identities.map((identity) => String(identity.limit)),
        ],
      })) as unknown as [number, number, number, number];

      const blocked = Number(reply[0]) === 1;
      const limitingLimit = Number(reply[1]);
      const remaining = Number(reply[2]);
      const ttlMs = Math.max(1, Number(reply[3]));
      const resetSeconds = Math.max(1, Math.ceil(ttlMs / 1000));

      res.setHeader("RateLimit-Limit", limitingLimit);
      res.setHeader("RateLimit-Remaining", remaining);
      res.setHeader("RateLimit-Reset", resetSeconds);

      if (blocked) {
        res.setHeader("Retry-After", resetSeconds);
        next(
          new AppError({
            statusCode: 429,
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many requests. Please try again later",
            details: { retryAfterSeconds: resetSeconds },
          }),
        );
        return;
      }

      next();
    } catch {
      next(
        new AppError({
          statusCode: 503,
          code: "RATE_LIMIT_SERVICE_UNAVAILABLE",
          message: "Request protection is temporarily unavailable",
        }),
      );
    }
  };
}

const accountAndIpLimits = (req: Request) => [
  { value: `account:${req.auth?.userId ?? "anonymous"}`, limit: 5 },
  { value: `ip:${req.ip ?? "unknown"}`, limit: 30 },
];

const identifierAndIpLimits = (req: Request) => {
  const identifier =
    typeof req.body?.identifier === "string"
      ? req.body.identifier.trim().toLowerCase()
      : "invalid";
  return [
    { value: `identifier:${identifier}`, limit: 5 },
    { value: `ip:${req.ip ?? "unknown"}`, limit: 50 },
  ];
};

// Rate limiters for different endpoints
// Each rate limiter can have different windowMs, limit, and identities

// This rate limiter is for the registration endpoint, allowing 5 requests per hour per IP address
export const registerRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5,
  keyPrefix: "register",
});

// This rate limiter is for the login endpoint, allowing 5 requests per 15 minutes per identifier and per 30 requests per 15 minutes per IP address
export const loginRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,
  keyPrefix: "login",
  identities: identifierAndIpLimits,
});

// This rate limiter is for the refresh token endpoint, allowing 30 requests per 15 minutes per IP address
export const refreshRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 30,
  keyPrefix: "refresh",
});

// This rate limiter is for sensitive account actions, allowing 5 requests per 15 minutes per account and per 30 requests per 15 minutes per IP address
export const sensitiveAccountRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,
  keyPrefix: "sensitive-account",
  identities: accountAndIpLimits,
});

// This rate limiter is for password reset requests, allowing 3 requests per hour per identifier and per 20 requests per hour per IP address
export const passwordResetRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 3,
  keyPrefix: "password-reset",
  identities: (req) =>
    identifierAndIpLimits(req).map((identity, index) => ({
      ...identity,
      limit: index === 0 ? 3 : 20,
    })),
});

// This rate limiter is for password reset confirmations, allowing 5 requests per hour per identifier and per 30 requests per hour per IP address
export const verificationRequestRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 6,
  keyPrefix: "verification-request",
  identities: (req) =>
    accountAndIpLimits(req).map((identity, index) => ({
      ...identity,
      limit: index === 0 ? 6 : 30,
    })),
});

// This rate limiter is for verification confirmations, allowing 10 requests per 15 minutes per account and per 50 requests per 15 minutes per IP address
export const verificationConfirmRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  keyPrefix: "verification-confirm",
  identities: (req) =>
    accountAndIpLimits(req).map((identity, index) => ({
      ...identity,
      limit: index === 0 ? 10 : 50,
    })),
});

export const guardInvitationRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  keyPrefix: "guard-invitation",
  identities: (req) => {
    const identifier =
      typeof req.body?.identifier === "string"
        ? req.body.identifier.trim().toLowerCase()
        : "invalid";
    return [
      { value: `account:${req.auth?.userId ?? "anonymous"}`, limit: 10 },
      { value: `identifier:${identifier}`, limit: 5 },
      { value: `ip:${req.ip ?? "unknown"}`, limit: 30 },
    ];
  },
});
