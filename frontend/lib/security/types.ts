import { z } from "zod";
import type { ManagerPermissions as DataManagerPermissions } from "@/lib/data/mock-owner-data";

/**
 * Supported Manager Permission keys in ParkEase BD.
 * Supports both camelCase operational flags (from UI mock & state layer),
 * standard API scopes (from manager-api DTOs), and financial isolation flags.
 */
export const AppPermissionSchema = z.enum([
  // Core Operational Flags (from UI & Manager Delegation)
  "canViewProperty",
  "canEditProperty",
  "canManageParkingSpaces",
  "canManageAvailability",
  "canManagePricing",
  "canViewBookings",
  "canManageBookings",
  "canManageActiveSessions",
  "canManageGuards",
  "canRespondReviews",

  // High-Security & Financial Scopes
  "financial_access",
  "payout_manage",
  "bank_account_manage",
  "property_delete",
  "manager_assign",

  // Canonical API Scope Tokens
  "RESOURCE_VIEW",
  "LISTING_VIEW",
  "LISTING_MANAGE",
  "PRICE_MANAGE",
  "AVAILABILITY_MANAGE",
  "BOOKING_VIEW",
  "BOOKING_MANAGE",
  "IMAGE_MANAGE",
  "GUARD_VIEW",
  "GUARD_ADD_TO_PROPERTY",
  "GUARD_ASSIGN",
  "EARNINGS_VIEW",
  "REPORTS_VIEW",
]);

export type AppPermission = z.infer<typeof AppPermissionSchema>;

/**
 * Normalized manager permissions record used in components and contexts
 */
export type NormalizedPermissions = Record<AppPermission, boolean>;

/**
 * DevSecOps Audit Log Action Types
 */
export const AuditActionTypeSchema = z.enum([
  "CREATE",
  "UPDATE",
  "DELETE",
  "ACCESS",
  "REQUEST_APPROVAL",
  "APPROVE",
  "REJECT",
  "OVERRIDE",
]);

export type AuditActionType = z.infer<typeof AuditActionTypeSchema>;

/**
 * DevSecOps Audit Log Entry Schema & Type
 */
export const AuditLogEntrySchema = z.object({
  id: z.string().min(1),
  timestamp: z.string().datetime().or(z.string()),
  actionType: AuditActionTypeSchema,
  actionDescription: z.string(),
  resource: z.string(),
  resourceId: z.string().optional().nullable(),
  managerId: z.string(),
  managerName: z.string(),
  propertyId: z.string().optional().nullable(),
  propertyName: z.string().optional().nullable(),
  status: z.enum(["SUCCESS", "FAILURE", "PENDING_APPROVAL"]),
  metadata: z.record(z.string(), z.unknown()).optional(),
  ipAddress: z.string().optional(),
});

export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;

/**
 * Owner Approval Request Schema & Type
 */
export const ApprovalStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);
export type ApprovalStatus = z.infer<typeof ApprovalStatusSchema>;

export const ApprovalRequestSchema = z.object({
  id: z.string().min(1),
  managerId: z.string(),
  managerName: z.string(),
  managerEmail: z.string().email().optional(),
  actionType: z.string(), // e.g. "Add Property: Banani Office Hub"
  resource: z.string(), // e.g. "PROPERTY"
  resourceId: z.string().optional().nullable(),
  propertyName: z.string().optional().nullable(),
  payload: z.record(z.string(), z.unknown()),
  timestamp: z.string(),
  status: ApprovalStatusSchema,
  reviewedBy: z.string().optional().nullable(),
  reviewedAt: z.string().optional().nullable(),
  rejectionReason: z.string().optional().nullable(),
});

export type ApprovalRequest = z.infer<typeof ApprovalRequestSchema>;

/**
 * Helper to map standard mock DataManagerPermissions to NormalizedPermissions
 */
export function normalizePermissions(
  permissions?: Partial<DataManagerPermissions> | null,
  allowFinancial: boolean = false
): NormalizedPermissions {
  const p = permissions || {};

  return {
    canViewProperty: Boolean(p.canViewProperty ?? true),
    canEditProperty: Boolean(p.canEditProperty ?? false),
    canManageParkingSpaces: Boolean(p.canManageParkingSpaces ?? false),
    canManageAvailability: Boolean(p.canManageAvailability ?? false),
    canManagePricing: Boolean(p.canManagePricing ?? false),
    canViewBookings: Boolean(p.canViewBookings ?? true),
    canManageBookings: Boolean(p.canManageBookings ?? false),
    canManageActiveSessions: Boolean(p.canManageActiveSessions ?? false),
    canManageGuards: Boolean(p.canManageGuards ?? false),
    canRespondReviews: Boolean(p.canRespondReviews ?? false),

    // Strict zero-financial isolation by default
    financial_access: allowFinancial,
    payout_manage: false,
    bank_account_manage: false,
    property_delete: false,
    manager_assign: false,

    // Token mappings
    RESOURCE_VIEW: Boolean(p.canViewProperty ?? true),
    LISTING_VIEW: Boolean(p.canViewProperty ?? true),
    LISTING_MANAGE: Boolean(p.canEditProperty ?? false),
    PRICE_MANAGE: Boolean(p.canManagePricing ?? false),
    AVAILABILITY_MANAGE: Boolean(p.canManageAvailability ?? false),
    BOOKING_VIEW: Boolean(p.canViewBookings ?? true),
    BOOKING_MANAGE: Boolean(p.canManageBookings ?? false),
    IMAGE_MANAGE: Boolean(p.canEditProperty ?? false),
    GUARD_VIEW: Boolean(p.canManageGuards ?? false),
    GUARD_ADD_TO_PROPERTY: Boolean(p.canManageGuards ?? false),
    GUARD_ASSIGN: Boolean(p.canManageGuards ?? false),
    EARNINGS_VIEW: allowFinancial,
    REPORTS_VIEW: Boolean(p.canViewBookings ?? true),
  };
}
