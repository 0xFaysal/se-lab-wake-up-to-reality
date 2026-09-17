import { Router } from "express";
import { UserRoleType } from "../../../generated/prisma/client.js";
import { authenticate } from "../../common/middleware/auth.js";
import { requireAccountReady } from "../../common/middleware/require-account-ready.js";
import { requireRole } from "../../common/middleware/require-role.js";
import { sensitiveAccountRateLimit } from "../../common/middleware/rate-limit.js";
import { validate } from "../../common/middleware/validate.js";
import * as controller from "./marketplace.controller.js";
import * as schema from "./marketplace.schema.js";

export const marketplaceRouter = Router();
const providerOrManager = requireRole(UserRoleType.PROVIDER, UserRoleType.MANAGER);

/**
 * @openapi
 * /api/v1/parking/search:
 *   get:
 *     tags: [Parking Marketplace]
 *     summary: Search available parking grouped by canonical Property
 *     parameters:
 *       - { in: query, name: latitude, required: true, schema: { type: number } }
 *       - { in: query, name: longitude, required: true, schema: { type: number } }
 *       - { in: query, name: radiusKm, schema: { type: number, default: 10 } }
 *       - { in: query, name: startAt, required: true, schema: { type: string, format: date-time } }
 *       - { in: query, name: endAt, required: true, schema: { type: string, format: date-time } }
 *       - { in: query, name: vehicleType, required: true, schema: { type: string } }
 *     responses: { 200: { description: Available Property summaries and offers. } }
 */
marketplaceRouter.get("/parking/search", validate(schema.searchParkingSchema), controller.searchParking);

marketplaceRouter.use(authenticate, requireAccountReady);

/**
 * @openapi
 * /api/v1/provider/properties/{propertyId}/parking-resources:
 *   post:
 *     tags: [Parking Resources]
 *     summary: Create a fixed space or shared pool
 *     security: [{ accessCookie: [] }]
 *     responses: { 201: { description: Resource created. }, 409: { description: Resource code conflict. } }
 *   get:
 *     tags: [Parking Resources]
 *     summary: List Provider-scoped parking resources
 *     security: [{ accessCookie: [] }]
 *     responses: { 200: { description: Resource list. } }
 * /api/v1/provider/parking-resources/{resourceId}:
 *   get: { tags: [Parking Resources], summary: Get parking resource, security: [{ accessCookie: [] }], responses: { 200: { description: Resource detail. } } }
 *   patch: { tags: [Parking Resources], summary: Update parking resource, security: [{ accessCookie: [] }], responses: { 200: { description: Resource updated. } } }
 *   delete: { tags: [Parking Resources], summary: Soft-delete parking resource, security: [{ accessCookie: [] }], responses: { 200: { description: Resource deleted. } } }
 */
marketplaceRouter.post("/provider/properties/:propertyId/parking-resources", providerOrManager, validate(schema.createResourceSchema), controller.createResource);
marketplaceRouter.get("/provider/properties/:propertyId/parking-resources", providerOrManager, validate(schema.propertyResourceParamsSchema), controller.listResources);
marketplaceRouter.get("/provider/parking-resources/:resourceId", providerOrManager, validate(schema.resourceParamsSchema), controller.getResource);
marketplaceRouter.patch("/provider/parking-resources/:resourceId", providerOrManager, validate(schema.updateResourceSchema), controller.updateResource);
marketplaceRouter.delete("/provider/parking-resources/:resourceId", providerOrManager, validate(schema.resourceParamsSchema), controller.deleteResource);

/**
 * @openapi
 * /api/v1/provider/parking-resources/{resourceId}/rights/claims:
 *   post: { tags: [Parking Rights], summary: Submit a parking-right claim, security: [{ accessCookie: [] }], responses: { 201: { description: Claim submitted. } } }
 * /api/v1/provider/parking-rights:
 *   get: { tags: [Parking Rights], summary: List accessible parking rights, security: [{ accessCookie: [] }], responses: { 200: { description: Parking-right list. } } }
 * /api/v1/admin/parking-rights/pending:
 *   get: { tags: [Parking Rights], summary: List pending rights for Admin verification, security: [{ accessCookie: [] }], responses: { 200: { description: Pending claims. } } }
 * /api/v1/admin/parking-rights/{rightId}/verification:
 *   patch: { tags: [Parking Rights], summary: Verify, reject, dispute, or revoke a right, security: [{ accessCookie: [] }], responses: { 200: { description: Right updated. } } }
 */
