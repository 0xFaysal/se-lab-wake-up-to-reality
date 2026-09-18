import { createHmac } from "node:crypto";
import { env } from "../../config/env.js";

export function hashSensitiveMetadata(value: string): string {
  return createHmac("sha256", env.AUTH_METADATA_HASH_SECRET)
    .update(value)
    .digest("hex");
}
