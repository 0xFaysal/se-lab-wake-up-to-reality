import { apiClient } from "./api-client";
import type { PaginationDto, UserRole, UserStatus } from "./api-types";

export interface AdminDashboardSummary {
  users: { total: number; drivers: number; providers: number; managers: number; guards: number; suspended: number; blocked: number };
  properties: { total: number; verified: number; pending: number; rejected: number; inactive: number };
  marketplace: { activeResources: number; activeListings: number; upcomingBookings: number; activeSessions: number; checkoutRequested: number };
  finance: { paymentVolumePaisa: number; successfulPayments: number; platformRevenuePaisa: number; refundedPaisa: number; pendingProviderEarningsPaisa: number; providerLiabilityPaisa: number; pendingPayoutPaisa: number; completedPayoutPaisa: number };
  queues: { pendingProperties: number; pendingRights: number; openDisputes: number; pendingPayouts: number; suspendedListings: number };
  alerts: { failedPayments: number; overdueDisputes: number; payoutHolds: number; expiringRights: number; guardCoverageIssues: number };
  liveOperations: { upcomingBookings: number; activeSessions: number; checkoutRequested: number };
  trends: { bookings: Array<{ bucket: string; count: number }>; revenue: Array<{ bucket: string; count: number; amountPaisa: number }>; users: Array<{ bucket: string; count: number }> };
  recentActivity: AdminAuditEvent[];
}

export interface AdminUserSummary {
  id: string; fullName: string; email: string; phone: string; status: UserStatus;
  roles: UserRole[]; emailVerified: boolean; phoneVerified: boolean;
  lastLoginAt: string | null; createdAt: string; accountOrigin: string;
}

export interface AdminUserDetail extends Omit<AdminUserSummary, "roles"> {
  roles: Array<{ role: UserRole; createdAt: string }>;
  mustChangePassword: boolean; updatedAt: string; activeSessionCount: number;
  _count: { driverBookings: number; providerBookings: number; vehicles: number; providerMemberships: number; managerDelegations: number; propertyGuardMemberships: number };
  riskFlags: Array<{ id: string; level: string; reason: string; resolvedAt: string | null; createdAt: string; createdByAdmin: { id: string; fullName: string } }>;
  adminNotes: Array<{ id: string; body: string; createdAt: string; updatedAt: string; authorAdmin: { id: string; fullName: string } }>;
  refreshSessions: Array<{ id: string; rememberDevice: boolean; userAgent: string | null; expiresAt: string; revokedAt: string | null; createdAt: string }>;
  providerMemberships: Array<{ id: string; status: string; verificationStatus: string; joinedAt: string; property: { id: string; name: string } }>;
  managerDelegations: Array<{ id: string; status: string; validFrom: string | null; validUntil: string | null; property: { id: string; name: string } }>;
  propertyGuardMemberships: Array<{ id: string; status: string; joinedAt: string | null; property: { id: string; name: string } }>;
  vehicles: Array<{ id: string; registrationNumber: string; vehicleType: string; verificationStatus: string; isDefault: boolean }>;
  timeline: Array<{ id: string; eventType: string; entityType: string; entityId: string; requestId: string | null; metadata: unknown; createdAt: string; actor: { id: string; fullName: string } | null }>;
  bookingSummary: { driver: Array<{ status: string; _count: number }>; provider: Array<{ status: string; _count: number }> };
  providerOperations: {
    resources: Array<{ id: string; displayName: string | null; spotCode: string | null; resourceType: string; status: string; property: { id: string; name: string } }>;
    rights: Array<{ id: string; parkingSpotId: string; rightType: string; status: string; version: number; canList: boolean; validUntil: string | null }>;
    listings: Array<{ id: string; title: string; status: string; parkingSpotId: string; createdAt: string }>;
  };
}

export interface AdminLegalDocumentDetail {
  id: string; type: string; version: string; title: string; content: string | null; contentHash: string;
  effectiveAt: string; status: "DRAFT" | "PUBLISHED" | "ARCHIVED"; isActive: boolean;
  publishedAt: string | null; createdAt: string;
  createdByAdmin: { id: string; fullName: string; email: string } | null;
  _count: { acceptances: number };
  acceptances: Array<{ id: string; acceptedAt: string; acceptanceSource: string; user: { id: string; fullName: string; email: string } }>;
  versionHistory: Array<{ id: string; version: string; title: string; status: string; isActive: boolean; effectiveAt: string; publishedAt: string | null; createdAt: string; _count: { acceptances: number } }>;
}

