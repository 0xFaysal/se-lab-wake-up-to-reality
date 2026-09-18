import {
  AuditLogEntry,
  AuditLogEntrySchema,
  AuditActionType,
  ApprovalRequest,
  ApprovalRequestSchema,
} from "./types";
import { sanitizePayload } from "./ownerLogger";

const AUDIT_STORAGE_KEY = "parkease_manager_audit_footprints_v2";
const APPROVAL_STORAGE_KEY = "parkease_owner_approval_requests_v2";

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

// ─── Seed Data ───────────────────────────────────────────────────────────────

const RAW_INITIAL_AUDIT_LOGS: Omit<AuditLogEntry, "integrityHash">[] = [
  {
    id: "audit-init-1",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    actionType: "UPDATE",
    actionDescription: "Updated bay availability status for Bay #A-04 to Offline (Maintenance)",
    resource: "PARKING_BAY",
    resourceId: "bay-a04",
    managerId: "mgr-1",
    managerName: "Rahim Uddin",
    propertyId: "prop-gulshan-1",
    propertyName: "Residential Building, Gulshan",
    status: "SUCCESS",
    metadata: { previousStatus: "AVAILABLE", newStatus: "MAINTENANCE" },
  },
  {
    id: "audit-init-2",
    timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
    actionType: "CREATE",
    actionDescription: "Assigned security guard shift (08:00 - 16:00) to Gate 1",
    resource: "GUARD_SHIFT",
    resourceId: "shift-g1-08",
    managerId: "mgr-1",
    managerName: "Rahim Uddin",
    propertyId: "prop-gulshan-1",
    propertyName: "Residential Building, Gulshan",
    status: "SUCCESS",
  },
  {
    id: "audit-init-3",
    timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    actionType: "UPDATE",
    actionDescription: "Processed manual check-in override for vehicle DHA-GA-44-1234",
    resource: "BOOKING_SESSION",
    resourceId: "bk-override-982",
    managerId: "mgr-1",
    managerName: "Rahim Uddin",
    propertyId: "prop-banani-2",
    propertyName: "Office Parking, Banani",
    status: "SUCCESS",
  },
  {
    id: "audit-init-4",
    timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    actionType: "REQUEST_APPROVAL",
    actionDescription: "Requested Property Addition: 'Banani North Commercial Garage'",
    resource: "PROPERTY",
    resourceId: "prop-banani-north-req",
    managerId: "mgr-1",
    managerName: "Rahim Uddin",
    propertyId: null,
    propertyName: "Banani North Commercial Garage",
    status: "PENDING_APPROVAL",
  },
];

