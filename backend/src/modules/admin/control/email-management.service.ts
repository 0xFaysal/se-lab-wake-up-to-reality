import {
  ContentAudience,
  ContentStatus,
  DomainAuditEventType,
  EmailCampaignStatus,
  EmailDeliveryStatus,
  EmailTemplateType,
  Prisma,
  UserRoleType,
  UserStatus,
} from "../../../../generated/prisma/client.js";
import { renderEmailTemplate, validateEmailTemplateVariables } from "../../../common/email/email-template.js";
import { sendManagedEmail } from "../../../common/email/email.service.js";
import { AppError } from "../../../common/errors/app-error.js";
import { prisma } from "../../../config/prisma.js";
import { createDomainAuditEvent } from "../../property-governance/domain-audit.js";
import { lockEntity } from "../../marketplace/marketplace.repository.js";

type Page = { page: number; limit: number };
type TemplateDraftInput = {
  type: EmailTemplateType;
  name: string;
  subject: string;
  preheader?: string | null;
  htmlBody: string;
  textBody: string;
  allowedVariables: string[];
};
type CampaignContentInput = {
  title: string;
  templateId: string;
  audience: ContentAudience;
  subjectOverride?: string | null;
  htmlBodyOverride?: string | null;
  textBodyOverride?: string | null;
};

function fail(statusCode: number, code: string, message: string, details?: unknown): never {
  throw new AppError({ message, statusCode, code, ...(details === undefined ? {} : { details }) });
}

function pagination(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

function assertTemplateVariables(input: TemplateDraftInput) {
  try {
    validateEmailTemplateVariables(input);
  } catch (error) {
    fail(400, "EMAIL_TEMPLATE_VARIABLE_INVALID", error instanceof Error ? error.message : "Email template variables are invalid");
  }
}

function recipientWhere(audience: ContentAudience): Prisma.UserWhereInput {
  const role = audience === ContentAudience.ALL ? undefined : audience as UserRoleType;
  return {
    status: UserStatus.ACTIVE,
    deletedAt: null,
    emailVerifiedAt: { not: null },
    ...(role ? { roles: { some: { role } } } : {}),
  };
}

async function audit(tx: Prisma.TransactionClient, input: {
  eventType: DomainAuditEventType;
  actorUserId: string;
  entityType: string;
  entityId: string;
  requestId?: string | undefined;
  metadata?: Record<string, string | number | boolean | null> | undefined;
}) {
  await createDomainAuditEvent(tx, input);
}

export async function listEmailTemplates(query: Page & { type?: EmailTemplateType; status?: ContentStatus }) {
  const where: Prisma.EmailTemplateWhereInput = {
    ...(query.type ? { type: query.type } : {}),
    ...(query.status ? { status: query.status } : {}),
  };
  const [templates, total] = await Promise.all([
    prisma.emailTemplate.findMany({
      where,
      orderBy: [{ type: "asc" }, { version: "desc" }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: { createdByAdmin: { select: { id: true, fullName: true } }, _count: { select: { campaigns: true, deliveries: true } } },
    }),
    prisma.emailTemplate.count({ where }),
  ]);
  return { templates, pagination: pagination(query.page, query.limit, total) };
}

export async function getEmailTemplate(templateId: string) {
  const template = await prisma.emailTemplate.findUnique({
    where: { id: templateId },
    include: {
      createdByAdmin: { select: { id: true, fullName: true, email: true } },
      _count: { select: { campaigns: true, deliveries: true } },
    },
  });
  if (!template) fail(404, "EMAIL_TEMPLATE_NOT_FOUND", "Email template was not found");
  const versionHistory = await prisma.emailTemplate.findMany({
    where: { type: template.type },
    orderBy: { version: "desc" },
    select: { id: true, version: true, name: true, status: true, publishedAt: true, archivedAt: true, createdAt: true },
  });
  return { ...template, versionHistory };
}

export async function createEmailTemplateDraft(adminUserId: string, input: TemplateDraftInput, requestId?: string) {
  assertTemplateVariables(input);
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "email-template-type", input.type);
    const latest = await tx.emailTemplate.findFirst({ where: { type: input.type }, orderBy: { version: "desc" }, select: { id: true, version: true } });
    const template = await tx.emailTemplate.create({
      data: {
        ...input,
        preheader: input.preheader ?? null,
        version: (latest?.version ?? 0) + 1,
        supersedesTemplateId: latest?.id ?? null,
        status: ContentStatus.DRAFT,
        createdByAdminId: adminUserId,
      },
    });
    await audit(tx, { eventType: DomainAuditEventType.EMAIL_TEMPLATE_UPDATED, actorUserId: adminUserId, entityType: "EmailTemplate", entityId: template.id, requestId, metadata: { action: "DRAFT_CREATED", type: template.type, version: template.version } });
    return template;
  }, { isolationLevel: "Serializable" });
}

