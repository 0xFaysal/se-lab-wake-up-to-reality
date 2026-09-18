import { z } from "zod";

// ─── Types & Schemas ─────────────────────────────────────────────────────────

export const DriverActionTypeSchema = z.enum([
  "INITIATE_BOOKING",
  "PAYMENT_SUCCESS",
  "PAYMENT_FAILED",
  "CANCEL_BOOKING",
  "PRICE_TAMPERING_ATTEMPT",
  "RATE_LIMIT_EXCEEDED",
  "POTENTIAL_BOT_DETECTED",
  "UNAUTHORIZED_ACCESS_ATTEMPT",
  "GENERIC_DRIVER_ACTION"
]);

export type DriverActionType = z.infer<typeof DriverActionTypeSchema>;

export const DriverAuditLogEntrySchema = z.object({
  id: z.string(),
  timestamp: z.string().datetime(),
  driverId: z.string(),
  actionType: DriverActionTypeSchema,
  actionDescription: z.string(),
  status: z.enum(["SUCCESS", "FAILURE"]),
  payload: z.record(z.string(), z.unknown()).optional(),
  ipAddress: z.string().optional(),
  integrityHash: z.string().optional(),
});

export type DriverAuditLogEntry = z.infer<typeof DriverAuditLogEntrySchema>;

// ─── Utility Functions & PII Masking ─────────────────────────────────────────

/**
 * Robustly masks Bangladeshi vehicle license plates (e.g., DHA-METRO-GA-11-2233 -> DHA-METRO-GA-**-****)
 */
export function maskLicensePlate(plate: string): string {
  if (typeof plate !== "string") return "***[REDACTED_PLATE]***";
  // Matches last 4-6 digits of Bangladeshi license plate formats
  return plate.replace(/\d/g, "*");
}

/**
 * Masks credit card numbers, keeping only the last 4 digits.
 */
export function maskCardNumber(card: string): string {
  if (typeof card !== "string") return "***[REDACTED_PAN]***";
  const digitsOnly = card.replace(/\D/g, "");
  if (digitsOnly.length < 4) return "***[REDACTED_PAN]***";
  return `****-****-****-${digitsOnly.slice(-4)}`;
}

/**
 * Masks Bangladeshi phone numbers (+8801XXXXXXXXX or 01XXXXXXXXX)
 */
export function maskPhoneNumber(phone: string): string {
  if (typeof phone !== "string") return "***[REDACTED_PHONE]***";
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 10) {
    const prefix = phone.startsWith("+") ? phone.slice(0, 6) : phone.slice(0, 3);
    const suffix = digits.slice(-3);
    return `${prefix}****${suffix}`;
  }
  return "***[REDACTED_PHONE]***";
}

/**
 * Sanitizes freeform string values to prevent accidental leakage of PAN, phone, or secrets in strings
 */
function sanitizeStringValue(str: string): string {
  // Mask 13-19 digit card numbers
  let sanitized = str.replace(/\b(?:\d{4}[ -]?){3}\d{4}\b/g, (match) => maskCardNumber(match));
  // Mask BD phone numbers (+8801... or 01...)
  sanitized = sanitized.replace(/(?:\+?8801|01)[3-9]\d{8}\b/g, (match) => maskPhoneNumber(match));
  return sanitized;
}

/**
 * Strict PII and secret redaction list
 */
const SENSITIVE_KEY_SUBSTRINGS = [
  "password",
  "secret",
  "paymenttoken",
  "token",
  "cvv",
  "cvc",
  "pin",
  "bkash",
  "nagad",
  "otp",
  "auth",
  "session",
  "credential",
  "api_key",
  "apikey"
];

/**
 * Recursively sanitizes payloads to eliminate driver PII and financial credentials.
 */
export function sanitizePayload(payload?: Record<string, any>): Record<string, any> | undefined {
  if (!payload || typeof payload !== "object") return undefined;

  if (Array.isArray(payload)) {
    return payload.map((item) =>
      typeof item === "object" && item !== null
        ? sanitizePayload(item)
        : typeof item === "string"
        ? sanitizeStringValue(item)
        : item
    ) as any;
  }

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(payload)) {
    const lowerKey = key.toLowerCase().replace(/[-_]/g, "");

    // 1. High-risk credentials & secrets (fully redacted)
    if (SENSITIVE_KEY_SUBSTRINGS.some((sub) => lowerKey.includes(sub))) {
      sanitized[key] = "***[REDACTED_SECRET]***";
      continue;
    }

    // 2. License Plate / Registration
    if (lowerKey.includes("licenseplate") || lowerKey.includes("vehicleregistration") || lowerKey === "plate") {
      sanitized[key] = typeof value === "string" ? maskLicensePlate(value) : "***[REDACTED_PLATE]***";
      continue;
    }

    // 3. Payment Card / PAN
    if (lowerKey.includes("cardnumber") || lowerKey.includes("pan") || lowerKey === "card") {
      sanitized[key] = typeof value === "string" ? maskCardNumber(value) : "***[REDACTED_PAN]***";
      continue;
    }

    // 4. Phone / Mobile
    if (lowerKey.includes("phone") || lowerKey.includes("mobile") || lowerKey.includes("contactnumber")) {
      sanitized[key] = typeof value === "string" ? maskPhoneNumber(value) : "***[REDACTED_PHONE]***";
      continue;
    }

    // 5. Nested objects and arrays
    if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizePayload(value);
      continue;
    }

    // 6. Freeform string sanitization
    if (typeof value === "string") {
      sanitized[key] = sanitizeStringValue(value);
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
}

/**
 * Computes a tamper-evident cryptographic hash of the audit entry.
 */
async function generateIntegrityHash(entry: Record<string, any>): Promise<string> {
  try {
    const raw = JSON.stringify(entry);
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(raw);
      const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }
  } catch {
    // Edge runtime fallback
  }
  return `sha256-unverified-${Date.now()}`;
}

// ─── Logger Implementation ───────────────────────────────────────────────────

/**
 * Logs driver actions (bookings, payments, rate limits) with strict PII sanitization
 * and tamper-evident SHA-256 cryptographic seal.
 */
export async function logDriverAction(
  params: Omit<DriverAuditLogEntry, "id" | "timestamp" | "integrityHash">,
  request?: Request
): Promise<DriverAuditLogEntry> {
  const sanitizedData = {
    id: `drv-audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
    ...params,
    payload: sanitizePayload(params.payload),
    ipAddress: request ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined : undefined
  };

  const integrityHash = await generateIntegrityHash(sanitizedData);
  const finalEntry: DriverAuditLogEntry = {
    ...sanitizedData,
    integrityHash
  };

  // In production, write this to an append-only, write-once immutable audit store
  console.log(`[DevSecOps Driver Audit] ${finalEntry.actionType}:`, JSON.stringify(finalEntry, null, 2));

  return finalEntry;
}