marketplaceRouter.post("/provider/parking-resources/:resourceId/rights/claims", providerOrManager, validate(schema.claimRightSchema), controller.claimRight);
marketplaceRouter.get("/provider/parking-rights", providerOrManager, controller.listRights);
marketplaceRouter.get("/provider/parking-rights/:rightId", providerOrManager, validate(schema.rightParamsSchema), controller.getRight);
marketplaceRouter.get("/admin/parking-rights/pending", requireRole(UserRoleType.ADMIN), controller.listPendingRights);
marketplaceRouter.patch("/admin/parking-rights/:rightId/verification", requireRole(UserRoleType.ADMIN), validate(schema.verifyRightSchema), controller.verifyRight);

/**
 * @openapi
 * /api/v1/provider/listings:
 *   post: { tags: [Parking Listings], summary: Create listing from a verified commercial right, security: [{ accessCookie: [] }], responses: { 201: { description: Draft listing created. } } }
 *   get: { tags: [Parking Listings], summary: List Provider or delegated Manager listings, security: [{ accessCookie: [] }], responses: { 200: { description: Listing list. } } }
 * /api/v1/provider/listings/{listingId}/activate:
 *   post: { tags: [Parking Listings], summary: Activate an eligible listing, security: [{ accessCookie: [] }], responses: { 200: { description: Listing activated. } } }
 * /api/v1/provider/listings/{listingId}/pause:
 *   post: { tags: [Parking Listings], summary: Pause listing, security: [{ accessCookie: [] }], responses: { 200: { description: Listing paused. } } }
 */
marketplaceRouter.post("/provider/listings", providerOrManager, validate(schema.createListingSchema), controller.createListing);
marketplaceRouter.get("/provider/listings", providerOrManager, controller.listListings);
marketplaceRouter.get("/provider/listings/:listingId", providerOrManager, validate(schema.listingParamsSchema), controller.getListing);
marketplaceRouter.patch("/provider/listings/:listingId", providerOrManager, validate(schema.updateListingSchema), controller.updateListing);
marketplaceRouter.post("/provider/listings/:listingId/activate", providerOrManager, validate(schema.listingParamsSchema), controller.activateListing);
marketplaceRouter.post("/provider/listings/:listingId/pause", providerOrManager, validate(schema.listingParamsSchema), controller.pauseListing);
marketplaceRouter.delete("/provider/listings/:listingId", providerOrManager, validate(schema.listingParamsSchema), controller.endListing);
/**
 * @openapi
 * /api/v1/admin/listings/{listingId}/suspend:
 *   post: { tags: [Parking Listings], summary: Suspend a marketplace listing with an audited reason, security: [{ accessCookie: [] }], responses: { 200: { description: Listing suspended. } } }
 */
marketplaceRouter.post("/admin/listings/:listingId/suspend", requireRole(UserRoleType.ADMIN), validate(schema.adminListingSuspensionSchema), controller.suspendListing);

/**
 * @openapi
 * /api/v1/provider/parking-resources/{resourceId}/availability:
 *   get: { tags: [Availability], summary: Get weekly rules and exceptions, security: [{ accessCookie: [] }], responses: { 200: { description: Asia/Dhaka availability configuration. } } }
 *   put: { tags: [Availability], summary: Atomically replace weekly schedule, security: [{ accessCookie: [] }], responses: { 200: { description: Schedule replaced. } } }
 * /api/v1/provider/parking-resources/{resourceId}/availability/exceptions:
 *   post: { tags: [Availability], summary: Add date-specific availability override, security: [{ accessCookie: [] }], responses: { 201: { description: Exception created. } } }
 */
marketplaceRouter.get("/provider/parking-resources/:resourceId/availability", providerOrManager, validate(schema.resourceParamsSchema), controller.listAvailability);
marketplaceRouter.put("/provider/parking-resources/:resourceId/availability", providerOrManager, validate(schema.replaceAvailabilitySchema), controller.replaceAvailability);
marketplaceRouter.post("/provider/parking-resources/:resourceId/availability/exceptions", providerOrManager, validate(schema.createAvailabilityExceptionSchema), controller.createAvailabilityException);

