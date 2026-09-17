import {
  AuditLogEntry,
  AuditLogEntrySchema,
  AuditActionType,
  ApprovalRequest,
  ApprovalRequestSchema,
} from "./types";

const AUDIT_STORAGE_KEY = "parkease_manager_audit_footprints";
const APPROVAL_STORAGE_KEY = "parkease_owner_approval_requests";

// Default seed audit logs for demo & initial renders
const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
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

// Initial seed approval requests for Owner UI
const INITIAL_APPROVAL_REQUESTS: ApprovalRequest[] = [
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

type AuditListener = (logs: AuditLogEntry[]) => void;
type ApprovalListener = (requests: ApprovalRequest[]) => void;

class AuditLoggerService {
  private logs: AuditLogEntry[] = [];
  private listeners: Set<AuditListener> = new Set();

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(AUDIT_STORAGE_KEY);
        if (stored) {
          this.logs = JSON.parse(stored);
        } else {
          this.logs = [...INITIAL_AUDIT_LOGS];
          localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(this.logs));
        }
      } catch {
        this.logs = [...INITIAL_AUDIT_LOGS];
      }
    } else {
      this.logs = [...INITIAL_AUDIT_LOGS];
    }
  }

  public getLogs(): AuditLogEntry[] {
    return [...this.logs];
  }

  public subscribe(listener: AuditListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(this.logs));
      } catch (err) {
        console.warn("[AuditLogger] Failed to write to localStorage:", err);
      }
    }
    const cloned = [...this.logs];
    this.listeners.forEach((listener) => listener(cloned));
  }

  /**
   * Log an audit footprint directly
   */
  public log(entryInput: Omit<AuditLogEntry, "id" | "timestamp"> & { id?: string; timestamp?: string }): AuditLogEntry {
    const entry: AuditLogEntry = {
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
      metadata: entryInput.metadata,
      ipAddress: entryInput.ipAddress || "127.0.0.1",
    };

    // Validate with Zod
    const validated = AuditLogEntrySchema.parse(entry);

    // Prepend (latest first)
    this.logs.unshift(validated);
    this.notify();

    console.info(`[DevSecOps Audit] ${validated.actionType} on ${validated.resource}: ${validated.actionDescription}`);
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
        metadata: params.metadata,
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
        metadata: {
          ...params.metadata,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      throw error;
    }
  }
}

class ApprovalStoreService {
  private requests: ApprovalRequest[] = [];
  private listeners: Set<ApprovalListener> = new Set();

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(APPROVAL_STORAGE_KEY);
        if (stored) {
          this.requests = JSON.parse(stored);
        } else {
          this.requests = [...INITIAL_APPROVAL_REQUESTS];
          localStorage.setItem(APPROVAL_STORAGE_KEY, JSON.stringify(this.requests));
        }
      } catch {
        this.requests = [...INITIAL_APPROVAL_REQUESTS];
      }
    } else {
      this.requests = [...INITIAL_APPROVAL_REQUESTS];
    }
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
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(APPROVAL_STORAGE_KEY, JSON.stringify(this.requests));
      } catch (err) {
        console.warn("[ApprovalStore] Failed to write to localStorage:", err);
      }
    }
    const cloned = [...this.requests];
    this.listeners.forEach((listener) => listener(cloned));
  }

  /**
   * Submit an action that requires Owner approval.
   * Automatically logs a PENDING_APPROVAL footprint in the AuditLogger.
   */
  public submitRequest(
    requestInput: Omit<ApprovalRequest, "id" | "timestamp" | "status">
  ): ApprovalRequest {
    const request: ApprovalRequest = {
      id: `req-appr-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: "PENDING",
      ...requestInput,
    };

    const validated = ApprovalRequestSchema.parse(request);
    this.requests.unshift(validated);
    this.notify();

    // Log to Audit Log as PENDING_APPROVAL
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
