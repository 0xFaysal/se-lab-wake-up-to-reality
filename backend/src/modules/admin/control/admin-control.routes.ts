import { Router } from "express";
import { UserRoleType } from "../../../../generated/prisma/client.js";
import { authenticate } from "../../../common/middleware/auth.js";
import { requireAccountReady } from "../../../common/middleware/require-account-ready.js";
import { requireRole } from "../../../common/middleware/require-role.js";
import { sensitiveAccountRateLimit } from "../../../common/middleware/rate-limit.js";
import { validate } from "../../../common/middleware/validate.js";
import * as controller from "./admin-control.controller.js";
import * as schema from "./admin-control.schema.js";

export const adminControlRouter = Router();

adminControlRouter.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
adminControlRouter.use(authenticate, requireAccountReady, requireRole(UserRoleType.ADMIN));

adminControlRouter.post("/users", sensitiveAccountRateLimit, validate(schema.createAdminUserSchema), controller.createUser);
adminControlRouter.patch("/users/:id", sensitiveAccountRateLimit, validate(schema.updateAdminUserSchema), controller.updateUser);
adminControlRouter.post("/users/:id/resend-setup", sensitiveAccountRateLimit, validate(schema.idParamsSchema), controller.resendUserSetup);
adminControlRouter.post("/users/:id/suspend", sensitiveAccountRateLimit, validate(schema.moderationSchema), controller.suspendUser);
adminControlRouter.post("/users/:id/unsuspend", sensitiveAccountRateLimit, validate(schema.moderationSchema), controller.unsuspendUser);
adminControlRouter.post("/users/:id/block", sensitiveAccountRateLimit, validate(schema.moderationSchema), controller.blockUser);
adminControlRouter.post("/users/:id/unblock", sensitiveAccountRateLimit, validate(schema.moderationSchema), controller.unblockUser);
adminControlRouter.post("/users/:id/logout-all", sensitiveAccountRateLimit, validate(schema.moderationSchema), controller.revokeUserSessions);

adminControlRouter.get("/notes", validate(schema.notesQuerySchema), controller.listNotes);
adminControlRouter.post("/notes", validate(schema.createNoteSchema), controller.createNote);
adminControlRouter.patch("/notes/:id", validate(schema.updateNoteSchema), controller.updateNote);
adminControlRouter.delete("/notes/:id", validate(schema.idParamsSchema), controller.deleteNote);
adminControlRouter.get("/risk-flags", validate(schema.riskFlagsQuerySchema), controller.listRiskFlags);
adminControlRouter.post("/risk-flags", validate(schema.createRiskFlagSchema), controller.createRiskFlag);
adminControlRouter.post("/risk-flags/:id/resolve", validate(schema.moderationSchema), controller.resolveRiskFlag);

adminControlRouter.get("/parking-resources", validate(schema.resourcesQuerySchema), controller.listResources);
adminControlRouter.patch("/parking-resources/:id/status", sensitiveAccountRateLimit, validate(schema.resourceStatusSchema), controller.updateResourceStatus);
adminControlRouter.patch("/properties/:id/status", sensitiveAccountRateLimit, validate(schema.propertyStatusSchema), controller.updatePropertyStatus);
adminControlRouter.get("/parking-rights/expiring", validate(schema.expiringRightsSchema), controller.expiringRights);
adminControlRouter.get("/parking-rights/conflicts", controller.conflictingRights);
adminControlRouter.get("/parking-rights/shared-pools", controller.sharedPoolMonitor);
adminControlRouter.get("/parking-operations", controller.parkingOperations);
adminControlRouter.get("/parking-operations/vehicle-search", validate(schema.vehicleSearchSchema), controller.vehicleSearch);