/**
 * @openapi
 * /api/v1/parking/quotes:
 *   post: { tags: [Booking], summary: Create authoritative server quote, security: [{ accessCookie: [] }], responses: { 201: { description: Five-minute quote created. } } }
 * /api/v1/parking/holds:
 *   post: { tags: [Booking], summary: Atomically hold quoted capacity, security: [{ accessCookie: [] }], responses: { 201: { description: Five-minute DB-backed hold created. }, 409: { description: Capacity unavailable. } } }
 * /api/v1/bookings:
 *   post: { tags: [Booking], summary: Create payment-pending booking from active hold, security: [{ accessCookie: [] }], responses: { 201: { description: Booking created idempotently. } } }
 *   get: { tags: [Booking], summary: List Driver bookings, security: [{ accessCookie: [] }], responses: { 200: { description: Driver-scoped bookings. } } }
 */
marketplaceRouter.post("/parking/quotes", requireRole(UserRoleType.DRIVER), validate(schema.createQuoteSchema), controller.createQuote);
marketplaceRouter.get("/parking/quotes/:quoteId", requireRole(UserRoleType.DRIVER), validate(schema.quoteParamsSchema), controller.getQuote);
marketplaceRouter.post("/parking/holds", requireRole(UserRoleType.DRIVER), validate(schema.createHoldSchema), controller.createHold);
marketplaceRouter.get("/parking/holds/:holdId", requireRole(UserRoleType.DRIVER), validate(schema.holdParamsSchema), controller.getHold);
marketplaceRouter.delete("/parking/holds/:holdId", requireRole(UserRoleType.DRIVER), validate(schema.holdParamsSchema), controller.releaseHold);
marketplaceRouter.post("/bookings", requireRole(UserRoleType.DRIVER), validate(schema.createBookingSchema), controller.createBooking);
marketplaceRouter.get("/bookings", requireRole(UserRoleType.DRIVER), controller.listDriverBookings);
marketplaceRouter.get("/bookings/:bookingId", requireRole(UserRoleType.DRIVER), validate(schema.bookingParamsSchema), controller.getDriverBooking);
marketplaceRouter.post("/bookings/:bookingId/cancel", requireRole(UserRoleType.DRIVER), validate(schema.bookingParamsSchema), controller.cancelBooking);
marketplaceRouter.post("/bookings/:bookingId/checkout-request", requireRole(UserRoleType.DRIVER), validate(schema.bookingParamsSchema), controller.requestCheckout);
marketplaceRouter.get("/provider/bookings", providerOrManager, controller.listProviderBookings);

/**
 * @openapi
 * /api/v1/payments/simulated/capture:
 *   post: { tags: [Payments], summary: Capture semester-MVP simulated payment, description: Does not claim a real bank or MFS transfer., security: [{ accessCookie: [] }], responses: { 201: { description: Payment, balanced ledger, confirmation, and one-time access token created. } } }
 * /api/v1/guard/access/verify:
 *   post: { tags: [Guard Booking Operations], summary: Verify access credential within Guard scope, security: [{ accessCookie: [] }], responses: { 200: { description: Credential and booking details verified. } } }
 */
marketplaceRouter.post("/payments/simulated/capture", requireRole(UserRoleType.DRIVER), sensitiveAccountRateLimit, validate(schema.capturePaymentSchema), controller.capturePayment);
marketplaceRouter.post("/guard/access/verify", requireRole(UserRoleType.GUARD), validate(schema.verifyCredentialSchema), controller.verifyCredential);
marketplaceRouter.post("/guard/bookings/:bookingId/check-in", requireRole(UserRoleType.GUARD), validate(schema.bookingParamsSchema.merge(schema.verifyCredentialSchema)), controller.checkIn);
marketplaceRouter.post("/guard/bookings/:bookingId/check-out", requireRole(UserRoleType.GUARD), validate(schema.bookingParamsSchema), controller.checkOut);

/**
 * @openapi
 * /api/v1/wallet:
 *   get: { tags: [Wallet], summary: Get authenticated user's BDT wallet, security: [{ accessCookie: [] }], responses: { 200: { description: Wallet balances. } } }
 * /api/v1/provider/earnings/summary:
 *   get: { tags: [Wallet], summary: Get Provider earnings or delegated earnings view, security: [{ accessCookie: [] }], responses: { 200: { description: Aggregate earnings. } } }
 */