export type EmailTemplateStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export interface AdminEmailTemplate {
  id: string; type: string; name: string; version: number; subject: string; preheader: string | null;
  htmlBody: string; textBody: string; allowedVariables: string[]; status: EmailTemplateStatus;
  publishedAt: string | null; archivedAt: string | null; createdAt: string; updatedAt: string;
  _count?: { campaigns: number; deliveries: number };
  versionHistory?: Array<{ id: string; version: number; name: string; status: EmailTemplateStatus; publishedAt: string | null; archivedAt: string | null; createdAt: string }>;
}

export interface AdminEmailCampaign {
  id: string; templateId: string; title: string; audience: string;
  status: "DRAFT" | "SCHEDULED" | "PROCESSING" | "SENT" | "FAILED" | "CANCELLED";
  subjectOverride: string | null; htmlBodyOverride: string | null; textBodyOverride: string | null;
  estimatedRecipientCount: number; scheduledAt: string | null; processingAt: string | null;
  sentAt: string | null; failedAt: string | null; cancelledAt: string | null; createdAt: string;
  template: Pick<AdminEmailTemplate, "id" | "name" | "type" | "version">;
  _count?: { deliveries: number };
  deliverySummary?: Array<{ status: string; _count: number }>;
}

export interface AdminEmailDelivery {
  id: string; campaignId: string | null; templateId: string; recipientEmail: string; subject: string;
  status: "QUEUED" | "PROCESSING" | "SENT" | "FAILED" | "CANCELLED"; attemptCount: number;
  providerMessage: string | null; sentAt: string | null; failedAt: string | null; createdAt: string;
}

export interface AdminPropertyRow {
  id: string; name: string; publicArea: string; approximateAddress: string;
  verificationStatus: string; status: string; canonicalPropertyId: string | null;
  archivedAt: string | null; createdAt: string; updatedAt: string;
  createdBy: { id: string; fullName: string; email: string };
  _count: { images: number; providerMemberships: number; parkingSpots: number; bookings: number };
}

export interface AdminBookingRow {
  id: string; bookingCode: string; status: string; startAt: string; scheduledEndAt: string;
  totalAmountPaisa: number; createdAt: string; checkedInAt: string | null;
  checkoutRequestedAt: string | null; checkedOutAt: string | null;
  driver: { id: string; fullName: string; email: string };
  provider: { id: string; fullName: string; email: string };
  property: { id: string; name: string; publicArea: string };
  parkingSpot: { id: string; displayName: string | null; spotCode: string | null; resourceType: string };
  payments: Array<{ id: string; status: string }>;
}

export interface AdminPaymentRow {
  id: string; amountPaisa: number; currency: string; status: string; provider: string;
  providerReference: string | null; capturedAt: string | null; failedAt: string | null;
  createdAt: string; refundedAmountPaisa: number;
  booking: { id: string; bookingCode: string; status: string };
  payer: { id: string; fullName: string; email: string };
}

export interface AdminLedgerRow {
  id: string; referenceType: string; referenceId: string | null; description: string;
  createdAt: string; debitPaisa: number; creditPaisa: number; balanced: boolean;
  actor: { id: string; fullName: string } | null;
}

export interface AdminAuditEvent {
  id: string; eventType: string; entityType: string; entityId: string;
  propertyId: string | null; createdAt: string;
  actor: { id: string; fullName: string; email: string } | null;
  property: { id: string; name: string } | null;
}