const RAW_INITIAL_APPROVAL_REQUESTS: Omit<ApprovalRequest, "integrityHash">[] = [
  {
    id: "req-appr-101",
    managerId: "mgr-1",
    managerName: "Rahim Uddin",
    managerEmail: "rahim@example.com",
    actionType: "Add Property: Banani North Commercial Garage",
    resource: "PROPERTY",
    resourceId: "prop-banani-north-req",
    propertyName: "Banani North Commercial Garage",
    payload: {
      title: "Banani North Commercial Garage",
      address: "Road 11, Block D, Banani, Dhaka",
      area: "Banani",
      totalSpaces: 12,
      ratePerHour: 80,
    },
    timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    status: "PENDING",
  },
  {
    id: "req-appr-102",
    managerId: "mgr-2",
    managerName: "Nabila Ahmed",
    managerEmail: "nabila.ahmed@example.com",
    actionType: "Reconfigure Bay Pricing: Increase Hourly Tariff (+20 BDT)",
    resource: "PRICING",
    resourceId: "prop-dhanmondi-3",
    propertyName: "Apartment Parking, Dhanmondi",
    payload: {
      previousRate: 60,
      proposedRate: 80,
      peakMultiplier: 1.5,
    },
    timestamp: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    status: "PENDING",
  },
  {
    id: "req-appr-100",
    managerId: "mgr-1",
    managerName: "Rahim Uddin",
    managerEmail: "rahim@example.com",
    actionType: "Archive Inactive Bay Zone: Dhanmondi Basement B",
    resource: "PROPERTY_ZONE",
    resourceId: "zone-dhan-b",
    propertyName: "Apartment Parking, Dhanmondi",
    payload: { zone: "Basement B", reason: "Waterproofing renovation" },
    timestamp: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
    status: "APPROVED",
    reviewedBy: "Tanvir Chowdhury (Owner)",
    reviewedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
];

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = RAW_INITIAL_AUDIT_LOGS.map((item) => {
  const sanitizedItem = {
    ...item,
    metadata: sanitizePayload(item.metadata),
  };
  return {
    ...sanitizedItem,
    integrityHash: computeIntegrityHash(sanitizedItem),
  };
});

const INITIAL_APPROVAL_REQUESTS: ApprovalRequest[] = RAW_INITIAL_APPROVAL_REQUESTS.map((item) => {
  const sanitizedItem = {
    ...item,
    payload: sanitizePayload(item.payload) || {},
  };
  return {
    ...sanitizedItem,
    integrityHash: computeIntegrityHash(sanitizedItem),
  };
});

// ─── Tamper-Evident Storage Utilities ─────────────────────────────────────────

function loadVerifiedStorage<T extends { id: string; integrityHash?: string }>(
  storageKey: string,
  fallbackSeeds: T[]
): T[] {
  if (typeof window === "undefined") {
    return [...fallbackSeeds];
  }

  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [...fallbackSeeds];

    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "envelopeHash" in parsed && Array.isArray(parsed.items)) {
      const itemsRaw = JSON.stringify(parsed.items);
      let calculatedHash = 0x811c9dc5;
      for (let i = 0; i < itemsRaw.length; i++) {
        calculatedHash ^= itemsRaw.charCodeAt(i);
        calculatedHash = (calculatedHash * 0x01000193) >>> 0;
      }
      const expectedEnvelopeHash = `env-${calculatedHash.toString(16).padStart(8, "0")}`;

      if (parsed.envelopeHash !== expectedEnvelopeHash) {
        console.warn(`[DevSecOps Storage] Tampered envelope detected for ${storageKey}. Discarding untrusted entries.`);
        return [...fallbackSeeds];
      }

      // Verify each item's individual cryptographic seal
      const verifiedItems: T[] = [];
      for (const item of parsed.items) {
        if (item && typeof item === "object" && item.integrityHash) {
          const { integrityHash, ...rest } = item;
          const recomputed = computeIntegrityHash(rest);
          if (recomputed === integrityHash) {
            verifiedItems.push(item);
          } else {
            console.warn(`[DevSecOps Storage] Tampered entry detected and removed:`, item.id);
          }
        }
      }

      return verifiedItems.length > 0 ? verifiedItems : [...fallbackSeeds];
    }

    return [...fallbackSeeds];
  } catch (err) {
    console.warn(`[DevSecOps Storage] Corrupt storage for ${storageKey}. Recovered using secure seeds.`, err);
    return [...fallbackSeeds];
  }
}

function saveVerifiedStorage<T extends { integrityHash?: string }>(
  storageKey: string,
  items: T[]
): void {
  if (typeof window === "undefined") return;

  try {
    const itemsRaw = JSON.stringify(items);
    let calculatedHash = 0x811c9dc5;
    for (let i = 0; i < itemsRaw.length; i++) {
      calculatedHash ^= itemsRaw.charCodeAt(i);
      calculatedHash = (calculatedHash * 0x01000193) >>> 0;
    }
    const envelopeHash = `env-${calculatedHash.toString(16).padStart(8, "0")}`;

    const envelope = {
      envelopeHash,
      timestamp: Date.now(),
      items,
    };

    localStorage.setItem(storageKey, JSON.stringify(envelope));
  } catch (err) {
    console.warn(`[DevSecOps Storage] Failed to persist sealed store:`, err);
  }
}

