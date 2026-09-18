import { z } from "zod";

// ─── Types & Schemas ─────────────────────────────────────────────────────────

export const ManagerActionTypeSchema = z.enum([
  "UPDATE_BOOKING",
  "UPDATE_GUARD_SHIFT",
  "CREATE_PARKING_RESOURCE",
  "UPDATE_PARKING_RESOURCE",
  "PERMISSION_DENIED_ATTEMPT",
  "REQUEST_SUBMITTED_TO_OWNER",
  "GENERIC_MANAGER_MUTATION"
]);

export type ManagerActionType = z.infer<typeof ManagerActionTypeSchema>;

export const ManagerAuditLogEntrySchema = z.object({
  id: z.string(),
  timestamp: z.string().datetime(),
  managerId: z.string(),
  ownerId: z.string().optional(),
  propertyId: z.string(),
  actionType: ManagerActionTypeSchema,
  actionDescription: z.string(),
  status: z.enum(["SUCCESS", "FAILURE"]),
  payload: z.record(z.string(), z.unknown()).optional(),
  ipAddress: z.string().optional(),
});

export type ManagerAuditLogEntry = z.infer<typeof ManagerAuditLogEntrySchema>;

// ─── Utility Functions ───────────────────────────────────────────────────────

/**
 * Sanitizes sensitive fields from the payload before logging.
 */
export function sanitizePayload(payload?: Record<string, any>): Record<string, any> | undefined {
  if (!payload) return undefined;
  
  const sanitized = { ...payload };
  const sensitiveKeys = ["temporaryPassword", "initialPassword", "confirmPassword", "password", "token", "secret"];

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

/**
 * Logs manager actions with a dual-footprint (managerId and propertyId).
 * Safe to be used in Server Actions.
 */
export async function logManagerAction(
  params: Omit<ManagerAuditLogEntry, "id" | "timestamp">,
  request?: Request
) {
  const entry: ManagerAuditLogEntry = {
    id: `mgr-audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
    ...params,
    payload: sanitizePayload(params.payload),
    ipAddress: request ? request.headers.get("x-forwarded-for") || undefined : undefined
  };

  // In a real application, write to database or remote logging system
  console.log(`[DevSecOps Manager Audit] ${entry.actionType}:`, JSON.stringify(entry, null, 2));
}

// ─── Authorization Scope Verification ────────────────────────────────────────

// In-memory cache for manager scopes to simulate optimization
// Key: `${managerId}:${propertyId}`
const managerScopeCache = new Map<string, Set<string>>();

/**
 * Simulates a highly-optimized RBAC check for the Manager's scope.
 * In a real application, this would query a fast redis cache.
 */
export async function verifyManagerScope(
  managerId: string,
  propertyId: string,
  requiredPermission: string
): Promise<boolean> {
  const cacheKey = `${managerId}:${propertyId}`;
  
  // Simulated Cache Miss / Hydration
  if (!managerScopeCache.has(cacheKey)) {
    // Populate mock permissions for this scope
    // In production, fetch from DB: SELECT permission FROM manager_delegations WHERE managerId = ? AND propertyId = ?
    managerScopeCache.set(cacheKey, new Set([
      "BOOKING_MANAGE",
      "GUARD_ASSIGN", 
      "RESOURCE_VIEW",
      "LISTING_VIEW"
    ]));
  }
  
  const permissions = managerScopeCache.get(cacheKey)!;
  const isAuthorized = permissions.has(requiredPermission);

  if (!isAuthorized) {
    await logManagerAction({
      managerId,
      propertyId,
      actionType: "PERMISSION_DENIED_ATTEMPT",
      actionDescription: `Denied ${requiredPermission} operation on property ${propertyId}`,
      status: "FAILURE",
      payload: { requiredPermission }
    });
    
    throw new Error(`UNAUTHORIZED: Manager ${managerId} lacks ${requiredPermission} on property ${propertyId}`);
  }

  return true;
}