export interface AdminAnalyticsOverview {
  bookings: {
    trend: Array<{ bucket: string; count: number }>;
    byStatus: Array<{ status: string; _count: number }>;
    rates: { cancellationPercent: number; noShowPercent: number; disputePercent: number };
  };
  finance: {
    paymentTrend: Array<{ bucket: string; count: number; amountPaisa: number }>;
    refundTrend: Array<{ bucket: string; count: number; amountPaisa: number }>;
    totals: { paymentVolumePaisa: number; refundedPaisa: number; netVolumePaisa: number; successfulPayments: number; successfulRefunds: number; refundPercent: number };
  };
  users: {
    growth: Array<{ bucket: string; count: number }>;
    providerGrowth: Array<{ bucket: string; count: number }>;
    propertyGrowth: Array<{ bucket: string; count: number }>;
    byRole: Array<{ role: string; _count: number }>;
  };
  occupancy: {
    trend: Array<{ bucket: string; checkIns: number; completed: number }>;
    peakTimeHeatmap: Array<{ dayOfWeek: number; hour: number; checkIns: number }>;
    byResourceType: Array<{ resourceType: string; checkIns: number; distinctResources: number }>;
  };
}

export interface AdminActiveParkingVehicle {
  id: string; bookingCode: string; status: string; startAt: string; scheduledEndAt: string;
  checkedInAt: string | null; checkoutRequestedAt: string | null; overdue: boolean; overtimeMinutes: number;
  vehicle: { id: string; registrationNumber: string; vehicleType: string; brand: string | null; model: string | null; color: string | null };
  driver: { id: string; fullName: string; phone: string };
  property: { id: string; name: string; publicArea: string };
  parkingSpot: { id: string; displayName: string | null; spotCode: string | null; resourceType: string };
}

export interface AdminParkingOperationsSnapshot {
  generatedAt: string;
  properties: Array<{ id: string; name: string; publicArea: string; status: string; temporaryClosureReason: string | null; temporaryClosedUntil: string | null; capacity: number; occupied: number; reserved: number; available: number; utilizationPercent: number; activeGuards: number; guardCoverageGap: boolean }>;
  activeVehicles: AdminActiveParkingVehicle[];
  overstays: AdminActiveParkingVehicle[];
  entryExitLog: Array<{ id: string; eventType: string; entityId: string; metadata: unknown; createdAt: string; actor: { id: string; fullName: string } | null; property: { id: string; name: string } | null }>;
  sharedPools: Array<{ id: string; displayName: string | null; status: string; capacity: number; verifiedEntitlement: number; held: number; booked: number; checkedIn: number; remaining: number; property: { id: string; name: string } }>;
}

function queryString(input: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  return search.size ? `?${search.toString()}` : "";
}

