import type { NextFunction, Request, Response } from "express";
import * as service from "./marketplace.service.js";

const userId = (req: Request) => req.auth!.userId;
const param = (req: Request, name: string) => {
  const value = req.params[name];
  if (typeof value !== "string") throw new Error(`Missing route parameter: ${name}`);
  return value;
};
const respond = (req: Request, res: Response, data: unknown, status = 200) =>
  res.status(status).json({ success: true, data, meta: { requestId: req.requestId, timestamp: new Date().toISOString() } });
const action = (handler: (req: Request) => Promise<unknown>, status = 200) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try { respond(req, res, await handler(req), status); } catch (error) { next(error); }
  };

export const createResource = action((req) => service.createResource(userId(req), param(req, "propertyId"), req.body), 201);
export const createBulkResources = action((req) => service.createBulkFixedResources(userId(req), param(req, "propertyId"), req.body), 201);
export const listResources = action((req) => service.listResources(userId(req), param(req, "propertyId")));
export const getResource = action((req) => service.getResource(userId(req), param(req, "resourceId")));
export const updateResource = action((req) => service.updateResource(userId(req), param(req, "resourceId"), req.body));
export const deleteResource = action(async (req) => { await service.deleteResource(userId(req), param(req, "resourceId")); return { deleted: true }; });
export const claimRight = action((req) => service.claimParkingRight(userId(req), param(req, "resourceId"), req.body), 201);
export const createRightClaimBatch = action((req) => service.createParkingRightClaimBatch(userId(req), param(req, "propertyId"), req.body), 201);
export const listProviderRightClaimBatches = action((req) => service.listProviderRightClaimBatches(userId(req)));
export const listAdminRightClaimBatches = action((req) => service.listAdminRightClaimBatches(req.query as never));
export const reviewRightClaimBatch = action((req) => service.reviewParkingRightClaimBatch(userId(req), param(req, "batchId"), req.body));
export const uploadRightDocuments = action((req) => service.uploadParkingRightDocuments(userId(req), { parkingRightId: param(req, "rightId") }, req.body.category, (req.files as Express.Multer.File[] | undefined) ?? []), 201);
export const listRightDocuments = action((req) => service.listParkingRightDocuments(userId(req), { parkingRightId: param(req, "rightId") }));
export const uploadAmendmentDocuments = action((req) => service.uploadParkingRightDocuments(userId(req), { amendmentId: param(req, "amendmentId") }, req.body.category, (req.files as Express.Multer.File[] | undefined) ?? []), 201);
export const listAmendmentDocuments = action((req) => service.listParkingRightDocuments(userId(req), { amendmentId: param(req, "amendmentId") }));
export const uploadBatchDocuments = action((req) => service.uploadParkingRightDocuments(userId(req), { claimBatchId: param(req, "batchId") }, req.body.category, (req.files as Express.Multer.File[] | undefined) ?? []), 201);
export const listBatchDocuments = action((req) => service.listParkingRightDocuments(userId(req), { claimBatchId: param(req, "batchId") }));
export const deleteRightDocument = action((req) => service.deleteParkingRightDocument(userId(req), param(req, "documentId")));
export const downloadRightDocument = action((req) => service.getParkingRightDocumentDownload(userId(req), param(req, "documentId")));
export const listRights = action((req) => service.listParkingRights(userId(req)));
export const getRight = action((req) => service.getParkingRight(userId(req), param(req, "rightId")));
export const updatePendingRight = action((req) => service.updatePendingParkingRight(userId(req), param(req, "rightId"), req.body));
export const createRightAmendment = action((req) => service.createParkingRightAmendment(userId(req), param(req, "rightId"), req.body), 201);
export const listRightAmendments = action((req) => service.listParkingRightAmendments(userId(req), param(req, "rightId")));
export const cancelRightAmendment = action((req) => service.cancelParkingRightAmendment(userId(req), param(req, "amendmentId")));
export const listPendingRights = action(() => service.listPendingRights());
export const listAdminParkingRights = action((req) => service.listAdminParkingRights(req.query as never));
export const verifyRight = action((req) => service.verifyParkingRight(userId(req), param(req, "rightId"), req.body));
export const listAdminRightAmendments = action((req) => service.listAdminParkingRightAmendments(req.query as never));
export const reviewRightAmendment = action((req) => service.reviewParkingRightAmendment(userId(req), param(req, "amendmentId"), req.body));