export async function updateEmailTemplateDraft(adminUserId: string, templateId: string, input: Partial<Omit<TemplateDraftInput, "type">>, requestId?: string) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "email-template", templateId);
    const template = await tx.emailTemplate.findUnique({ where: { id: templateId } });
    if (!template) fail(404, "EMAIL_TEMPLATE_NOT_FOUND", "Email template was not found");
    if (template.status !== ContentStatus.DRAFT) fail(409, "EMAIL_TEMPLATE_IMMUTABLE", "Published and archived templates are immutable; create a new draft version instead");
    const next = {
      type: template.type,
      name: input.name ?? template.name,
      subject: input.subject ?? template.subject,
      preheader: input.preheader !== undefined ? input.preheader : template.preheader,
      htmlBody: input.htmlBody ?? template.htmlBody,
      textBody: input.textBody ?? template.textBody,
      allowedVariables: input.allowedVariables ?? template.allowedVariables,
    };
    assertTemplateVariables(next);
    const updated = await tx.emailTemplate.update({
      where: { id: template.id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.subject !== undefined ? { subject: input.subject } : {}),
        ...(input.preheader !== undefined ? { preheader: input.preheader } : {}),
        ...(input.htmlBody !== undefined ? { htmlBody: input.htmlBody } : {}),
        ...(input.textBody !== undefined ? { textBody: input.textBody } : {}),
        ...(input.allowedVariables !== undefined ? { allowedVariables: input.allowedVariables } : {}),
      },
    });
    await audit(tx, { eventType: DomainAuditEventType.EMAIL_TEMPLATE_UPDATED, actorUserId: adminUserId, entityType: "EmailTemplate", entityId: template.id, requestId, metadata: { action: "DRAFT_UPDATED", type: template.type, version: template.version } });
    return updated;
  });
}

export async function cloneEmailTemplate(adminUserId: string, templateId: string, requestId?: string) {
  const source = await prisma.emailTemplate.findUnique({ where: { id: templateId } });
  if (!source) fail(404, "EMAIL_TEMPLATE_NOT_FOUND", "Email template was not found");
  return createEmailTemplateDraft(adminUserId, {
    type: source.type,
    name: source.name,
    subject: source.subject,
    preheader: source.preheader,
    htmlBody: source.htmlBody,
    textBody: source.textBody,
    allowedVariables: source.allowedVariables,
  }, requestId);
}

export async function publishEmailTemplate(adminUserId: string, templateId: string, requestId?: string) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "email-template", templateId);
    const template = await tx.emailTemplate.findUnique({ where: { id: templateId } });
    if (!template) fail(404, "EMAIL_TEMPLATE_NOT_FOUND", "Email template was not found");
    if (template.status !== ContentStatus.DRAFT) fail(409, "EMAIL_TEMPLATE_STATE_INVALID", "Only a draft template can be published");
    await tx.emailTemplate.updateMany({ where: { type: template.type, status: ContentStatus.PUBLISHED, id: { not: template.id } }, data: { status: ContentStatus.ARCHIVED, archivedAt: new Date() } });
    const published = await tx.emailTemplate.update({ where: { id: template.id }, data: { status: ContentStatus.PUBLISHED, publishedAt: new Date() } });
    await audit(tx, { eventType: DomainAuditEventType.EMAIL_TEMPLATE_UPDATED, actorUserId: adminUserId, entityType: "EmailTemplate", entityId: template.id, requestId, metadata: { action: "PUBLISHED", type: template.type, version: template.version } });
    return published;
  }, { isolationLevel: "Serializable" });
}