marketplaceRouter.get("/wallet", controller.getWallet);
marketplaceRouter.get("/wallet/transactions", controller.listWalletTransactions);
marketplaceRouter.get("/provider/earnings/summary", providerOrManager, controller.earningsSummary);
marketplaceRouter.get("/provider/earnings/transactions", providerOrManager, controller.listEarningsTransactions);
marketplaceRouter.post("/payments/:paymentId/refunds", requireRole(UserRoleType.DRIVER, UserRoleType.PROVIDER), sensitiveAccountRateLimit, validate(schema.refundSchema), controller.createRefund);
marketplaceRouter.post("/provider/payouts", requireRole(UserRoleType.PROVIDER), sensitiveAccountRateLimit, validate(schema.payoutSchema), controller.createPayout);
/**
 * @openapi
 * /api/v1/admin/payouts:
 *   get: { tags: [Wallet], summary: List payout requests for manual review, security: [{ accessCookie: [] }], responses: { 200: { description: Payout review queue. } } }
 * /api/v1/admin/payouts/{payoutId}:
 *   patch: { tags: [Wallet], summary: Approve, reject, or mark an approved simulated payout paid, security: [{ accessCookie: [] }], responses: { 200: { description: Payout and wallet reservation updated atomically. } } }
 */
marketplaceRouter.get("/admin/payouts", requireRole(UserRoleType.ADMIN), validate(schema.adminPayoutQuerySchema), controller.listPayouts);
marketplaceRouter.patch("/admin/payouts/:payoutId", requireRole(UserRoleType.ADMIN), sensitiveAccountRateLimit, validate(schema.adminPayoutReviewSchema), controller.reviewPayout);

/**
 * @openapi
 * /api/v1/notifications:
 *   get: { tags: [Notifications], summary: List persistent notifications, security: [{ accessCookie: [] }], responses: { 200: { description: Notification list. } } }
 * /api/v1/bookings/{bookingId}/reviews:
 *   post: { tags: [Reviews], summary: Review a completed Driver booking once, security: [{ accessCookie: [] }], responses: { 201: { description: Review created. } } }
 * /api/v1/bookings/{bookingId}/disputes:
 *   post: { tags: [Disputes], summary: Open one dispute for a related booking, security: [{ accessCookie: [] }], responses: { 201: { description: Dispute opened. } } }
 */
marketplaceRouter.get("/notifications", controller.listNotifications);
marketplaceRouter.patch("/notifications/:notificationId/read", validate(schema.notificationParamsSchema), controller.readNotification);
marketplaceRouter.post("/notifications/read-all", controller.readAllNotifications);
marketplaceRouter.post("/bookings/:bookingId/reviews", requireRole(UserRoleType.DRIVER), validate(schema.createReviewSchema), controller.createReview);
marketplaceRouter.get("/provider/reviews", providerOrManager, controller.listProviderReviews);
marketplaceRouter.post("/provider/reviews/:reviewId/reply", providerOrManager, validate(schema.replyReviewSchema), controller.replyReview);
marketplaceRouter.post("/bookings/:bookingId/disputes", requireRole(UserRoleType.DRIVER, UserRoleType.PROVIDER), validate(schema.createDisputeSchema), controller.createDispute);
/**
 * @openapi
 * /api/v1/admin/disputes:
 *   get: { tags: [Disputes], summary: List booking disputes for Admin review, security: [{ accessCookie: [] }], responses: { 200: { description: Dispute queue. } } }
 * /api/v1/admin/disputes/{disputeId}:
 *   patch: { tags: [Disputes], summary: Resolve or reject a booking dispute, security: [{ accessCookie: [] }], responses: { 200: { description: Dispute resolved and user notified. } } }
 */
marketplaceRouter.get("/admin/disputes", requireRole(UserRoleType.ADMIN), validate(schema.adminDisputeQuerySchema), controller.listDisputes);
marketplaceRouter.patch("/admin/disputes/:disputeId", requireRole(UserRoleType.ADMIN), validate(schema.resolveDisputeSchema), controller.resolveDispute);