adminControlRouter.get("/analytics/overview", validate(schema.analyticsQuerySchema), controller.analyticsOverview);
adminControlRouter.get("/analytics/bookings", validate(schema.analyticsQuerySchema), controller.analyticsBookings);
adminControlRouter.get("/analytics/finance", validate(schema.analyticsQuerySchema), controller.analyticsFinance);
adminControlRouter.get("/analytics/occupancy", validate(schema.analyticsQuerySchema), controller.analyticsOccupancy);
adminControlRouter.get("/analytics/users", validate(schema.analyticsQuerySchema), controller.analyticsUsers);
adminControlRouter.get("/finance/reconciliation", controller.reconciliation);

adminControlRouter.get("/content/legal", validate(schema.legalListSchema), controller.listLegal);
adminControlRouter.get("/content/legal/:id", validate(schema.idParamsSchema), controller.getLegal);
adminControlRouter.post("/content/legal", validate(schema.createLegalSchema), controller.createLegal);
adminControlRouter.patch("/content/legal/:id", validate(schema.updateLegalDraftSchema), controller.updateLegal);
adminControlRouter.post("/content/legal/:id/publish", validate(schema.idParamsSchema), controller.publishLegal);
adminControlRouter.post("/content/legal/:id/archive", validate(schema.moderationSchema), controller.archiveLegal);
adminControlRouter.get("/content/articles", validate(schema.articleListSchema), controller.listArticles);
adminControlRouter.get("/content/categories", controller.listCategories);
adminControlRouter.post("/content/categories", validate(schema.createContentCategorySchema), controller.createCategory);
adminControlRouter.post("/content/articles", validate(schema.createArticleSchema), controller.createArticle);
adminControlRouter.patch("/content/articles/:id", validate(schema.updateArticleSchema), controller.updateArticle);
adminControlRouter.post("/content/articles/:id/publish", validate(schema.idParamsSchema), controller.publishArticle);

adminControlRouter.get("/notification-campaigns", validate(schema.campaignListSchema), controller.listCampaigns);
adminControlRouter.get("/notifications", validate(schema.notificationHistorySchema), controller.listNotificationHistory);
adminControlRouter.post("/notification-campaigns", validate(schema.createCampaignSchema), controller.createCampaign);
adminControlRouter.post("/notification-campaigns/:id/send", sensitiveAccountRateLimit, validate(schema.idParamsSchema), controller.sendCampaign);

adminControlRouter.get("/communications/templates", validate(schema.emailTemplateListSchema), controller.listEmailTemplates);
adminControlRouter.get("/communications/templates/:id", validate(schema.idParamsSchema), controller.getEmailTemplate);
adminControlRouter.post("/communications/templates", sensitiveAccountRateLimit, validate(schema.createEmailTemplateSchema), controller.createEmailTemplate);
adminControlRouter.patch("/communications/templates/:id", sensitiveAccountRateLimit, validate(schema.updateEmailTemplateSchema), controller.updateEmailTemplate);
adminControlRouter.post("/communications/templates/:id/clone", sensitiveAccountRateLimit, validate(schema.idParamsSchema), controller.cloneEmailTemplate);
adminControlRouter.post("/communications/templates/:id/publish", sensitiveAccountRateLimit, validate(schema.idParamsSchema), controller.publishEmailTemplate);
adminControlRouter.post("/communications/templates/:id/archive", sensitiveAccountRateLimit, validate(schema.moderationSchema), controller.archiveEmailTemplate);
adminControlRouter.post("/communications/templates/:id/preview", validate(schema.previewEmailTemplateSchema), controller.previewEmailTemplate);
adminControlRouter.post("/communications/templates/:id/test", sensitiveAccountRateLimit, validate(schema.sendTestEmailSchema), controller.sendEmailTemplateTest);