export async function archiveEmailTemplate(adminUserId: string, templateId: string, reason: string, requestId?: string) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "email-template", templateId);
    const template = await tx.emailTemplate.findUnique({ where: { id: templateId } });
    if (!template) fail(404, "EMAIL_TEMPLATE_NOT_FOUND", "Email template was not found");
    if (template.status === ContentStatus.ARCHIVED) fail(409, "EMAIL_TEMPLATE_STATE_INVALID", "This template is already archived");
    if (template.status === ContentStatus.PUBLISHED) {
      const replacement = await tx.emailTemplate.findFirst({ where: { type: template.type, status: ContentStatus.PUBLISHED, id: { not: template.id } }, select: { id: true } });
      if (!replacement) fail(409, "EMAIL_TEMPLATE_REPLACEMENT_REQUIRED", "Publish a replacement before archiving the active template");
    }
    const archived = await tx.emailTemplate.update({ where: { id: template.id }, data: { status: ContentStatus.ARCHIVED, archivedAt: new Date() } });
    await audit(tx, { eventType: DomainAuditEventType.EMAIL_TEMPLATE_UPDATED, actorUserId: adminUserId, entityType: "EmailTemplate", entityId: template.id, requestId, metadata: { action: "ARCHIVED", reason, type: template.type, version: template.version } });
    return archived;
  });
}

export async function previewEmailTemplate(templateId: string, values: Record<string, string>) {
  const template = await prisma.emailTemplate.findUnique({ where: { id: templateId } });
  if (!template) fail(404, "EMAIL_TEMPLATE_NOT_FOUND", "Email template was not found");
  return renderEmailTemplate({ ...template, values });
}

export async function sendEmailTemplateTest(adminUserId: string, templateId: string, to: string, values: Record<string, string>) {
  const template = await prisma.emailTemplate.findUnique({ where: { id: templateId } });
  if (!template) fail(404, "EMAIL_TEMPLATE_NOT_FOUND", "Email template was not found");
  const rendered = renderEmailTemplate({ ...template, values });
  const delivery = await prisma.emailDelivery.create({ data: { templateId: template.id, recipientEmail: to, subject: rendered.subject, htmlBody: rendered.html, textBody: rendered.text, status: EmailDeliveryStatus.PROCESSING, attemptCount: 1, processingAt: new Date() } });
  try {
    await sendManagedEmail({ to, ...rendered });
    await prisma.emailDelivery.update({ where: { id: delivery.id }, data: { status: EmailDeliveryStatus.SENT, sentAt: new Date(), providerMessage: "Accepted by configured SMTP transport" } });
    return { deliveryId: delivery.id, status: EmailDeliveryStatus.SENT };
  } catch (error) {
    await prisma.emailDelivery.update({ where: { id: delivery.id }, data: { status: EmailDeliveryStatus.FAILED, failedAt: new Date(), providerMessage: "SMTP delivery failed" } });
    throw error;
  }
}

export async function estimateCampaignRecipients(audience: ContentAudience) {
  return { audience, estimatedRecipientCount: await prisma.user.count({ where: recipientWhere(audience) }) };
}

async function assertCampaignContent(input: CampaignContentInput) {
  const template = await prisma.emailTemplate.findUnique({ where: { id: input.templateId } });
  if (!template) fail(404, "EMAIL_TEMPLATE_NOT_FOUND", "Email template was not found");
  if (template.status !== ContentStatus.PUBLISHED) fail(409, "EMAIL_TEMPLATE_NOT_PUBLISHED", "Campaigns require a published email template");
  if (template.type !== EmailTemplateType.BROADCAST) fail(409, "EMAIL_CAMPAIGN_TEMPLATE_INVALID", "Email campaigns require a published BROADCAST template");
  const candidate: TemplateDraftInput = {
    type: template.type,
    name: template.name,
    subject: input.subjectOverride ?? template.subject,
    preheader: template.preheader,
    htmlBody: input.htmlBodyOverride ?? template.htmlBody,
    textBody: input.textBodyOverride ?? template.textBody,
    allowedVariables: template.allowedVariables,
  };
  assertTemplateVariables(candidate);
  return template;
}

