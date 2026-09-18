import { z } from "zod";

// ─── Types & Schemas ─────────────────────────────────────────────────────────

export const OwnerActionTypeSchema = z.enum([
  // Financial & Manager Operations
  "UPDATE_PAYOUT_METHOD",
  "DELEGATE_MANAGER",
  "REVOKE_MANAGER",
  // Guard Operations (New)
  "ASSIGN_GUARD",
  "REMOVE_GUARD",
  "UPDATE_GUARD_SHIFT",
  "ISSUED_TEMPORARY_CREDENTIALS",
  // Catch-all
  "GENERIC_OWNER_MUTATION",
]);

export type OwnerActionType = z.infer<typeof OwnerActionTypeSchema>;

export const OwnerAuditLogEntrySchema = z.object({
  id: z.string(),
  timestamp: z.string().datetime(),
  ownerId: z.string(),
  actionType: OwnerActionTypeSchema,
  actionDescription: z.string(),
  resource: z.string(),
  resourceId: z.string().optional().nullable(),
  propertyId: z.string().optional().nullable(),
  status: z.enum(["SUCCESS", "FAILURE"]),
  payload: z.record(z.string(), z.unknown()).optional(),
  ipAddress: z.string().optional(),
});

export type OwnerAuditLogEntry = z.infer<typeof OwnerAuditLogEntrySchema>;

// ─── Utility Functions ───────────────────────────────────────────────────────

/**
 * Sanitizes sensitive fields from the payload before logging.
 * Specifically hunts for and masks fields named `temporaryPassword`,
 * `initialPassword`, or `confirmPassword`.
 */
export function sanitizePayload(payload?: Record<string, any>): Record<string, any> | undefined {
  if (!payload) return undefined;
  
  const sanitized = { ...payload };
  const sensitiveKeys = ["temporaryPassword", "initialPassword", "confirmPassword", "password"];

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.includes(key)) {
      sanitized[key] = "***[REDACTED]***";
    } else if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      sanitized[key] = sanitizePayload(sanitized[key]);
    }
  }

  return sanitized;
}

// ─── Logger Implementation ───────────────────────────────────────────────────

const STORAGE_KEY = "parkease_owner_audit_footprints";

class OwnerLoggerService {
  private logs: OwnerAuditLogEntry[] = [];

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.logs = JSON.parse(stored);
        }
      } catch {
        this.logs = [];
      }
    }
  }

  public logOwnerAction(params: Omit<OwnerAuditLogEntry, "id" | "timestamp">) {
    const entry: OwnerAuditLogEntry = {
      id: `owner-audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...params,
      payload: sanitizePayload(params.payload),
    };

    this.logs.unshift(entry);

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs));
    }

    // In a real app, we'd also send this to the backend API here.
    console.log(`[DevSecOps Owner Audit] ${entry.actionType}:`, entry);
  }

  public getLogs(): OwnerAuditLogEntry[] {
    return [...this.logs];
  }
}

export const ownerLogger = new OwnerLoggerService();
