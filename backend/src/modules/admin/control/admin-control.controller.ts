import type { NextFunction, Request, Response } from "express";
import * as marketplaceService from "../../marketplace/marketplace.service.js";
import * as service from "./admin-control.service.js";
import * as emailService from "./email-management.service.js";

function id(req: Request): string {
  const value = req.params.id;
  if (typeof value !== "string") throw new Error("Missing route identifier");
  return value;
}

function adminId(req: Request): string {
  if (!req.auth) throw new Error("Authenticated Admin context is missing");
  return req.auth.userId;
}

function action(
  handler: (req: Request) => Promise<unknown> | unknown,
  status = 200,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await handler(req);
      res.status(status).json({
        success: true,
        data,
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const suspendUser = action((req) =>
  service.moderateUser(
    adminId(req),
    id(req),
    "suspend",
    req.body.reason,
    req.requestId,
  ),
);
export const createUser = action(
  (req) => service.createUserByAdmin(adminId(req), req.body, req.requestId),
  201,
);
export const updateUser = action((req) =>
  service.updateUserByAdmin(adminId(req), id(req), req.body, req.requestId),
);
export const resendUserSetup = action((req) =>
  service.resendUserSetupByAdmin(adminId(req), id(req), req.requestId),
);
export const unsuspendUser = action((req) =>
  service.moderateUser(
    adminId(req),
    id(req),
    "unsuspend",
    req.body.reason,
    req.requestId,
  ),
);
export const blockUser = action((req) =>
  service.moderateUser(
    adminId(req),
    id(req),
    "block",
    req.body.reason,
    req.requestId,
  ),
);
export const unblockUser = action((req) =>
  service.moderateUser(
    adminId(req),
    id(req),
    "unblock",
    req.body.reason,
    req.requestId,
  ),
);
export const revokeUserSessions = action((req) =>
  service.revokeAllUserSessions(
    adminId(req),
    id(req),
    req.body.reason,
    req.requestId,
  ),
);

export const listNotes = action((req) =>
  service.listAdminNotes(req.query as never),
);
export const createNote = action(
  (req) => service.createAdminNote(adminId(req), req.body, req.requestId),
  201,
);
export const updateNote = action((req) =>
  service.updateAdminNote(adminId(req), id(req), req.body.body, req.requestId),
);
export const deleteNote = action((req) =>
  service.deleteAdminNote(adminId(req), id(req), req.requestId),
);

export const listRiskFlags = action((req) =>
  service.listRiskFlags(req.query as never),
);
export const createRiskFlag = action(
  (req) => service.createRiskFlag(adminId(req), req.body, req.requestId),
  201,
);
export const resolveRiskFlag = action((req) =>
  service.resolveRiskFlag(
    adminId(req),
    id(req),
    req.body.reason,
    req.requestId,
  ),
);

export const listResources = action((req) =>
  service.listParkingResources(req.query as never),
);
export const updateResourceStatus = action((req) =>
  service.setParkingResourceStatus(
    adminId(req),
    id(req),
    req.body.status,
    req.body.reason,
    req.requestId,
  ),
);
export const updatePropertyStatus = action((req) =>
  service.overridePropertyStatus(
    adminId(req),
    id(req),
    req.body,
    req.requestId,
  ),
);
export const expiringRights = action((req) =>
  service.listExpiringRights(Number(req.query.days ?? 30) as 7 | 30 | 60),
);
export const conflictingRights = action(() => service.listConflictingRights());
export const sharedPoolMonitor = action(() => service.getSharedPoolMonitor());

export const parkingOperations = action(() =>
  service.getParkingOperationsOverview(),
);
export const vehicleSearch = action((req) =>
  service.searchActiveVehicles(String(req.query.q), Number(req.query.limit)),
);

export const analyticsOverview = action((req) =>
  service.getAnalyticsOverview(req.query as never),
);
export const analyticsBookings = action((req) =>
  service.getBookingAnalytics(req.query as never),
);
export const analyticsFinance = action((req) =>
  service.getFinanceAnalytics(req.query as never),
);
export const analyticsOccupancy = action((req) =>
  service.getOccupancyAnalytics(req.query as never),
);
export const analyticsUsers = action((req) =>
  service.getUserAnalytics(req.query as never),
);
export const reconciliation = action(() =>
  service.getFinancialReconciliation(),
);
export const financeOverview = action(() => service.getFinanceOverview());

export const listLegal = action((req) =>
  service.listLegalDocuments(req.query.type as never),
);
export const getLegal = action((req) => service.getLegalDocument(id(req)));
export const createLegal = action(
  (req) => service.createLegalDraft(adminId(req), req.body, req.requestId),
  201,
);
export const updateLegal = action((req) =>
  service.updateLegalDraft(adminId(req), id(req), req.body, req.requestId),
);
export const publishLegal = action((req) =>
  service.publishLegalDocument(adminId(req), id(req), req.requestId),
);
export const archiveLegal = action((req) =>
  service.archiveLegalDocument(
    adminId(req),
    id(req),
    req.body.reason,
    req.requestId,
  ),
);

export const listArticles = action((req) =>
  service.listContentArticles(req.query as never),
);
export const listCategories = action(() => service.listContentCategories());
export const createCategory = action(
  (req) => service.createContentCategory(req.body),
  201,
);
export const createArticle = action(
  (req) => service.createContentArticle(adminId(req), req.body),
  201,
);
export const updateArticle = action((req) =>
  service.updateContentArticle(id(req), req.body),
);
export const publishArticle = action((req) =>
  service.publishContentArticle(adminId(req), id(req), req.requestId),
);

export const listCampaigns = action((req) =>
  service.listNotificationCampaigns(req.query as never),
);
export const listNotificationHistory = action((req) =>
  service.listNotificationHistory(req.query as never),
);
export const createCampaign = action(
  (req) =>
    service.createNotificationCampaign(adminId(req), req.body, req.requestId),
  201,
);
export const sendCampaign = action((req) =>
  service.sendNotificationCampaign(adminId(req), id(req), req.requestId),
);

export const listEmailTemplates = action((req) =>
  emailService.listEmailTemplates(req.query as never),
);
export const getEmailTemplate = action((req) =>
  emailService.getEmailTemplate(id(req)),
);
export const createEmailTemplate = action(
  (req) =>
    emailService.createEmailTemplateDraft(
      adminId(req),
      req.body,
      req.requestId,
    ),
  201,
);
export const updateEmailTemplate = action((req) =>
  emailService.updateEmailTemplateDraft(
    adminId(req),
    id(req),
    req.body,
    req.requestId,
  ),
);
export const cloneEmailTemplate = action(
  (req) =>
    emailService.cloneEmailTemplate(adminId(req), id(req), req.requestId),
  201,
);
export const publishEmailTemplate = action((req) =>
  emailService.publishEmailTemplate(adminId(req), id(req), req.requestId),
);
export const archiveEmailTemplate = action((req) =>
  emailService.archiveEmailTemplate(
    adminId(req),
    id(req),
    req.body.reason,
    req.requestId,
  ),
);
export const previewEmailTemplate = action((req) =>
  emailService.previewEmailTemplate(id(req), req.body.values),
);
export const sendEmailTemplateTest = action((req) =>
  emailService.sendEmailTemplateTest(
    adminId(req),
    id(req),
    req.body.to,
    req.body.values,
  ),
);

export const listEmailCampaigns = action((req) =>
  emailService.listEmailCampaigns(req.query as never),
);
export const getEmailCampaign = action((req) =>
  emailService.getEmailCampaign(id(req)),
);
export const previewEmailCampaign = action((req) =>
  emailService.previewEmailCampaign(id(req), req.body.values),
);
export const sendEmailCampaignTest = action((req) =>
  emailService.sendEmailCampaignTest(id(req), req.body.to, req.body.values),
);
export const estimateEmailCampaign = action((req) =>
  emailService.estimateCampaignRecipients(req.query.audience as never),
);
export const createEmailCampaign = action(
  (req) =>
    emailService.createEmailCampaign(adminId(req), req.body, req.requestId),
  201,
);
export const updateEmailCampaign = action((req) =>
  emailService.updateEmailCampaign(id(req), req.body),
);
export const scheduleEmailCampaign = action((req) =>
  emailService.scheduleEmailCampaign(id(req), req.body.scheduledAt),
);
export const sendEmailCampaign = action((req) =>
  emailService.enqueueEmailCampaign(adminId(req), id(req), req.requestId, true),
);
export const cancelEmailCampaign = action((req) =>
  emailService.cancelEmailCampaign(id(req)),
);
export const listEmailDeliveries = action((req) =>
  emailService.listEmailDeliveries(req.query as never),
);
export const retryEmailDelivery = action((req) =>
  emailService.retryEmailDelivery(id(req)),
);

export const listFeeRules = action((req) =>
  service.listPlatformFeeRules(req.query as never),
);
export const createFeeRule = action(
  (req) => service.createPlatformFeeRule(adminId(req), req.body, req.requestId),
  201,
);
export const updateFeeRule = action((req) =>
  service.updatePlatformFeeDraft(
    adminId(req),
    id(req),
    req.body,
    req.requestId,
  ),
);
export const cloneFeeRule = action(
  (req) =>
    service.clonePlatformFeeRule(
      adminId(req),
      id(req),
      req.body,
      req.requestId,
    ),
  201,
);
export const scheduleFeeRule = action((req) =>
  service.schedulePlatformFeeRule(
    adminId(req),
    id(req),
    req.body,
    req.requestId,
  ),
);
export const activateFeeRule = action((req) =>
  service.activatePlatformFeeRule(
    adminId(req),
    id(req),
    req.body.reason,
    req.requestId,
  ),
);
export const deactivateFeeRule = action((req) =>
  service.deactivatePlatformFeeRule(
    adminId(req),
    id(req),
    req.body.reason,
    req.requestId,
  ),
);
export const archiveFeeRule = action((req) =>
  service.archivePlatformFeeRule(
    adminId(req),
    id(req),
    req.body.reason,
    req.requestId,
  ),
);
export const deleteFeeRule = action((req) =>
  service.deletePlatformFeeDraft(adminId(req), id(req), req.requestId),
);

export const holdPayout = action((req) =>
  service.holdPayout(adminId(req), id(req), req.body.reason, req.requestId),
);
export const releasePayout = action((req) =>
  service.releasePayoutHold(
    adminId(req),
    id(req),
    req.body.reason,
    req.requestId,
  ),
);
export const beginDisputeReview = action((req) =>
  service.beginDisputeReview(adminId(req), id(req), req.body, req.requestId),
);
export const listListingReports = action((req) =>
  service.listListingReports(req.query as never),
);
export const resolveListingReport = action((req) =>
  service.resolveListingReport(adminId(req), id(req), req.body, req.requestId),
);
export const refundBooking = action(
  (req) =>
    marketplaceService.createAdminBookingRefund(adminId(req), id(req), {
      ...req.body,
      amountPaisa: BigInt(req.body.amountPaisa),
    }),
  201,
);
export const cancelBooking = action((req) =>
  marketplaceService.cancelBookingAsAdmin(
    adminId(req),
    id(req),
    req.body.reason,
  ),
);
