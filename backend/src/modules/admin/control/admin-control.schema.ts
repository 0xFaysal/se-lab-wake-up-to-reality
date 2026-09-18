import { z } from "zod";
import {
  AdminSubjectType,
  ContentArticleKind,
  ContentAudience,
  ContentStatus,
  EmailCampaignStatus,
  EmailDeliveryStatus,
  EmailTemplateType,
  LegalDocumentType,
  NotificationCampaignStatus,
  NotificationType,
  ParkingSpotStatus,
  PlatformFeeRuleStatus,
  PlatformFeeScopeType,
  PlatformFeeType,
  PropertyStatus,
  RiskLevel,
  UserRoleType,
} from "../../../../generated/prisma/client.js";
import { normalizeBangladeshPhone } from "../../../common/auth/phone.js";
import { SAFE_EMAIL_VARIABLES } from "../../../common/email/email-template.js";

const uuid = z.uuid();
const pageQuery = {
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
};
const reason = z.string().trim().min(10).max(500);
const isoDate = z.string().datetime({ offset: true });
const safeFullName = z.string().trim().min(2).max(120).regex(/^[^\x00-\x1F\x7F]+$/, "Full name must not contain control characters");
const normalizedEmail = z.string().trim().max(254).email().transform((value) => value.toLowerCase());
const bangladeshPhone = z.string().trim().min(10).max(20).transform((value, context) => {
  try {
    return normalizeBangladeshPhone(value);
  } catch {
    context.addIssue({ code: "custom", message: "Phone number must be a valid Bangladesh mobile number" });
    return z.NEVER;
  }
});

export const createAdminUserSchema = z.object({
  body: z.object({
    fullName: safeFullName,
    email: normalizedEmail,
    phone: bangladeshPhone,
    role: z.enum([UserRoleType.DRIVER, UserRoleType.PROVIDER, UserRoleType.MANAGER, UserRoleType.GUARD]),
  }).strict(),
});

export const updateAdminUserSchema = z.object({
  params: z.object({ id: uuid }).strict(),
  body: z.object({
    fullName: safeFullName.optional(),
    email: normalizedEmail.optional(),
    phone: bangladeshPhone.optional(),
  }).strict().refine((value) => Object.keys(value).length > 0, "At least one profile field is required"),
});

export const idParamsSchema = z.object({ params: z.object({ id: uuid }).strict() });

export const moderationSchema = z.object({
  params: z.object({ id: uuid }).strict(),
  body: z.object({ reason }).strict(),
});

export const notesQuerySchema = z.object({
  query: z.object({ ...pageQuery, subjectType: z.enum(AdminSubjectType).optional(), subjectId: uuid.optional() }).strict(),
});

export const createNoteSchema = z.object({
  body: z.object({ subjectType: z.enum(AdminSubjectType), subjectId: uuid, body: z.string().trim().min(2).max(3000) }).strict(),
});

export const updateNoteSchema = z.object({
  params: z.object({ id: uuid }).strict(),
  body: z.object({ body: z.string().trim().min(2).max(3000) }).strict(),
});

export const riskFlagsQuerySchema = z.object({
  query: z.object({ ...pageQuery, targetType: z.enum(AdminSubjectType).optional(), targetId: uuid.optional(), level: z.enum(RiskLevel).optional(), openOnly: z.enum(["true", "false"]).transform((value) => value === "true").optional() }).strict(),
});

export const createRiskFlagSchema = z.object({
  body: z.object({ targetType: z.enum(AdminSubjectType), targetId: uuid, level: z.enum(RiskLevel), reason: z.string().trim().min(10).max(1000) }).strict(),
});

export const resourcesQuerySchema = z.object({
  query: z.object({ ...pageQuery, search: z.string().trim().max(120).optional(), propertyId: uuid.optional(), providerUserId: uuid.optional(), type: z.enum(["FIXED_SPACE", "SHARED_POOL"]).optional(), status: z.enum(ParkingSpotStatus).optional() }).strict(),
});

export const resourceStatusSchema = z.object({
  params: z.object({ id: uuid }).strict(),
  body: z.object({ status: z.enum(ParkingSpotStatus), reason }).strict(),
});

export const propertyStatusSchema = z.object({
  params: z.object({ id: uuid }).strict(),
  body: z.object({ status: z.enum(PropertyStatus), reason, closedUntil: isoDate.nullable().optional() }).strict(),
});

export const analyticsQuerySchema = z.object({
  query: z.object({ from: isoDate.optional(), to: isoDate.optional(), granularity: z.enum(["day", "week", "month"]).default("day") }).strict(),
});

export const vehicleSearchSchema = z.object({
  query: z.object({ q: z.string().trim().min(2).max(50), limit: z.coerce.number().int().positive().max(50).default(20) }).strict(),
});

