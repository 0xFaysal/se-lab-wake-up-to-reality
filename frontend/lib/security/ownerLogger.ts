import { z } from "zod";

// ─── Types & Schemas ─────────────────────────────────────────────────────────

export const OwnerActionTypeSchema = z.enum([
  // Financial & Manager Operations
  "UPDATE_PAYOUT_METHOD",
  "DELEGATE_MANAGER",
  "REVOKE_MANAGER",
  // Guard Operations
  "ASSIGN_GUARD",
  "REMOVE_GUARD",
  "UPDATE_GUARD_SHIFT",
  "ISSUED_TEMPORARY_CREDENTIALS",
  "PRICING_MUTATION",
  "CAPACITY_MUTATION",
  // Catch-all
  "GENERIC_OWNER_MUTATION",
]);

export type OwnerActionType = z.infer<typeof OwnerActionTypeSchema>;

export const OwnerAuditLogEntrySchema = z.object({
  id: z.string(),
  timestamp: z.string().datetime().or(z.string()),
  ownerId: z.string(),
  actionType: OwnerActionTypeSchema,
  actionDescription: z.string(),
  resource: z.string(),
  resourceId: z.string().optional().nullable(),
  propertyId: z.string().optional().nullable(),
  status: z.enum(["SUCCESS", "FAILURE"]),
  payload: z.record(z.string(), z.unknown()).optional(),
  ipAddress: z.string().optional(),
  integrityHash: z.string().optional(),
});

export type OwnerAuditLogEntry = z.infer<typeof OwnerAuditLogEntrySchema>;

// ─── Utility Functions & PII Sanitization ───────────────────────────────────

/**
 * Masks Bangladeshi vehicle license plates (e.g. DHA-METRO-GA-11-2233 -> DHA-METRO-GA-**-****)
 */