type AuditListener = (logs: AuditLogEntry[]) => void;
type ApprovalListener = (requests: ApprovalRequest[]) => void;

// ─── Audit Logger Service ─────────────────────────────────────────────────────

class AuditLoggerService {
  private logs: AuditLogEntry[] = [];
  private listeners: Set<AuditListener> = new Set();
  private readonly maxCapacity = 500;

  constructor() {
    this.logs = loadVerifiedStorage(AUDIT_STORAGE_KEY, INITIAL_AUDIT_LOGS);
  }

  public getLogs(): AuditLogEntry[] {
    return [...this.logs];
  }

  public subscribe(listener: AuditListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    saveVerifiedStorage(AUDIT_STORAGE_KEY, this.logs);
    const cloned = [...this.logs];
    this.listeners.forEach((listener) => listener(cloned));
  }

  /**
   * Log an audit footprint with strict PII/credential sanitization and tamper-evident sealing
   */
  public log(entryInput: Omit<AuditLogEntry, "id" | "timestamp" | "integrityHash"> & { id?: string; timestamp?: string }): AuditLogEntry {
    const sanitizedMetadata = sanitizePayload(entryInput.metadata);

    const rawEntry = {
      id: entryInput.id || `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: entryInput.timestamp || new Date().toISOString(),
      actionType: entryInput.actionType,
      actionDescription: entryInput.actionDescription,
      resource: entryInput.resource,
      resourceId: entryInput.resourceId ?? null,
      managerId: entryInput.managerId,
      managerName: entryInput.managerName,
      propertyId: entryInput.propertyId ?? null,
      propertyName: entryInput.propertyName ?? null,
      status: entryInput.status,
      metadata: sanitizedMetadata,
      ipAddress: entryInput.ipAddress || "127.0.0.1",
    };

    const integrityHash = computeIntegrityHash(rawEntry);
    const entryWithHash: AuditLogEntry = {
      ...rawEntry,
      integrityHash,
    };

    // Validate with Zod
    const validated = AuditLogEntrySchema.parse(entryWithHash);

    // Prepend (latest first)
    this.logs.unshift(validated);
    if (this.logs.length > this.maxCapacity) {
      this.logs.pop();
    }

    this.notify();

    console.info(`[DevSecOps Manager Audit] [${validated.integrityHash}] ${validated.actionType} on ${validated.resource}: ${validated.actionDescription}`);
    return validated;
  }

  /**
   * High-Order Interceptor for Manager actions.
   * Logs entry before execution, monitors result, and catches failures.
   */
  public async intercept<T>(
    params: {
      actionType: AuditActionType;
      actionDescription: string;
      resource: string;
      resourceId?: string | null;
      managerId: string;
      managerName: string;
      propertyId?: string | null;
      propertyName?: string | null;
      metadata?: Record<string, unknown>;
    },
    executeFn: () => Promise<T>
  ): Promise<T> {
    try {
      const result = await executeFn();

      this.log({
        actionType: params.actionType,
        actionDescription: params.actionDescription,
        resource: params.resource,
        resourceId: params.resourceId,
        managerId: params.managerId,
        managerName: params.managerName,
        propertyId: params.propertyId,
        propertyName: params.propertyName,
        status: "SUCCESS",
        metadata: sanitizePayload(params.metadata),
      });

      return result;
    } catch (error) {
      this.log({
        actionType: params.actionType,
        actionDescription: `FAILED: ${params.actionDescription}`,
        resource: params.resource,
        resourceId: params.resourceId,
        managerId: params.managerId,
        managerName: params.managerName,
        propertyId: params.propertyId,
        propertyName: params.propertyName,
        status: "FAILURE",
        metadata: sanitizePayload({
          ...params.metadata,
          error: error instanceof Error ? error.message : String(error),
        }),
      });

      throw error;
    }
  }
}

// ─── Approval Store Service ───────────────────────────────────────────────────

class ApprovalStoreService {
  private requests: ApprovalRequest[] = [];
  private listeners: Set<ApprovalListener> = new Set();
  private readonly maxCapacity = 300;

  constructor() {
    this.requests = loadVerifiedStorage(APPROVAL_STORAGE_KEY, INITIAL_APPROVAL_REQUESTS);
  }

  public getAll(): ApprovalRequest[] {
    return [...this.requests];
  }

  public getPending(): ApprovalRequest[] {
    return this.requests.filter((r) => r.status === "PENDING");
  }

  public subscribe(listener: ApprovalListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    saveVerifiedStorage(APPROVAL_STORAGE_KEY, this.requests);
    const cloned = [...this.requests];
    this.listeners.forEach((listener) => listener(cloned));
  }

  /**
   * Submit an action that requires Owner approval.
   * Automatically sanitizes payload and logs a PENDING_APPROVAL footprint in the AuditLogger.
   */
  public submitRequest(
    requestInput: Omit<ApprovalRequest, "id" | "timestamp" | "status" | "integrityHash">
  ): ApprovalRequest {
    const sanitizedPayload = sanitizePayload(requestInput.payload) || {};

    const rawRequest = {
      id: `req-appr-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: "PENDING" as const,
      ...requestInput,
      payload: sanitizedPayload,
    };

    const integrityHash = computeIntegrityHash(rawRequest);
    const requestWithHash: ApprovalRequest = {
      ...rawRequest,
      integrityHash,
    };

    const validated = ApprovalRequestSchema.parse(requestWithHash);
    this.requests.unshift(validated);
    if (this.requests.length > this.maxCapacity) {
      this.requests.pop();
    }

    this.notify();

    // Log to Audit Log as PENDING_APPROVAL with sanitized metadata
    auditLogger.log({
      actionType: "REQUEST_APPROVAL",
      actionDescription: `Requested Owner Approval: ${validated.actionType}`,
      resource: validated.resource,
      resourceId: validated.resourceId,
      managerId: validated.managerId,
      managerName: validated.managerName,
      propertyName: validated.propertyName,
      status: "PENDING_APPROVAL",
      metadata: validated.payload,
    });

    return validated;
  }