adminControlRouter.get("/communications/campaigns", validate(schema.emailCampaignListSchema), controller.listEmailCampaigns);
adminControlRouter.get("/communications/campaigns/estimate", validate(schema.estimateEmailCampaignSchema), controller.estimateEmailCampaign);
adminControlRouter.get("/communications/campaigns/:id", validate(schema.idParamsSchema), controller.getEmailCampaign);
adminControlRouter.post("/communications/campaigns/:id/preview", validate(schema.previewEmailTemplateSchema), controller.previewEmailCampaign);
adminControlRouter.post("/communications/campaigns/:id/test", sensitiveAccountRateLimit, validate(schema.sendTestEmailSchema), controller.sendEmailCampaignTest);
adminControlRouter.post("/communications/campaigns", sensitiveAccountRateLimit, validate(schema.createEmailCampaignSchema), controller.createEmailCampaign);
adminControlRouter.patch("/communications/campaigns/:id", sensitiveAccountRateLimit, validate(schema.updateEmailCampaignSchema), controller.updateEmailCampaign);
adminControlRouter.post("/communications/campaigns/:id/schedule", sensitiveAccountRateLimit, validate(schema.scheduleEmailCampaignSchema), controller.scheduleEmailCampaign);
adminControlRouter.post("/communications/campaigns/:id/send", sensitiveAccountRateLimit, validate(schema.idParamsSchema), controller.sendEmailCampaign);
adminControlRouter.post("/communications/campaigns/:id/cancel", sensitiveAccountRateLimit, validate(schema.idParamsSchema), controller.cancelEmailCampaign);
adminControlRouter.get("/communications/deliveries", validate(schema.emailDeliveryListSchema), controller.listEmailDeliveries);
adminControlRouter.post("/communications/deliveries/:id/retry", sensitiveAccountRateLimit, validate(schema.idParamsSchema), controller.retryEmailDelivery);

adminControlRouter.get("/platform-fees", validate(schema.feeRulesQuerySchema), controller.listFeeRules);
adminControlRouter.post("/platform-fees", sensitiveAccountRateLimit, validate(schema.createFeeRuleSchema), controller.createFeeRule);
adminControlRouter.patch("/platform-fees/:id", sensitiveAccountRateLimit, validate(schema.updateFeeRuleSchema), controller.updateFeeRule);
adminControlRouter.post("/platform-fees/:id/clone", sensitiveAccountRateLimit, validate(schema.cloneFeeRuleSchema), controller.cloneFeeRule);
adminControlRouter.post("/platform-fees/:id/schedule", sensitiveAccountRateLimit, validate(schema.scheduleFeeRuleSchema), controller.scheduleFeeRule);
adminControlRouter.post("/platform-fees/:id/activate", sensitiveAccountRateLimit, validate(schema.moderationSchema), controller.activateFeeRule);
adminControlRouter.post("/platform-fees/:id/deactivate", sensitiveAccountRateLimit, validate(schema.moderationSchema), controller.deactivateFeeRule);
adminControlRouter.post("/platform-fees/:id/archive", sensitiveAccountRateLimit, validate(schema.moderationSchema), controller.archiveFeeRule);
adminControlRouter.delete("/platform-fees/:id", sensitiveAccountRateLimit, validate(schema.idParamsSchema), controller.deleteFeeRule);

adminControlRouter.post("/payouts/:id/hold", sensitiveAccountRateLimit, validate(schema.moderationSchema), controller.holdPayout);
adminControlRouter.post("/payouts/:id/release-hold", sensitiveAccountRateLimit, validate(schema.moderationSchema), controller.releasePayout);
adminControlRouter.post("/disputes/:id/begin-review", validate(schema.disputeReviewSchema), controller.beginDisputeReview);
adminControlRouter.get("/listing-reports", validate(schema.listingReportQuerySchema), controller.listListingReports);
adminControlRouter.post("/listing-reports/:id/resolve", sensitiveAccountRateLimit, validate(schema.listingReportResolutionSchema), controller.resolveListingReport);
adminControlRouter.post("/bookings/:id/refunds", sensitiveAccountRateLimit, validate(schema.adminRefundSchema), controller.refundBooking);
adminControlRouter.post("/bookings/:id/cancel", sensitiveAccountRateLimit, validate(schema.moderationSchema), controller.cancelBooking);