/**
 * @openapi
 * /api/v1/provider/parking-rights/{rightId}:
 *   get: { tags: [Parking Rights], summary: Get one accessible parking right, security: [{ accessCookie: [] }], responses: { 200: { description: Parking-right detail. } } }
 * /api/v1/provider/listings/{listingId}:
 *   get: { tags: [Parking Listings], summary: Get an accessible listing, security: [{ accessCookie: [] }], responses: { 200: { description: Listing detail. } } }
 *   patch: { tags: [Parking Listings], summary: Update listing fields within delegated permissions, security: [{ accessCookie: [] }], responses: { 200: { description: Listing updated. } } }
 *   delete: { tags: [Parking Listings], summary: End a listing, security: [{ accessCookie: [] }], responses: { 200: { description: Listing ended. } } }
 * /api/v1/parking/quotes/{quoteId}:
 *   get: { tags: [Booking], summary: Get a Driver-owned quote and expiry state, security: [{ accessCookie: [] }], responses: { 200: { description: Quote detail. } } }
 * /api/v1/parking/holds/{holdId}:
 *   get: { tags: [Booking], summary: Get a Driver-owned reservation hold, security: [{ accessCookie: [] }], responses: { 200: { description: Hold detail. } } }
 *   delete: { tags: [Booking], summary: Release an active hold idempotently, security: [{ accessCookie: [] }], responses: { 200: { description: Hold released. } } }
 * /api/v1/bookings/{bookingId}:
 *   get: { tags: [Booking], summary: Get a Driver-owned booking, security: [{ accessCookie: [] }], responses: { 200: { description: Booking detail. } } }
 * /api/v1/bookings/{bookingId}/cancel:
 *   post: { tags: [Booking], summary: Cancel an eligible Driver booking, security: [{ accessCookie: [] }], responses: { 200: { description: Booking cancelled and capacity released. } } }
 * /api/v1/bookings/{bookingId}/checkout-request:
 *   post: { tags: [Booking], summary: Request Guard-confirmed checkout, security: [{ accessCookie: [] }], responses: { 200: { description: Checkout requested. } } }
 * /api/v1/provider/bookings:
 *   get: { tags: [Booking], summary: List Provider or delegated Manager bookings, security: [{ accessCookie: [] }], responses: { 200: { description: Scoped booking list. } } }
 * /api/v1/guard/bookings/{bookingId}/check-in:
 *   post: { tags: [Guard Booking Operations], summary: Check in using a valid one-time credential, security: [{ accessCookie: [] }], responses: { 200: { description: Booking checked in. } } }
 * /api/v1/guard/bookings/{bookingId}/check-out:
 *   post: { tags: [Guard Booking Operations], summary: Complete checkout and release settlement, security: [{ accessCookie: [] }], responses: { 200: { description: Booking completed. } } }
 * /api/v1/wallet/transactions:
 *   get: { tags: [Wallet], summary: List safe wallet ledger projections, security: [{ accessCookie: [] }], responses: { 200: { description: Wallet transaction list. } } }
 * /api/v1/provider/earnings/transactions:
 *   get: { tags: [Wallet], summary: List authorized Provider earnings transactions, security: [{ accessCookie: [] }], responses: { 200: { description: Scoped earnings transactions. } } }
 * /api/v1/payments/{paymentId}/refunds:
 *   post: { tags: [Payments], summary: Create an idempotent full or partial refund, security: [{ accessCookie: [] }], responses: { 201: { description: Balanced refund posted. } } }
 * /api/v1/provider/payouts:
 *   post: { tags: [Wallet], summary: Reserve available balance for manual payout, security: [{ accessCookie: [] }], responses: { 201: { description: Payout requested. } } }
 * /api/v1/notifications/{notificationId}/read:
 *   patch: { tags: [Notifications], summary: Mark one owned notification read, security: [{ accessCookie: [] }], responses: { 200: { description: Notification marked read. } } }
 * /api/v1/notifications/read-all:
 *   post: { tags: [Notifications], summary: Mark all owned notifications read, security: [{ accessCookie: [] }], responses: { 200: { description: Notifications updated. } } }
 * /api/v1/provider/reviews:
 *   get: { tags: [Reviews], summary: List Provider or delegated Manager reviews, security: [{ accessCookie: [] }], responses: { 200: { description: Scoped review list. } } }
 * /api/v1/provider/reviews/{reviewId}/reply:
 *   post: { tags: [Reviews], summary: Reply to a review within Provider scope, security: [{ accessCookie: [] }], responses: { 200: { description: Review reply saved. } } }
 */