export async function createEmailCampaign(adminUserId: string, input: CampaignContentInput, requestId?: string) {
  await assertCampaignContent(input);
  const estimatedRecipientCount = await prisma.user.count({ where: recipientWhere(input.audience) });
  return prisma.$transaction(async (tx) => {
    const campaign = await tx.emailCampaign.create({ data: { ...input, subjectOverride: input.subjectOverride ?? null, htmlBodyOverride: input.htmlBodyOverride ?? null, textBodyOverride: input.textBodyOverride ?? null, estimatedRecipientCount, createdByAdminId: adminUserId } });
    await audit(tx, { eventType: DomainAuditEventType.EMAIL_CAMPAIGN_CREATED, actorUserId: adminUserId, entityType: "EmailCampaign", entityId: campaign.id, requestId, metadata: { audience: campaign.audience, estimatedRecipientCount } });
    return campaign;
  });
}

export async function listEmailCampaigns(query: Page & { status?: EmailCampaignStatus; audience?: ContentAudience }) {
  const where: Prisma.EmailCampaignWhereInput = { ...(query.status ? { status: query.status } : {}), ...(query.audience ? { audience: query.audience } : {}) };
  const [campaigns, total] = await Promise.all([
    prisma.emailCampaign.findMany({ where, orderBy: { createdAt: "desc" }, skip: (query.page - 1) * query.limit, take: query.limit, include: { template: { select: { id: true, name: true, type: true, version: true } }, createdByAdmin: { select: { id: true, fullName: true } }, _count: { select: { deliveries: true } } } }),
    prisma.emailCampaign.count({ where }),
  ]);
  return { campaigns, pagination: pagination(query.page, query.limit, total) };
}

export async function getEmailCampaign(campaignId: string) {
  const campaign = await prisma.emailCampaign.findUnique({ where: { id: campaignId }, include: { template: true, createdByAdmin: { select: { id: true, fullName: true } }, _count: { select: { deliveries: true } } } });
  if (!campaign) fail(404, "EMAIL_CAMPAIGN_NOT_FOUND", "Email campaign was not found");
  const groupedDeliveries = await prisma.emailDelivery.groupBy({ by: ["status"], where: { campaignId }, _count: { _all: true } });
  const deliverySummary = groupedDeliveries.map((row) => ({ status: row.status, _count: row._count._all }));
  return { ...campaign, deliverySummary };
}

export async function previewEmailCampaign(campaignId: string, values: Record<string, string>) {
  const campaign = await prisma.emailCampaign.findUnique({ where: { id: campaignId }, include: { template: true } });
  if (!campaign) fail(404, "EMAIL_CAMPAIGN_NOT_FOUND", "Email campaign was not found");
  return renderEmailTemplate({
    subject: campaign.subjectOverride ?? campaign.template.subject,
    htmlBody: campaign.htmlBodyOverride ?? campaign.template.htmlBody,
    textBody: campaign.textBodyOverride ?? campaign.template.textBody,
    allowedVariables: campaign.template.allowedVariables,
    values: { campaignTitle: campaign.title, ...values },
  });
}

