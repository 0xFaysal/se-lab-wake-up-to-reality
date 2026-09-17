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
export const listResources = action((req) => service.listResources(userId(req), param(req, "propertyId")));
export const getResource = action((req) => service.getResource(userId(req), param(req, "resourceId")));
export const updateResource = action((req) => service.updateResource(userId(req), param(req, "resourceId"), req.body));
export const deleteResource = action(async (req) => { await service.deleteResource(userId(req), param(req, "resourceId")); return { deleted: true }; });
export const claimRight = action((req) => service.claimParkingRight(userId(req), param(req, "resourceId"), req.body), 201);
export const listRights = action((req) => service.listParkingRights(userId(req)));
export const getRight = action((req) => service.getParkingRight(userId(req), param(req, "rightId")));
export const listPendingRights = action(() => service.listPendingRights());
export const verifyRight = action((req) => service.verifyParkingRight(userId(req), param(req, "rightId"), req.body));

export const createListing = action((req) => service.createListing(userId(req), req.body), 201);
export const listListings = action((req) => service.listListings(userId(req)));
export const getListing = action((req) => service.getListing(userId(req), param(req, "listingId")));
export const updateListing = action((req) => service.updateListing(userId(req), param(req, "listingId"), req.body));
export const activateListing = action((req) => service.activateListing(userId(req), param(req, "listingId")));
export const pauseListing = action((req) => service.pauseListing(userId(req), param(req, "listingId")));
export const endListing = action((req) => service.endListing(userId(req), param(req, "listingId")));
export const suspendListing = action((req) => service.suspendListing(userId(req), param(req, "listingId"), req.body.reason));

export const replaceAvailability = action((req) => service.replaceAvailability(userId(req), param(req, "resourceId"), req.body.rules));
export const createAvailabilityException = action((req) => service.createAvailabilityException(userId(req), param(req, "resourceId"), req.body), 201);
export const listAvailability = action((req) => service.listAvailability(userId(req), param(req, "resourceId")));

export const searchParking = action((req) => service.searchParking(req.query as never));
export const createQuote = action((req) => service.createQuote(userId(req), req.body), 201);
export const getQuote = action((req) => service.getQuote(userId(req), param(req, "quoteId")));
export const createHold = action((req) => service.createHold(userId(req), req.body), 201);
export const getHold = action((req) => service.getHold(userId(req), param(req, "holdId")));
export const releaseHold = action((req) => service.releaseHold(userId(req), param(req, "holdId")));
export const createBooking = action((req) => service.createBooking(userId(req), req.body), 201);
export const listDriverBookings = action((req) => service.listDriverBookings(userId(req)));
export const getDriverBooking = action((req) => service.getDriverBooking(userId(req), param(req, "bookingId")));
export const listProviderBookings = action((req) => service.listProviderBookings(userId(req)));
export const cancelBooking = action((req) => service.cancelBooking(userId(req), param(req, "bookingId")));
export const capturePayment = action((req) => service.captureSimulatedPayment(userId(req), req.body), 201);
export const verifyCredential = action((req) => service.verifyAccessCredential(userId(req), req.body.credential));
export const checkIn = action((req) => service.checkInBooking(userId(req), param(req, "bookingId"), req.body.credential));
export const requestCheckout = action((req) => service.requestCheckout(userId(req), param(req, "bookingId")));
export const checkOut = action((req) => service.checkOutBooking(userId(req), param(req, "bookingId")));

export const getWallet = action((req) => service.getWallet(userId(req)));
export const listWalletTransactions = action((req) => service.listWalletTransactions(userId(req)));
export const earningsSummary = action((req) => service.getEarningsSummary(userId(req)));
export const listEarningsTransactions = action((req) => service.listEarningsTransactions(userId(req)));
export const createRefund = action((req) => service.createRefund(userId(req), param(req, "paymentId"), req.body), 201);
export const createPayout = action((req) => service.createPayout(userId(req), req.body), 201);
export const listPayouts = action((req) => service.listPayouts(req.query.status as never));
export const reviewPayout = action((req) => service.reviewPayout(userId(req), param(req, "payoutId"), req.body));

export const listNotifications = action((req) => service.listNotifications(userId(req)));
export const readNotification = action(async (req) => { await service.markNotificationRead(userId(req), param(req, "notificationId")); return { read: true }; });
export const readAllNotifications = action((req) => service.markAllNotificationsRead(userId(req)));
export const createReview = action((req) => service.createReview(userId(req), param(req, "bookingId"), req.body), 201);
export const listProviderReviews = action((req) => service.listProviderReviews(userId(req)));
export const replyReview = action((req) => service.replyReview(userId(req), param(req, "reviewId"), req.body.reply));
export const createDispute = action((req) => service.createDispute(userId(req), param(req, "bookingId"), req.body), 201);
export const resolveDispute = action((req) => service.resolveDispute(userId(req), param(req, "disputeId"), req.body));
export const listDisputes = action((req) => service.listDisputes(req.query.status as never));
