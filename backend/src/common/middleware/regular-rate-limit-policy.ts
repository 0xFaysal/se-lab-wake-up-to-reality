import type { Request } from "express";

export const locationReadPolicy = {
  windowMs: 60_000,
  limit: 120,
  keyPrefix: "driver-location-read",
  identities: (req: Request) => [
    { value: `account:${req.auth?.userId ?? "anonymous"}`, limit: 120 },
    { value: `ip:${req.ip ?? "unknown"}`, limit: 600 },
  ],
};

export const profileUpdatePolicy = {
  windowMs: 15 * 60_000,
  limit: 30,
  keyPrefix: "profile-update",
  identities: (req: Request) => [
    { value: `account:${req.auth?.userId ?? "anonymous"}`, limit: 30 },
    { value: `ip:${req.ip ?? "unknown"}`, limit: 150 },
  ],
};