export async function sendEmailCampaignTest(campaignId: string, to: string, values: Record<string, string>) {
  const campaign = await prisma.emailCampaign.findUnique({ where: { id: campaignId }, include: { template: true } });
  if (!campaign) fail(404, "EMAIL_CAMPAIGN_NOT_FOUND", "Email campaign was not found");
  if (campaign.status === EmailCampaignStatus.CANCELLED) fail(409, "EMAIL_CAMPAIGN_STATE_INVALID", "A cancelled campaign cannot send test deliveries");
  const rendered = renderEmailTemplate({
    subject: campaign.subjectOverride ?? campaign.template.subject,
    htmlBody: campaign.htmlBodyOverride ?? campaign.template.htmlBody,
    textBody: campaign.textBodyOverride ?? campaign.template.textBody,
    allowedVariables: campaign.template.allowedVariables,
    values: { campaignTitle: campaign.title, ...values },
  });
  const delivery = await prisma.emailDelivery.create({ data: { campaignId: campaign.id, templateId: campaign.template.id, recipientEmail: to, subject: rendered.subject, htmlBody: rendered.html, textBody: rendered.text, status: EmailDeliveryStatus.PROCESSING, attemptCount: 1, processingAt: new Date() } });
  try {
    await sendManagedEmail({ to, ...rendered });
    await prisma.emailDelivery.update({ where: { id: delivery.id }, data: { status: EmailDeliveryStatus.SENT, sentAt: new Date(), providerMessage: "Accepted by configured SMTP transport (test delivery)" } });
    return { deliveryId: delivery.id, status: EmailDeliveryStatus.SENT };
  } catch (error) {
    await prisma.emailDelivery.update({ where: { id: delivery.id }, data: { status: EmailDeliveryStatus.FAILED, failedAt: new Date(), providerMessage: "SMTP test delivery failed" } });
    throw error;
  }
}

export async function updateEmailCampaign(campaignId: string, input: Partial<CampaignContentInput>) {
  const campaign = await prisma.emailCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) fail(404, "EMAIL_CAMPAIGN_NOT_FOUND", "Email campaign was not found");
  if (campaign.status !== EmailCampaignStatus.DRAFT) fail(409, "EMAIL_CAMPAIGN_IMMUTABLE", "Only a draft campaign can be edited");
  const candidate: CampaignContentInput = {
    title: input.title ?? campaign.title,
    templateId: input.templateId ?? campaign.templateId,
    audience: input.audience ?? campaign.audience,
    subjectOverride: input.subjectOverride !== undefined ? input.subjectOverride : campaign.subjectOverride,
    htmlBodyOverride: input.htmlBodyOverride !== undefined ? input.htmlBodyOverride : campaign.htmlBodyOverride,
    textBodyOverride: input.textBodyOverride !== undefined ? input.textBodyOverride : campaign.textBodyOverride,
  };
  await assertCampaignContent(candidate);
  const estimatedRecipientCount = await prisma.user.count({ where: recipientWhere(candidate.audience) });
  return prisma.emailCampaign.update({
    where: { id: campaign.id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.templateId !== undefined ? { templateId: input.templateId } : {}),
      ...(input.audience !== undefined ? { audience: input.audience } : {}),
      ...(input.subjectOverride !== undefined ? { subjectOverride: input.subjectOverride } : {}),
      ...(input.htmlBodyOverride !== undefined ? { htmlBodyOverride: input.htmlBodyOverride } : {}),
      ...(input.textBodyOverride !== undefined ? { textBodyOverride: input.textBodyOverride } : {}),
      estimatedRecipientCount,
    },
  });
}

export async function scheduleEmailCampaign(campaignId: string, scheduledAt: string) {
  const date = new Date(scheduledAt);
  if (date <= new Date()) fail(400, "EMAIL_CAMPAIGN_SCHEDULE_INVALID", "Scheduled time must be in the future");
  const campaign = await prisma.emailCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) fail(404, "EMAIL_CAMPAIGN_NOT_FOUND", "Email campaign was not found");
  if (campaign.status !== EmailCampaignStatus.DRAFT) fail(409, "EMAIL_CAMPAIGN_STATE_INVALID", "Only a draft campaign can be scheduled");
  return prisma.emailCampaign.update({ where: { id: campaign.id }, data: { status: EmailCampaignStatus.SCHEDULED, scheduledAt: date } });
}