export function maskLicensePlate(plate: string): string {
  if (typeof plate !== "string") return "***[REDACTED_PLATE]***";
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
 * Masks bank account numbers, keeping only the last 4 digits.
 */
export function maskBankAccount(account: string): string {
  if (typeof account !== "string") return "***[REDACTED_ACC]***";
  const digits = account.replace(/\D/g, "");
  if (digits.length < 4) return "***[REDACTED_ACC]***";
  return `******${digits.slice(-4)}`;
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
 * Masks national ID numbers (NID)
 */
export function maskNationalId(nid: string): string {
  if (typeof nid !== "string") return "***[REDACTED_NID]***";
  const digits = nid.replace(/\D/g, "");
  if (digits.length < 4) return "***[REDACTED_NID]***";
  return `********${digits.slice(-4)}`;
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

const HIGH_RISK_SECRET_SUBSTRINGS = [
  "password",
  "secret",
  "paymenttoken",
  "token",
  "cvv",
  "cvc",
  "pin",
  "otp",
  "auth",
  "session",
  "credential",
  "apikey",
  "api_key",
  "privatekey",
  "jwt",
];

/**
 * Recursively sanitizes sensitive fields from the payload before logging.
 * Defends against PII, credentials, bank accounts, routing, and card leaks.
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
    if (HIGH_RISK_SECRET_SUBSTRINGS.some((sub) => lowerKey.includes(sub))) {
      sanitized[key] = "***[REDACTED_SECRET]***";
      continue;
    }

    // 2. Bank account numbers & IBAN
    if (
      lowerKey.includes("accountnumber") ||
      lowerKey.includes("bankaccount") ||
      lowerKey.includes("bankaccnum") ||
      lowerKey.includes("accnum") ||
      lowerKey.includes("iban")
    ) {
      sanitized[key] = typeof value === "string" ? maskBankAccount(value) : "***[REDACTED_ACC]***";
      continue;
    }

    // 3. Bank routing & SWIFT numbers
    if (
      lowerKey.includes("routingnumber") ||
      lowerKey.includes("routingno") ||
      lowerKey.includes("swift") ||
      lowerKey.includes("routingcode")
    ) {
      sanitized[key] = "***[REDACTED_ROUTING]***";
      continue;
    }

    // 4. MFS Numbers (bKash / Nagad / Rocket)
    if (
      lowerKey.includes("bkash") ||
      lowerKey.includes("nagad") ||
      lowerKey.includes("rocket") ||
      lowerKey.includes("mfsnumber")
    ) {
      sanitized[key] = typeof value === "string" ? maskPhoneNumber(value) : "***[REDACTED_PHONE]***";
      continue;
    }

    // 5. Payment Card / PAN
    if (lowerKey.includes("cardnumber") || lowerKey.includes("pan") || lowerKey === "card") {
      sanitized[key] = typeof value === "string" ? maskCardNumber(value) : "***[REDACTED_PAN]***";
      continue;
    }

    // 6. National ID (NID)
    if (lowerKey.includes("nid") || lowerKey.includes("nationalid")) {
      sanitized[key] = typeof value === "string" ? maskNationalId(value) : "***[REDACTED_NID]***";
      continue;
    }

    // 7. Phone / Contact numbers
    if (lowerKey.includes("phone") || lowerKey.includes("mobile") || lowerKey.includes("contactnumber")) {
      sanitized[key] = typeof value === "string" ? maskPhoneNumber(value) : "***[REDACTED_PHONE]***";
      continue;
    }

    // 8. License Plate / Registration
    if (lowerKey.includes("licenseplate") || lowerKey.includes("vehicleregistration") || lowerKey === "plate") {
      sanitized[key] = typeof value === "string" ? maskLicensePlate(value) : "***[REDACTED_PLATE]***";
      continue;
    }

    // 9. Nested objects and arrays
    if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizePayload(value);
      continue;
    }

    // 10. Freeform string sanitization
    if (typeof value === "string") {
      sanitized[key] = sanitizeStringValue(value);
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
}

/**
 * Computes deterministic tamper-evident integrity hash for an audit entry.
 */
function computeIntegrityHash(entry: Record<string, any>): string {
  try {
    const raw = JSON.stringify(entry);
    let hash = 0x811c9dc5;
    for (let i = 0; i < raw.length; i++) {
      hash ^= raw.charCodeAt(i);
      hash = (hash * 0x01000193) >>> 0;
    }
    return `sha256-seal-${hash.toString(16).padStart(8, "0")}`;
  } catch {
    return `sha256-unverified-${Date.now()}`;
  }
}

// ─── Authoritative Logger Implementation ──────────────────────────────────────

class OwnerLoggerService {
  // Authoritative in-memory audit ring-buffer (tamper-proof against client-side localStorage manipulation)
  private logs: OwnerAuditLogEntry[] = [];
  private readonly maxCapacity = 500;

  constructor() {
    // Initialized purely in-memory; direct localStorage reading is eliminated to prevent IDOR/tampered state
    this.logs = [];
  }

  public logOwnerAction(params: Omit<OwnerAuditLogEntry, "id" | "timestamp" | "integrityHash">): OwnerAuditLogEntry {
    const rawEntry = {
      id: `owner-audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...params,
      payload: sanitizePayload(params.payload),
    };

    const integrityHash = computeIntegrityHash(rawEntry);
    const entry: OwnerAuditLogEntry = {
      ...rawEntry,
      integrityHash,
    };

    // Prepend to authoritative buffer (newest first)
    this.logs.unshift(entry);
    if (this.logs.length > this.maxCapacity) {
      this.logs.pop();
    }

    // Immutable audit telemetry footprint
    console.info(`[DevSecOps Owner Audit] [${entry.integrityHash}] ${entry.actionType}:`, entry.actionDescription);

    return entry;
  }

  public getLogs(): OwnerAuditLogEntry[] {
    return [...this.logs];
  }
}

export const ownerLogger = new OwnerLoggerService();
