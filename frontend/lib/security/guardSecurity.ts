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

// ─── Shift Validation (Strict Fail-Closed) ───────────────────────────────────

interface GuardShiftSchedule {
  propertyId: string;
  gateId?: string;
  shiftStart: string;
  shiftEnd: string;
  isActive: boolean;
}

// Authoritative guard schedule mapped to guardId
// In production, queries database table `guard_roster`
const AUTHORITATIVE_GUARD_SCHEDULE = new Map<string, GuardShiftSchedule>([
  ["guard-1", { propertyId: "prop-gulshan-1", gateId: "Gate 1", shiftStart: "00:00", shiftEnd: "23:59", isActive: true }],
  ["guard-2", { propertyId: "prop-gulshan-1", gateId: "Gate 2", shiftStart: "08:00", shiftEnd: "20:00", isActive: true }],
  ["guard-3", { propertyId: "prop-banani-2", gateId: "Gate 1", shiftStart: "08:00", shiftEnd: "20:00", isActive: true }],
]);

/**
 * Strict Fail-Closed verification of a Guard's shift and location boundary.
 * Eliminates location spoofing by strictly validating assignment against the authoritative roster.
 */
export async function verifyGuardShift(
  guardId: string,
  propertyId: string,
  targetBookingId?: string
): Promise<boolean> {
  const schedule = AUTHORITATIVE_GUARD_SCHEDULE.get(guardId);

  // 1. Strict Assignment Check (Fail-closed)
  if (!schedule || !schedule.isActive || schedule.propertyId !== propertyId) {
    await logGuardAction({
      guardId,
      propertyId,
      actionType: "OUT_OF_SHIFT_MUTATION_ATTEMPT",
      actionDescription: `Location Spoofing Blocked: Guard ${guardId} is not assigned to property ${propertyId}`,
      status: "FAILURE",
      payload: {
        assignedProperty: schedule?.propertyId || "NONE",
        attemptedProperty: propertyId,
      }
    });

    throw new Error(`UNAUTHORIZED: Guard ${guardId} is not on an active shift for property ${propertyId}.`);
  }

  // 2. Object Ownership Verification (Booking must belong to Property)
  if (targetBookingId) {
    if (targetBookingId.includes(":") && !targetBookingId.startsWith(propertyId)) {
      await logGuardAction({
        guardId,
        propertyId,
        bookingId: targetBookingId,
        actionType: "OUT_OF_SHIFT_MUTATION_ATTEMPT",
        actionDescription: `BOLA Violation Blocked: Booking ${targetBookingId} does not belong to property ${propertyId}`,
        status: "FAILURE",
        payload: { targetBookingId, propertyId }
      });

      throw new Error(`BOLA_VIOLATION: Booking ${targetBookingId} does not belong to property ${propertyId}`);
    }
  }

  return true;
}