export const expiringRightsSchema = z.object({
  query: z.object({ days: z.coerce.number().int().refine((value) => value === 7 || value === 30 || value === 60, "Days must be 7, 30, or 60").default(30) }).strict(),
});

export const legalListSchema = z.object({
  query: z.object({ type: z.enum(LegalDocumentType).optional() }).strict(),
});

export const createLegalSchema = z.object({
  body: z.object({ type: z.enum(LegalDocumentType), version: z.string().trim().min(1).max(30), title: z.string().trim().min(3).max(150), content: z.string().trim().min(20).max(100_000), effectiveAt: isoDate }).strict(),
});

export const updateLegalDraftSchema = z.object({
  params: z.object({ id: uuid }).strict(),
  body: z.object({
    version: z.string().trim().min(1).max(30).optional(),
    title: z.string().trim().min(3).max(150).optional(),
    content: z.string().trim().min(20).max(100_000).optional(),
    effectiveAt: isoDate.optional(),
  }).strict().refine((value) => Object.keys(value).length > 0, "At least one draft field is required"),
});

export const articleListSchema = z.object({
  query: z.object({ ...pageQuery, kind: z.enum(ContentArticleKind).optional(), audience: z.enum(ContentAudience).optional(), status: z.enum(ContentStatus).optional() }).strict(),
});

export const createArticleSchema = z.object({
  body: z.object({ categoryId: uuid.optional(), kind: z.enum(ContentArticleKind), title: z.string().trim().min(3).max(180), slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(200), body: z.string().trim().min(20).max(100_000), audience: z.enum(ContentAudience), sortOrder: z.number().int().min(0).max(10_000).default(0) }).strict(),
});

export const createContentCategorySchema = z.object({
  body: z.object({ name: z.string().trim().min(2).max(120), slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(140), sortOrder: z.number().int().min(0).max(10_000).default(0) }).strict(),
});

export const updateArticleSchema = z.object({
  params: z.object({ id: uuid }).strict(),
  body: z.object({ categoryId: uuid.nullable().optional(), title: z.string().trim().min(3).max(180).optional(), slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(200).optional(), body: z.string().trim().min(20).max(100_000).optional(), audience: z.enum(ContentAudience).optional(), sortOrder: z.number().int().min(0).max(10_000).optional() }).strict(),
});

export const campaignListSchema = z.object({
  query: z.object({ ...pageQuery, status: z.enum(NotificationCampaignStatus).optional(), audience: z.enum(ContentAudience).optional() }).strict(),
});

export const notificationHistorySchema = z.object({
  query: z.object({ ...pageQuery, type: z.enum(NotificationType).optional(), userId: uuid.optional(), unreadOnly: z.enum(["true", "false"]).transform((value) => value === "true").optional() }).strict(),
});

export const createCampaignSchema = z.object({
  body: z.object({ title: z.string().trim().min(3).max(150), message: z.string().trim().min(5).max(500), audience: z.enum(ContentAudience), scheduledAt: isoDate.optional() }).strict(),
});

const emailValues = z.record(z.string().max(50), z.string().max(1000)).refine((value) => Object.keys(value).length <= 25, "No more than 25 template variables are allowed");
const emailTemplateBody = z.object({
  type: z.enum(EmailTemplateType),
  name: z.string().trim().min(3).max(150),
  subject: z.string().trim().min(3).max(200),
  preheader: z.string().trim().max(250).nullable().optional(),
  htmlBody: z.string().trim().min(10).max(200_000),
  textBody: z.string().trim().min(10).max(100_000),
  allowedVariables: z.array(z.enum(SAFE_EMAIL_VARIABLES)).max(SAFE_EMAIL_VARIABLES.length).default([]),
}).strict();

export const emailTemplateListSchema = z.object({ query: z.object({ ...pageQuery, type: z.enum(EmailTemplateType).optional(), status: z.enum(ContentStatus).optional() }).strict() });
export const createEmailTemplateSchema = z.object({ body: emailTemplateBody });
export const updateEmailTemplateSchema = z.object({
  params: z.object({ id: uuid }).strict(),
  body: emailTemplateBody.omit({ type: true }).partial().strict().refine((value) => Object.keys(value).length > 0, "At least one template field is required"),
});
export const previewEmailTemplateSchema = z.object({ params: z.object({ id: uuid }).strict(), body: z.object({ values: emailValues.default({}) }).strict() });
export const sendTestEmailSchema = z.object({ params: z.object({ id: uuid }).strict(), body: z.object({ to: normalizedEmail, values: emailValues.default({}) }).strict() });