export const createListing = action((req) => service.createListing(userId(req), req.body), 201);
export const listListings = action((req) => service.listListings(userId(req)));
export const getListing = action((req) => service.getListing(userId(req), param(req, "listingId")));
export const updateListing = action((req) => service.updateListing(userId(req), param(req, "listingId"), req.body));
export const activateListing = action((req) => service.activateListing(userId(req), param(req, "listingId")));
export const pauseListing = action((req) => service.pauseListing(userId(req), param(req, "listingId")));
export const endListing = action((req) => service.endListing(userId(req), param(req, "listingId")));
export const suspendListing = action((req) => service.suspendListing(userId(req), param(req, "listingId"), req.body.reason));
export const resumeListing = action((req) => service.resumeListing(userId(req), param(req, "listingId"), req.body.reason));
export const reportListing = action((req) => service.reportListing(userId(req), param(req, "listingId"), req.body), 201);

export const replaceAvailability = action((req) => service.replaceAvailability(userId(req), param(req, "resourceId"), req.body.rules));
export const createAvailabilityException = action((req) => service.createAvailabilityException(userId(req), param(req, "resourceId"), req.body), 201);
export const updateAvailabilityException = action((req) => service.updateAvailabilityException(userId(req), param(req, "exceptionId"), req.body));
export const deleteAvailabilityException = action(async (req) => {
  await service.deleteAvailabilityException(userId(req), param(req, "exceptionId"));
  return { deleted: true };
});
export const listAvailability = action((req) => service.listAvailability(userId(req), param(req, "resourceId")));

export const searchParking = action((req) => service.searchParking(req.query as never));
export const browseParking = action((req) => service.browseParking(req.query as never));
export const getPublicPropertyDetail = action((req) => service.getPublicPropertyDetail(param(req, "propertyId"), req.query as never));
export const listDriverFavorites = action((req) => service.listDriverFavorites(userId(req)));
export const addDriverFavorite = action((req) => service.addDriverFavorite(userId(req), param(req, "propertyId")), 201);
export const removeDriverFavorite = action((req) => service.removeDriverFavorite(userId(req), param(req, "propertyId")));
export const listDriverSavedLocations = action((req) => service.listDriverSavedLocations(userId(req)));
export const createDriverSavedLocation = action((req) => service.createDriverSavedLocation(userId(req), req.body), 201);
export const updateDriverSavedLocation = action((req) => service.updateDriverSavedLocation(userId(req), param(req, "locationId"), req.body));
export const deleteDriverSavedLocation = action((req) => service.deleteDriverSavedLocation(userId(req), param(req, "locationId")));
export const listDriverSearchHistory = action((req) => service.listDriverSearchHistory(userId(req)));
export const addDriverSearchHistory = action((req) => service.addDriverSearchHistory(userId(req), req.body), 201);
export const clearDriverSearchHistory = action((req) => service.clearDriverSearchHistory(userId(req)));
export const deleteDriverSearchHistoryItem = action((req) => service.deleteDriverSearchHistoryItem(userId(req), param(req, "searchId")));
export const createQuote = action((req) => service.createQuote(userId(req), req.body), 201);
export const getQuote = action((req) => service.getQuote(userId(req), param(req, "quoteId")));
export const createHold = action((req) => service.createHold(userId(req), req.body), 201);
export const getHold = action((req) => service.getHold(userId(req), param(req, "holdId")));
export const releaseHold = action((req) => service.releaseHold(userId(req), param(req, "holdId")));
export const createBooking = action((req) => service.createBooking(userId(req), req.body), 201);
export const listDriverBookings = action((req) => service.listDriverBookings(userId(req)));
export const getDriverBooking = action((req) => service.getDriverBooking(userId(req), param(req, "bookingId")));
export const listProviderBookings = action((req) => service.listProviderBookings(userId(req)));
export const getProviderBooking = action((req) =>
  service.getProviderBooking(userId(req), param(req, "bookingId")),
);
export const listGuardBookings = action((req) => service.listGuardBookings(userId(req), req.query as never));
export const getGuardBooking = action((req) => service.getGuardBooking(userId(req), param(req, "bookingId")));
export const previewBookingCancellation = action((req) => service.previewBookingCancellation(userId(req), param(req, "bookingId")));
export const cancelBooking = action((req) => service.cancelBooking(userId(req), param(req, "bookingId"), req.body));
export const capturePayment = action((req) => service.captureSimulatedPayment(userId(req), req.body), 201);
export const verifyCredential = action((req) => service.verifyAccessCredential(userId(req), req.body.credential));
export const checkIn = action((req) => service.checkInBooking(userId(req), param(req, "bookingId"), req.body.credential));
export const requestCheckout = action((req) => service.requestCheckout(userId(req), param(req, "bookingId")));
export const checkOut = action((req) => service.checkOutBooking(userId(req), param(req, "bookingId")));
export const getDriverBookingSettlement = action((req) => service.getDriverBookingSettlement(userId(req), param(req, "bookingId")));
export const getProviderBookingSettlement = action((req) => service.getProviderBookingSettlement(userId(req), param(req, "bookingId")));