export async function cancelEmailCampaign(campaignId: string) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "email-campaign", campaignId);
    const campaign = await tx.emailCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign) fail(404, "EMAIL_CAMPAIGN_NOT_FOUND", "Email campaign was not found");
    if (campaign.status !== EmailCampaignStatus.DRAFT && campaign.status !== EmailCampaignStatus.SCHEDULED) fail(409, "EMAIL_CAMPAIGN_STATE_INVALID", "Only a draft or scheduled campaign can be cancelled");
    await tx.emailDelivery.updateMany({ where: { campaignId, status: EmailDeliveryStatus.QUEUED }, data: { status: EmailDeliveryStatus.CANCELLED } });
    return tx.emailCampaign.update({ where: { id: campaign.id }, data: { status: EmailCampaignStatus.CANCELLED, cancelledAt: new Date() } });
  });
}

export async function enqueueEmailCampaign(adminUserId: string, campaignId: string, requestId?: string, sendNow = false) {
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "email-campaign", campaignId);
    const campaign = await tx.emailCampaign.findUnique({ where: { id: campaignId }, include: { template: true } });
    if (!campaign) fail(404, "EMAIL_CAMPAIGN_NOT_FOUND", "Email campaign was not found");
    if (campaign.status !== EmailCampaignStatus.DRAFT && campaign.status !== EmailCampaignStatus.SCHEDULED) fail(409, "EMAIL_CAMPAIGN_STATE_INVALID", "This campaign cannot be queued");
    if (!sendNow && campaign.status === EmailCampaignStatus.SCHEDULED && campaign.scheduledAt && campaign.scheduledAt > new Date()) fail(409, "EMAIL_CAMPAIGN_NOT_DUE", "This campaign is scheduled for a future time");
    const recipients = await tx.user.findMany({ where: recipientWhere(campaign.audience), select: { id: true, email: true, fullName: true } });
    const subject = campaign.subjectOverride ?? campaign.template.subject;
    const htmlBody = campaign.htmlBodyOverride ?? campaign.template.htmlBody;
    const textBody = campaign.textBodyOverride ?? campaign.template.textBody;
    if (recipients.length) {
      await tx.emailDelivery.createMany({
        data: recipients.map((recipient) => {
          const rendered = renderEmailTemplate({ subject, htmlBody, textBody, allowedVariables: campaign.template.allowedVariables, values: { userName: recipient.fullName, campaignTitle: campaign.title } });
          return { campaignId: campaign.id, templateId: campaign.template.id, recipientUserId: recipient.id, recipientEmail: recipient.email, subject: rendered.subject, htmlBody: rendered.html, textBody: rendered.text };
        }),
        skipDuplicates: true,
      });
    }
    const status = recipients.length ? EmailCampaignStatus.PROCESSING : EmailCampaignStatus.SENT;
    const updated = await tx.emailCampaign.update({ where: { id: campaign.id }, data: { status, processingAt: new Date(), estimatedRecipientCount: recipients.length, ...(recipients.length ? {} : { sentAt: new Date() }) } });
    await audit(tx, { eventType: DomainAuditEventType.EMAIL_CAMPAIGN_SENT, actorUserId: adminUserId, entityType: "EmailCampaign", entityId: campaign.id, requestId, metadata: { action: "QUEUED", audience: campaign.audience, recipientCount: recipients.length } });
    return { campaign: updated, queuedDeliveries: recipients.length };
  }, { isolationLevel: "Serializable" });
}

export async function listEmailDeliveries(query: Page & { status?: EmailDeliveryStatus; campaignId?: string }) {
  const where: Prisma.EmailDeliveryWhereInput = { ...(query.status ? { status: query.status } : {}), ...(query.campaignId ? { campaignId: query.campaignId } : {}) };
  const [deliveries, total] = await Promise.all([
    prisma.emailDelivery.findMany({ where, orderBy: { createdAt: "desc" }, skip: (query.page - 1) * query.limit, take: query.limit, select: { id: true, campaignId: true, templateId: true, recipientEmail: true, subject: true, status: true, attemptCount: true, providerMessage: true, sentAt: true, failedAt: true, createdAt: true } }),
    prisma.emailDelivery.count({ where }),
  ]);
  return { deliveries, pagination: pagination(query.page, query.limit, total) };
}