const emailCampaignBody = z.object({
  title: z.string().trim().min(3).max(150),
  templateId: uuid,
  audience: z.enum(ContentAudience),
  subjectOverride: z.string().trim().min(3).max(200).nullable().optional(),
  htmlBodyOverride: z.string().trim().min(10).max(200_000).nullable().optional(),
  textBodyOverride: z.string().trim().min(10).max(100_000).nullable().optional(),
}).strict();
export const emailCampaignListSchema = z.object({ query: z.object({ ...pageQuery, status: z.enum(EmailCampaignStatus).optional(), audience: z.enum(ContentAudience).optional() }).strict() });
export const createEmailCampaignSchema = z.object({ body: emailCampaignBody });
export const updateEmailCampaignSchema = z.object({ params: z.object({ id: uuid }).strict(), body: emailCampaignBody.partial().strict().refine((value) => Object.keys(value).length > 0, "At least one campaign field is required") });
export const estimateEmailCampaignSchema = z.object({ query: z.object({ audience: z.enum(ContentAudience) }).strict() });
export const scheduleEmailCampaignSchema = z.object({ params: z.object({ id: uuid }).strict(), body: z.object({ scheduledAt: isoDate }).strict() });
export const emailDeliveryListSchema = z.object({ query: z.object({ ...pageQuery, status: z.enum(EmailDeliveryStatus).optional(), campaignId: uuid.optional() }).strict() });

export const feeRulesQuerySchema = z.object({
  query: z.object({ ...pageQuery, scopeType: z.enum(PlatformFeeScopeType).optional(), status: z.enum(PlatformFeeRuleStatus).optional() }).strict(),
});

export const createFeeRuleSchema = z.object({
  body: z.object({ scopeType: z.enum(PlatformFeeScopeType), scopeId: uuid.nullable().optional(), feeType: z.enum(PlatformFeeType), percentageBps: z.number().int().min(0).max(10_000).nullable().optional(), fixedAmountPaisa: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).nullable().optional(), effectiveFrom: isoDate, effectiveUntil: isoDate.nullable().optional(), reason }).strict().superRefine((value, context) => {
    if ((value.scopeType === "GLOBAL") !== (value.scopeId == null)) context.addIssue({ code: "custom", path: ["scopeId"], message: "Global rules cannot have a scope ID; scoped rules require one" });
    if (value.feeType === "PERCENTAGE" && (value.percentageBps == null || value.fixedAmountPaisa != null)) context.addIssue({ code: "custom", path: ["percentageBps"], message: "Percentage rules require basis points only" });
    if (value.feeType === "FIXED" && (value.fixedAmountPaisa == null || value.percentageBps != null)) context.addIssue({ code: "custom", path: ["fixedAmountPaisa"], message: "Fixed rules require a fixed amount only" });
    if (value.effectiveUntil && new Date(value.effectiveUntil) <= new Date(value.effectiveFrom)) context.addIssue({ code: "custom", path: ["effectiveUntil"], message: "End time must be after start time" });
  }),
});

export const updateFeeRuleSchema = z.object({
  params: z.object({ id: uuid }).strict(),
  body: z.object({
    scopeType: z.enum(PlatformFeeScopeType).optional(),
    scopeId: uuid.nullable().optional(),
    feeType: z.enum(PlatformFeeType).optional(),
    percentageBps: z.number().int().min(0).max(10_000).nullable().optional(),
    fixedAmountPaisa: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).nullable().optional(),
    effectiveFrom: isoDate.optional(),
    effectiveUntil: isoDate.nullable().optional(),
    reason: reason.optional(),
  }).strict().refine((value) => Object.keys(value).length > 0, "At least one fee field is required"),
});

export const scheduleFeeRuleSchema = z.object({
  params: z.object({ id: uuid }).strict(),
  body: z.object({ effectiveFrom: isoDate, reason }).strict(),
});

export const cloneFeeRuleSchema = z.object({
  params: z.object({ id: uuid }).strict(),
  body: z.object({ effectiveFrom: isoDate, effectiveUntil: isoDate.nullable().optional(), reason }).strict(),
});

export const adminRefundSchema = z.object({
  params: z.object({ id: uuid }).strict(),
  body: z.object({ amountPaisa: z.number().int().positive().max(Number.MAX_SAFE_INTEGER), reason, idempotencyKey: z.string().trim().min(8).max(100) }).strict(),
});

export const disputeReviewSchema = z.object({
  params: z.object({ id: uuid }).strict(),
  body: z.object({ reason, slaHours: z.number().int().min(1).max(168).default(48), escalate: z.boolean().default(false) }).strict(),
});

export const listingReportQuerySchema = z.object({ query: z.object({ ...pageQuery, status: z.enum(["OPEN", "RESOLVED", "DISMISSED"]).optional() }).strict() });

export const listingReportResolutionSchema = z.object({
  params: z.object({ id: uuid }).strict(),
  body: z.object({
    decision: z.enum(["RESOLVED", "DISMISSED"]),
    reason,
  }).strict(),
});
