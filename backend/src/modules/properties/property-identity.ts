import { createHmac } from "node:crypto";
import { env } from "../../config/env.js";

function normalizeText(value: string): string {
  return value.trim().toLocaleLowerCase("en-US").replace(/\s+/g, " ");
}

export function normalizePropertyName(value: string): string {
  return normalizeText(value);
}

export function fingerprintPropertyAddress(value: string): string {
  return createHmac("sha256", env.PROPERTY_ADDRESS_FINGERPRINT_SECRET)
    .update(normalizeText(value), "utf8")
    .digest("hex");
}