export async function retryEmailDelivery(deliveryId: string) {
  const result = await prisma.emailDelivery.updateMany({ where: { id: deliveryId, status: EmailDeliveryStatus.FAILED }, data: { status: EmailDeliveryStatus.QUEUED, availableAt: new Date(), processingAt: null, failedAt: null, providerMessage: null } });
  if (!result.count) fail(409, "EMAIL_DELIVERY_RETRY_INVALID", "Only a failed delivery can be retried");
  return { id: deliveryId, status: EmailDeliveryStatus.QUEUED };
}

export async function enqueueDueEmailCampaigns(limit = 20) {
  const campaigns = await prisma.emailCampaign.findMany({
    where: { status: EmailCampaignStatus.SCHEDULED, scheduledAt: { lte: new Date() } },
    orderBy: { scheduledAt: "asc" },
    take: limit,
    select: { id: true, createdByAdminId: true },
  });
  let queued = 0;
  for (const campaign of campaigns) {
    try {
      const result = await enqueueEmailCampaign(campaign.createdByAdminId, campaign.id);
      queued += result.queuedDeliveries;
    } catch (error) {
      if (!(error instanceof AppError) || error.code !== "EMAIL_CAMPAIGN_STATE_INVALID") throw error;
    }
  }
  return { campaigns: campaigns.length, queuedDeliveries: queued };
}

async function reconcileCampaign(campaignId: string) {
  const grouped = await prisma.emailDelivery.groupBy({ by: ["status"], where: { campaignId }, _count: { _all: true } });
  const counts = new Map(grouped.map((item) => [item.status, item._count._all]));
  const unfinished = (counts.get(EmailDeliveryStatus.QUEUED) ?? 0) + (counts.get(EmailDeliveryStatus.PROCESSING) ?? 0);
  if (unfinished) return;
  const sent = counts.get(EmailDeliveryStatus.SENT) ?? 0;
  const failed = counts.get(EmailDeliveryStatus.FAILED) ?? 0;
  await prisma.emailCampaign.updateMany({
    where: { id: campaignId, status: EmailCampaignStatus.PROCESSING },
    data: sent > 0
      ? { status: EmailCampaignStatus.SENT, sentAt: new Date(), ...(failed ? { failedAt: new Date() } : {}) }
      : { status: EmailCampaignStatus.FAILED, failedAt: new Date() },
  });
}

export async function processEmailDeliveryBatch(limit = 25) {
  const candidates = await prisma.emailDelivery.findMany({
    where: { status: EmailDeliveryStatus.QUEUED, availableAt: { lte: new Date() } },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: { id: true },
  });
  let sent = 0;
  let failed = 0;
  for (const candidate of candidates) {
    const claimed = await prisma.emailDelivery.updateMany({
      where: { id: candidate.id, status: EmailDeliveryStatus.QUEUED },
      data: { status: EmailDeliveryStatus.PROCESSING, processingAt: new Date(), attemptCount: { increment: 1 } },
    });
    if (!claimed.count) continue;
    const delivery = await prisma.emailDelivery.findUnique({ where: { id: candidate.id } });
    if (!delivery) continue;
    try {
      await sendManagedEmail({ to: delivery.recipientEmail, subject: delivery.subject, html: delivery.htmlBody, text: delivery.textBody });
      await prisma.emailDelivery.update({ where: { id: delivery.id }, data: { status: EmailDeliveryStatus.SENT, sentAt: new Date(), providerMessage: "Accepted by configured SMTP transport" } });
      sent += 1;
    } catch {
      await prisma.emailDelivery.update({ where: { id: delivery.id }, data: { status: EmailDeliveryStatus.FAILED, failedAt: new Date(), providerMessage: "SMTP delivery failed" } });
      failed += 1;
    }
    if (delivery.campaignId) await reconcileCampaign(delivery.campaignId);
  }
  return { processed: sent + failed, sent, failed };
}
