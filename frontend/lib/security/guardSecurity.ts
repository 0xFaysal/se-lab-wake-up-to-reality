import { z } from "zod";

// ─── Types & Schemas ─────────────────────────────────────────────────────────

export const GuardActionTypeSchema = z.enum([
  "VEHICLE_CHECK_IN",
  "VEHICLE_CHECK_OUT",
  "INCIDENT_REPORTED",
  "SUCCESSFUL_VERIFICATION",
  "INVALID_PASS_ATTEMPT",
  "POTENTIAL_BRUTE_FORCE",
  "OUT_OF_SHIFT_MUTATION_ATTEMPT",
  "GENERIC_GUARD_ACTION"
]);

export type GuardActionType = z.infer<typeof GuardActionTypeSchema>;

export const GuardAuditLogEntrySchema = z.object({
  id: z.string(),
  timestamp: z.string().datetime(), // Strict server UTC time
  guardId: z.string(),
  propertyId: z.string(),
  bookingId: z.string().optional(),
  actionType: GuardActionTypeSchema,
  actionDescription: z.string(),
  status: z.enum(["SUCCESS", "FAILURE"]),
  payload: z.record(z.string(), z.unknown()).optional(),
  ipAddress: z.string().optional(),
});

export type GuardAuditLogEntry = z.infer<typeof GuardAuditLogEntrySchema>;

// ─── Utility Functions ───────────────────────────────────────────────────────

/**
 * Sanitizes sensitive fields from the payload before logging.
 */
export function sanitizePayload(payload?: Record<string, any>): Record<string, any> | undefined {
  if (!payload) return undefined;
  
  const sanitized = { ...payload };
  const sensitiveKeys = ["temporaryPassword", "initialPassword", "confirmPassword", "password", "token", "secret", "otp"];

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.includes(key.toLowerCase())) {
      sanitized[key] = "***[REDACTED]***";
    } else if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      sanitized[key] = sanitizePayload(sanitized[key]);
    }
  }

  return sanitized;
}

// ─── Logger Implementation ───────────────────────────────────────────────────

/**
 * Logs guard actions establishing an immutable physical footprint.
 * Enforces strict server UTC timestamps to prevent client-side time tampering.
 */
export async function logGuardAction(
  params: Omit<GuardAuditLogEntry, "id" | "timestamp">,
  request?: Request
) {
  const entry: GuardAuditLogEntry = {
    id: `guard-audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    // Immutable server timestamp, never trusting client devices
    timestamp: new Date().toISOString(),
    ...params,
    payload: sanitizePayload(params.payload),
    ipAddress: request ? request.headers.get("x-forwarded-for") || undefined : undefined
  };

  // In a real application, write this footprint to an immutable log database
  console.log(`[DevSecOps Guard Audit] ${entry.actionType}:`, JSON.stringify(entry, null, 2));
}

// ─── Shift Validation ────────────────────────────────────────────────────────

// In-memory mock for active guard shifts
// Key: `${guardId}:${propertyId}`
// Value: Object representing shift start/end bounds
const mockActiveShifts = new Map<string, { start: Date; end: Date }>();

/**
 * Verifies if the guard is currently on an active shift for the specific property.
 * This prevents out-of-bounds check-ins or location spoofing.
 */
export async function verifyGuardShift(
  guardId: string,
  propertyId: string
): Promise<boolean> {
  const cacheKey = `${guardId}:${propertyId}`;
  
  // Hydrate mock data (In production, query DB for active shift schedule)
  if (!mockActiveShifts.has(cacheKey)) {
    const now = new Date();
    // Default to an active shift covering the current time (for testing purposes)
    mockActiveShifts.set(cacheKey, {
      start: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
      end: new Date(now.getTime() + 4 * 60 * 60 * 1000)    // 4 hours from now
    });
  }

  const shift = mockActiveShifts.get(cacheKey)!;
  const currentTime = new Date();

  // Validate current time against shift boundaries
  const isShiftActive = currentTime >= shift.start && currentTime <= shift.end;

  if (!isShiftActive) {
    await logGuardAction({
      guardId,
      propertyId,
      actionType: "OUT_OF_SHIFT_MUTATION_ATTEMPT",
      actionDescription: `Guard attempted operation outside of assigned shift hours.`,
      status: "FAILURE",
      payload: {
        serverTime: currentTime.toISOString(),
        shiftStart: shift.start.toISOString(),
        shiftEnd: shift.end.toISOString()
      }
    });
    
    throw new Error(`UNAUTHORIZED: Guard ${guardId} is not on an active shift for property ${propertyId}.`);
  }

  return true;
}