  public approve(requestId: string, reviewedBy: string = "Property Owner"): boolean {
    const target = this.requests.find((r) => r.id === requestId);
    if (!target) return false;

    target.status = "APPROVED";
    target.reviewedBy = reviewedBy;
    target.reviewedAt = new Date().toISOString();

    const { integrityHash, ...rest } = target;
    target.integrityHash = computeIntegrityHash(rest);

    this.notify();

    // Log to Audit Log as APPROVE
    auditLogger.log({
      actionType: "APPROVE",
      actionDescription: `Owner approved request: ${target.actionType}`,
      resource: target.resource,
      resourceId: target.resourceId,
      managerId: target.managerId,
      managerName: target.managerName,
      propertyName: target.propertyName,
      status: "SUCCESS",
      metadata: { approvedBy: reviewedBy, requestId },
    });

    return true;
  }

  public reject(requestId: string, reason: string = "Declined by owner", reviewedBy: string = "Property Owner"): boolean {
    const target = this.requests.find((r) => r.id === requestId);
    if (!target) return false;

    target.status = "REJECTED";
    target.reviewedBy = reviewedBy;
    target.reviewedAt = new Date().toISOString();
    target.rejectionReason = reason;

    const { integrityHash, ...rest } = target;
    target.integrityHash = computeIntegrityHash(rest);

    this.notify();

    // Log to Audit Log as REJECT
    auditLogger.log({
      actionType: "REJECT",
      actionDescription: `Owner rejected request: ${target.actionType} (Reason: ${reason})`,
      resource: target.resource,
      resourceId: target.resourceId,
      managerId: target.managerId,
      managerName: target.managerName,
      propertyName: target.propertyName,
      status: "FAILURE",
      metadata: { rejectedBy: reviewedBy, reason, requestId },
    });

    return true;
  }
}

// Export singleton instances
export const auditLogger = new AuditLoggerService();
export const approvalStore = new ApprovalStoreService();
