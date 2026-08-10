import type { Request, RequestHandler } from "express";
import { AppError } from "../errors/app-error.js";

type RateLimitOptions = {
  windowMs: number;
  limit: number;
  keyPrefix: string;
  keyGenerator?: ((req: Request) => string) | undefined;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

function createRateLimit(options: RateLimitOptions): RequestHandler {
  const entries = new Map<string, RateLimitEntry>();

  return (req, res, next) => {
    const now = Date.now();
    const identity = options.keyGenerator?.(req) ?? req.ip ?? "unknown";
    const key = `${options.keyPrefix}:${identity}`;
    const existing = entries.get(key);
    const entry =
      !existing || existing.resetAt <= now
        ? { count: 0, resetAt: now + options.windowMs }
        : existing;

    entry.count += 1;
    entries.set(key, entry);

    const remaining = Math.max(0, options.limit - entry.count);
    const resetSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));

    res.setHeader("RateLimit-Limit", options.limit);
    res.setHeader("RateLimit-Remaining", remaining);
    res.setHeader("RateLimit-Reset", resetSeconds);

    if (entry.count > options.limit) {
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

    if (entries.size > 10_000) {
      for (const [entryKey, candidate] of entries) {
        if (candidate.resetAt <= now) entries.delete(entryKey);
      }
    }

    next();
  };
}

const accountAndIpKey = (req: Request) =>
  `${req.auth?.userId ?? "anonymous"}:${req.ip ?? "unknown"}`;

export const registerRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  keyPrefix: "register",
});

export const loginRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  keyPrefix: "login",
});

export const refreshRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  keyPrefix: "refresh",
});

export const sensitiveAccountRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  keyPrefix: "sensitive-account",
  keyGenerator: accountAndIpKey,
});

export const passwordResetRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  keyPrefix: "password-reset",
});

export const verificationRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  keyPrefix: "verification",
  keyGenerator: accountAndIpKey,
});