export const getWallet = action((req) => service.getWallet(userId(req)));
export const listWalletTransactions = action((req) => service.listWalletTransactions(userId(req)));
export const earningsSummary = action((req) => service.getEarningsSummary(userId(req)));
export const listEarningsTransactions = action((req) => service.listEarningsTransactions(userId(req)));
export const listPayoutMethods = action((req) => service.listProviderPayoutMethods(userId(req)));
export const createPayoutMethod = action((req) => service.createProviderPayoutMethod(userId(req), req.body), 201);
export const setDefaultPayoutMethod = action((req) => service.setDefaultProviderPayoutMethod(userId(req), param(req, "payoutMethodId")));
export const deactivatePayoutMethod = action((req) => service.deactivateProviderPayoutMethod(userId(req), param(req, "payoutMethodId")));
export const createRefund = action((req) => service.createRefund(userId(req), param(req, "paymentId"), req.body), 201);
export const listDriverRefunds = action((req) => service.listDriverRefunds(userId(req), req.query as never));
export const getDriverRefund = action((req) => service.getDriverRefund(userId(req), param(req, "refundId")));
export const createPayout = action((req) => service.createPayout(userId(req), req.body), 201);
export const listProviderPayouts = action((req) => service.listProviderPayouts(userId(req), req.query as never));
export const getProviderPayout = action((req) => service.getProviderPayout(userId(req), param(req, "payoutId")));
export const listPayouts = action((req) => service.listPayouts(req.query as never));
export const reviewPayout = action((req) => service.reviewPayout(userId(req), param(req, "payoutId"), req.body));

export const listNotifications = action((req) => service.listNotifications(userId(req)));
export const readNotification = action(async (req) => { await service.markNotificationRead(userId(req), param(req, "notificationId")); return { read: true }; });
export const readAllNotifications = action((req) => service.markAllNotificationsRead(userId(req)));
export const createReview = action((req) => service.createReview(userId(req), param(req, "bookingId"), req.body), 201);
export const listDriverReviews = action((req) => service.listDriverReviews(userId(req)));
export const listProviderReviews = action((req) => service.listProviderReviews(userId(req)));
export const replyReview = action((req) => service.replyReview(userId(req), param(req, "reviewId"), req.body.reply));
export const createDispute = action((req) => service.createDispute(userId(req), param(req, "bookingId"), req.body), 201);
export const listDriverDisputes = action((req) => service.listDriverDisputes(userId(req), req.query as never));
export const getDriverDispute = action((req) => service.getDriverDispute(userId(req), param(req, "disputeId")));
export const listProviderDisputes = action((req) => service.listProviderDisputes(userId(req), req.query as never));
export const getProviderDispute = action((req) => service.getProviderDispute(userId(req), param(req, "disputeId")));
export const resolveDispute = action((req) => service.resolveDispute(userId(req), param(req, "disputeId"), req.body));
export const listDisputes = action((req) => service.listDisputes(req.query as never));
export const listAdminListings = action((req) => service.listAdminListings(req.query as never));
export const getAdminListing = action((req) => service.getAdminListing(param(req, "listingId")));