export const adminOperationsApi = {
  dashboard: () => apiClient.get<AdminDashboardSummary>("/admin/dashboard/summary"),
  users: (filters: Record<string, string | number | boolean | undefined>) => apiClient.get<{ users: AdminUserSummary[]; pagination: PaginationDto }>(`/admin/users${queryString(filters)}`),
  user: (id: string) => apiClient.get<AdminUserDetail>(`/admin/users/${id}`),
  createUser: (body: { fullName: string; email: string; phone: string; role: "DRIVER" | "PROVIDER" | "MANAGER" | "GUARD" }) => apiClient.post<{ user: AdminUserSummary; developmentSetupToken?: string }>("/admin/users", body),
  updateUser: (id: string, body: { fullName?: string; email?: string; phone?: string }) => apiClient.patch<Pick<AdminUserSummary, "id" | "fullName" | "email" | "phone" | "status"> & { updatedAt: string }>(`/admin/users/${id}`, body),
  resendUserSetup: (id: string) => apiClient.post<{ userId: string; expiresAt: string; developmentSetupToken?: string }>(`/admin/users/${id}/resend-setup`, {}),
  properties: (filters: Record<string, string | number | boolean | undefined>) => apiClient.get<{ properties: AdminPropertyRow[]; pagination: PaginationDto }>(`/admin/properties${queryString(filters)}`),
  bookings: (filters: Record<string, string | number | undefined>) => apiClient.get<{ bookings: AdminBookingRow[]; pagination: PaginationDto }>(`/admin/bookings${queryString(filters)}`),
  booking: (id: string) => apiClient.get<Record<string, unknown>>(`/admin/bookings/${id}`),
  refundBooking: (id: string, body: { amountPaisa: number; reason: string; idempotencyKey: string }) => apiClient.post<Record<string, unknown>>(`/admin/bookings/${id}/refunds`, body),
  cancelBooking: (id: string, reason: string) => apiClient.post<Record<string, unknown>>(`/admin/bookings/${id}/cancel`, { reason }),
  sessions: (filters: Record<string, string | number | undefined>) => apiClient.get<{ bookings: AdminBookingRow[]; pagination: PaginationDto }>(`/admin/sessions${queryString(filters)}`),
  payments: (filters: Record<string, string | number | undefined>) => apiClient.get<{ payments: AdminPaymentRow[]; pagination: PaginationDto }>(`/admin/payments${queryString(filters)}`),
  payment: (id: string) => apiClient.get<Record<string, unknown>>(`/admin/payments/${id}`),
  refunds: (filters: Record<string, string | number | undefined>) => apiClient.get<{ refunds: Array<Record<string, unknown>>; pagination: PaginationDto }>(`/admin/refunds${queryString(filters)}`),
  ledger: (filters: Record<string, string | number | undefined>) => apiClient.get<{ transactions: AdminLedgerRow[]; pagination: PaginationDto }>(`/admin/ledger/transactions${queryString(filters)}`),
  ledgerTransaction: (id: string) => apiClient.get<Record<string, unknown>>(`/admin/ledger/transactions/${id}`),
  auditEvents: (filters: Record<string, string | number | undefined>) => apiClient.get<{ events: AdminAuditEvent[]; pagination: PaginationDto }>(`/admin/audit-events${queryString(filters)}`),
  auditEvent: (id: string) => apiClient.get<AdminAuditEvent>(`/admin/audit-events/${id}`),
  reviews: (filters: Record<string, string | number | boolean | undefined>) => apiClient.get<{ reviews: Array<Record<string, unknown>>; pagination: PaginationDto }>(`/admin/reviews${queryString(filters)}`),
  systemHealth: () => apiClient.get<Record<string, unknown>>("/admin/system/health"),
  capabilities: () => apiClient.get<Record<string, boolean>>("/admin/settings/capabilities"),
  moderateUser: (id: string, action: "suspend" | "unsuspend" | "block" | "unblock", reason: string) => apiClient.post<AdminUserSummary>(`/admin/users/${id}/${action}`, { reason }),
  revokeUserSessions: (id: string, reason: string) => apiClient.post<{ userId: string; revokedSessions: number }>(`/admin/users/${id}/logout-all`, { reason }),
  resources: (filters: Record<string, string | number | undefined>) => apiClient.get<{ resources: Array<Record<string, unknown>>; pagination: PaginationDto }>(`/admin/parking-resources${queryString(filters)}`),
  updateResourceStatus: (id: string, status: string, reason: string) => apiClient.patch<Record<string, unknown>>(`/admin/parking-resources/${id}/status`, { status, reason }),
  updatePropertyStatus: (id: string, body: { status: string; reason: string; closedUntil?: string | null }) => apiClient.patch<Record<string, unknown>>(`/admin/properties/${id}/status`, body),
  expiringRights: (days: 7 | 30 | 60 = 30) => apiClient.get<Array<Record<string, unknown>>>(`/admin/parking-rights/expiring?days=${days}`),
  conflictingRights: () => apiClient.get<Array<Record<string, unknown>>>("/admin/parking-rights/conflicts"),
  sharedPools: () => apiClient.get<Array<Record<string, unknown>>>("/admin/parking-rights/shared-pools"),
  parkingOperations: () => apiClient.get<AdminParkingOperationsSnapshot>("/admin/parking-operations"),
  vehicleSearch: (q: string) => apiClient.get<Array<Record<string, unknown>>>(`/admin/parking-operations/vehicle-search${queryString({ q })}`),
  reconciliation: () => apiClient.get<Record<string, unknown>>("/admin/finance/reconciliation"),
  analyticsOverview: (filters: Record<string, string | undefined> = {}) => apiClient.get<AdminAnalyticsOverview>(`/admin/analytics/overview${queryString(filters)}`),
  riskFlags: (filters: Record<string, string | number | boolean | undefined>) => apiClient.get<{ flags: Array<Record<string, unknown>>; pagination: PaginationDto }>(`/admin/risk-flags${queryString(filters)}`),
  createRiskFlag: (body: { targetType: string; targetId: string; level: string; reason: string }) => apiClient.post<Record<string, unknown>>("/admin/risk-flags", body),
  resolveRiskFlag: (id: string, reason: string) => apiClient.post<Record<string, unknown>>(`/admin/risk-flags/${id}/resolve`, { reason }),
  notes: (filters: Record<string, string | number | undefined>) => apiClient.get<{ notes: Array<Record<string, unknown>>; pagination: PaginationDto }>(`/admin/notes${queryString(filters)}`),
  createNote: (body: { subjectType: string; subjectId: string; body: string }) => apiClient.post<Record<string, unknown>>("/admin/notes", body),
  legalDocuments: (type?: string) => apiClient.get<Array<Record<string, unknown>>>(`/admin/content/legal${queryString({ type })}`),
  legalDocument: (id: string) => apiClient.get<AdminLegalDocumentDetail>(`/admin/content/legal/${id}`),
  createLegalDraft: (body: Record<string, unknown>) => apiClient.post<Record<string, unknown>>("/admin/content/legal", body),
  updateLegalDraft: (id: string, body: { version?: string; title?: string; content?: string; effectiveAt?: string }) => apiClient.patch<AdminLegalDocumentDetail>(`/admin/content/legal/${id}`, body),
  publishLegal: (id: string) => apiClient.post<Record<string, unknown>>(`/admin/content/legal/${id}/publish`),
  archiveLegal: (id: string, reason: string) => apiClient.post<Record<string, unknown>>(`/admin/content/legal/${id}/archive`, { reason }),
  articles: (filters: Record<string, string | number | undefined>) => apiClient.get<{ articles: Array<Record<string, unknown>>; pagination: PaginationDto }>(`/admin/content/articles${queryString(filters)}`),
  createArticle: (body: Record<string, unknown>) => apiClient.post<Record<string, unknown>>("/admin/content/articles", body),
  updateArticle: (id: string, body: Record<string, unknown>) => apiClient.patch<Record<string, unknown>>(`/admin/content/articles/${id}`, body),
  publishArticle: (id: string) => apiClient.post<Record<string, unknown>>(`/admin/content/articles/${id}/publish`),
  campaigns: (filters: Record<string, string | number | undefined>) => apiClient.get<{ campaigns: Array<Record<string, unknown>>; pagination: PaginationDto }>(`/admin/notification-campaigns${queryString(filters)}`),
  createCampaign: (body: { title: string; message: string; audience: string }) => apiClient.post<Record<string, unknown>>("/admin/notification-campaigns", body),
  sendCampaign: (id: string) => apiClient.post<Record<string, unknown>>(`/admin/notification-campaigns/${id}/send`),
  notificationHistory: (filters: Record<string, string | number | boolean | undefined>) => apiClient.get<{ notifications: Array<Record<string, unknown>>; pagination: PaginationDto }>(`/admin/notifications${queryString(filters)}`),
  emailTemplates: (filters: Record<string, string | number | undefined> = {}) => apiClient.get<{ templates: AdminEmailTemplate[]; pagination: PaginationDto }>(`/admin/communications/templates${queryString(filters)}`),
  emailTemplate: (id: string) => apiClient.get<AdminEmailTemplate>(`/admin/communications/templates/${id}`),
  createEmailTemplate: (body: Record<string, unknown>) => apiClient.post<AdminEmailTemplate>("/admin/communications/templates", body),
  updateEmailTemplate: (id: string, body: Record<string, unknown>) => apiClient.patch<AdminEmailTemplate>(`/admin/communications/templates/${id}`, body),
  cloneEmailTemplate: (id: string) => apiClient.post<AdminEmailTemplate>(`/admin/communications/templates/${id}/clone`, {}),
  publishEmailTemplate: (id: string) => apiClient.post<AdminEmailTemplate>(`/admin/communications/templates/${id}/publish`, {}),
  archiveEmailTemplate: (id: string, reason: string) => apiClient.post<AdminEmailTemplate>(`/admin/communications/templates/${id}/archive`, { reason }),
  previewEmailTemplate: (id: string, values: Record<string, string>) => apiClient.post<{ subject: string; html: string; text: string }>(`/admin/communications/templates/${id}/preview`, { values }),
  testEmailTemplate: (id: string, to: string, values: Record<string, string>) => apiClient.post<{ deliveryId: string; status: string }>(`/admin/communications/templates/${id}/test`, { to, values }),
  emailCampaigns: (filters: Record<string, string | number | undefined> = {}) => apiClient.get<{ campaigns: AdminEmailCampaign[]; pagination: PaginationDto }>(`/admin/communications/campaigns${queryString(filters)}`),
  emailCampaign: (id: string) => apiClient.get<AdminEmailCampaign>(`/admin/communications/campaigns/${id}`),
  previewEmailCampaign: (id: string, values: Record<string, string>) => apiClient.post<{ subject: string; html: string; text: string }>(`/admin/communications/campaigns/${id}/preview`, { values }),
  testEmailCampaign: (id: string, to: string, values: Record<string, string>) => apiClient.post<{ deliveryId: string; status: string }>(`/admin/communications/campaigns/${id}/test`, { to, values }),
  estimateEmailCampaign: (audience: string) => apiClient.get<{ audience: string; estimatedRecipientCount: number }>(`/admin/communications/campaigns/estimate${queryString({ audience })}`),
  createEmailCampaign: (body: Record<string, unknown>) => apiClient.post<AdminEmailCampaign>("/admin/communications/campaigns", body),
  updateEmailCampaign: (id: string, body: Record<string, unknown>) => apiClient.patch<AdminEmailCampaign>(`/admin/communications/campaigns/${id}`, body),
  scheduleEmailCampaign: (id: string, scheduledAt: string) => apiClient.post<AdminEmailCampaign>(`/admin/communications/campaigns/${id}/schedule`, { scheduledAt }),
  sendEmailCampaign: (id: string) => apiClient.post<{ campaign: AdminEmailCampaign; queuedDeliveries: number }>(`/admin/communications/campaigns/${id}/send`, {}),
  cancelEmailCampaign: (id: string) => apiClient.post<AdminEmailCampaign>(`/admin/communications/campaigns/${id}/cancel`, {}),
  emailDeliveries: (filters: Record<string, string | number | undefined> = {}) => apiClient.get<{ deliveries: AdminEmailDelivery[]; pagination: PaginationDto }>(`/admin/communications/deliveries${queryString(filters)}`),
  retryEmailDelivery: (id: string) => apiClient.post<{ id: string; status: string }>(`/admin/communications/deliveries/${id}/retry`, {}),
  feeRules: (filters: Record<string, string | number | undefined>) => apiClient.get<{ rules: Array<Record<string, unknown>>; resolutionPriority: string[]; pagination: PaginationDto }>(`/admin/platform-fees${queryString(filters)}`),
  createFeeRule: (body: Record<string, unknown>) => apiClient.post<Record<string, unknown>>("/admin/platform-fees", body),
  updateFeeRule: (id: string, body: Record<string, unknown>) => apiClient.patch<Record<string, unknown>>(`/admin/platform-fees/${id}`, body),
  cloneFeeRule: (id: string, body: { effectiveFrom: string; effectiveUntil?: string | null; reason: string }) => apiClient.post<Record<string, unknown>>(`/admin/platform-fees/${id}/clone`, body),
  scheduleFeeRule: (id: string, effectiveFrom: string, reason: string) => apiClient.post<Record<string, unknown>>(`/admin/platform-fees/${id}/schedule`, { effectiveFrom, reason }),
  activateFeeRule: (id: string, reason: string) => apiClient.post<Record<string, unknown>>(`/admin/platform-fees/${id}/activate`, { reason }),
  deactivateFeeRule: (id: string, reason: string) => apiClient.post<Record<string, unknown>>(`/admin/platform-fees/${id}/deactivate`, { reason }),
  archiveFeeRule: (id: string, reason: string) => apiClient.post<Record<string, unknown>>(`/admin/platform-fees/${id}/archive`, { reason }),
  deleteFeeRule: (id: string) => apiClient.delete<{ deleted: true }>(`/admin/platform-fees/${id}`),
  listingReports: (filters: Record<string, string | number | undefined>) => apiClient.get<{ reports: Array<Record<string, unknown>>; pagination: PaginationDto }>(`/admin/listing-reports${queryString(filters)}`),
  resolveListingReport: (id: string, decision: "RESOLVED" | "DISMISSED", reason: string) => apiClient.post<Record<string, unknown>>(`/admin/listing-reports/${id}/resolve`, { decision, reason }),
};
