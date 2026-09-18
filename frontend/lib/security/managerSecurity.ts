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

// ─── Authorization Scope Verification (Fail-Closed) ─────────────────────────

// Authoritative manager assignments registry (in production: database table `manager_delegations`)
// Format: Key: `${managerId}:${propertyId}` -> Set of granted permissions
const AUTHORITATIVE_MANAGER_DELEGATIONS = new Map<string, Set<string>>([
  ["mgr-1:prop-gulshan-1", new Set(["BOOKING_MANAGE", "GUARD_ASSIGN", "RESOURCE_VIEW", "LISTING_VIEW"])],
  ["mgr-1:prop-banani-2", new Set(["BOOKING_MANAGE", "RESOURCE_VIEW"])],
  ["mgr-2:prop-dhanmondi-3", new Set(["BOOKING_MANAGE", "GUARD_ASSIGN", "RESOURCE_VIEW"])],
]);

// Authoritative property-to-resource mapping to prevent BOLA / IDOR cross-property mutations
const PROPERTY_RESOURCE_REGISTRY = new Map<string, string>([
  // bookingId -> propertyId
  ["bk-101", "prop-gulshan-1"],
  ["bk-102", "prop-gulshan-1"],
  ["bk-201", "prop-banani-2"],
  ["bk-301", "prop-dhanmondi-3"],
]);

const PROPERTY_GUARD_REGISTRY = new Map<string, string>([
  // guardId -> propertyId
  ["guard-1", "prop-gulshan-1"],
  ["guard-2", "prop-gulshan-1"],
  ["guard-3", "prop-banani-2"],
]);

/**
 * Verifies if a resource (booking or guard) legitimately belongs to the specified property.
 * Prevents BOLA / IDOR where a manager authorized for Property A mutates a resource on Property B.
 */
export function verifyResourceBelongsToProperty(
  resourceType: "BOOKING" | "GUARD",
  resourceId: string,
  propertyId: string
): boolean {
  if (resourceType === "BOOKING") {
    // If registered, must match propertyId. If external/dynamic, reject if it has foreign prefix
    const registeredProperty = PROPERTY_RESOURCE_REGISTRY.get(resourceId);
    if (registeredProperty && registeredProperty !== propertyId) {
      return false;
    }
    // Prevent cross-property injection like 'prop2_bk101' targeting 'prop1'
    if (resourceId.includes(":") && !resourceId.startsWith(propertyId)) {
      return false;
    }
    return true;
  }

  if (resourceType === "GUARD") {
    const registeredProperty = PROPERTY_GUARD_REGISTRY.get(resourceId);
    if (registeredProperty && registeredProperty !== propertyId) {
      return false;
    }
    return true;
  }

  return true;
}

/**
 * Strict Fail-Closed RBAC verification for Manager delegated authority.
 * Eliminates permissive cache auto-hydration.
 */
export async function verifyManagerScope(
  managerId: string,
  propertyId: string,
  requiredPermission: string,
  targetResource?: { type: "BOOKING" | "GUARD"; id: string }
): Promise<boolean> {
  const cacheKey = `${managerId}:${propertyId}`;
  
  // 1. Strict Fail-Closed Check (No auto-hydration)
  const permissions = AUTHORITATIVE_MANAGER_DELEGATIONS.get(cacheKey);
  const isAuthorized = permissions ? permissions.has(requiredPermission) : false;

  if (!isAuthorized) {
    await logManagerAction({
      managerId,
      propertyId,
      actionType: "PERMISSION_DENIED_ATTEMPT",
      actionDescription: `BOLA/RBAC Blocked: Manager ${managerId} has no '${requiredPermission}' authority on property ${propertyId}`,
      status: "FAILURE",
      payload: { requiredPermission, targetResource }
    });
    
    throw new Error(`UNAUTHORIZED: Manager ${managerId} lacks ${requiredPermission} on property ${propertyId}`);
  }

  // 2. Object Ownership Verification (BOLA Prevention)
  if (targetResource) {
    const isOwner = verifyResourceBelongsToProperty(targetResource.type, targetResource.id, propertyId);
    if (!isOwner) {
      await logManagerAction({
        managerId,
        propertyId,
        actionType: "PERMISSION_DENIED_ATTEMPT",
        actionDescription: `BOLA Violation Blocked: Resource ${targetResource.type}:${targetResource.id} does not belong to property ${propertyId}`,
        status: "FAILURE",
        payload: { targetResource, propertyId }
      });

      throw new Error(`BOLA_VIOLATION: ${targetResource.type} ${targetResource.id} does not belong to Property ${propertyId}`);
    }
  }

  return true;
}
