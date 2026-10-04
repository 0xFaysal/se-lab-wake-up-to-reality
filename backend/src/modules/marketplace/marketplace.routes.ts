import { Router } from "express";
import { UserRoleType } from "../../../generated/prisma/client.js";
import { authenticate } from "../../common/middleware/auth.js";
import { requireAccountReady } from "../../common/middleware/require-account-ready.js";
import { requireRole } from "../../common/middleware/require-role.js";
import { sensitiveAccountRateLimit } from "../../common/middleware/rate-limit.js";
import { rightDocumentUpload } from "../../common/uploads/right-document-upload.middleware.js";
import { validate } from "../../common/middleware/validate.js";
import * as controller from "./marketplace.controller.js";
import * as schema from "./marketplace.schema.js";

export const marketplaceRouter = Router();
const providerOrManager = requireRole(
  UserRoleType.PROVIDER,
  UserRoleType.MANAGER,
);

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
marketplaceRouter.get(
  "/parking/search",
  validate(schema.searchParkingSchema),
  controller.searchParking,
);
marketplaceRouter.get(
  "/parking/browse",
  validate(schema.browseParkingSchema),
  controller.browseParking,
);
marketplaceRouter.get(
  "/parking/properties/:propertyId",
  validate(schema.publicPropertyDetailSchema),
  controller.getPublicPropertyDetail,
);

marketplaceRouter.use(authenticate, requireAccountReady);
marketplaceRouter.get("/driver/listings/:listingId/location", requireRole(UserRoleType.DRIVER), sensitiveAccountRateLimit, validate(schema.listingParamsSchema), controller.driverListingLocation);
marketplaceRouter.get("/provider/session-timeline", providerOrManager, validate(schema.sessionTimelineSchema), controller.sessionTimeline);

/**
 * @openapi
 * /api/v1/driver/favorites:
 *   get: { tags: [Driver Discovery], summary: List the authenticated Driver's favorite verified properties, security: [{ accessCookie: [] }], responses: { 200: { description: Favorite properties. } } }
 * /api/v1/driver/favorites/{propertyId}:
 *   post: { tags: [Driver Discovery], summary: Add a verified property to favorites, security: [{ accessCookie: [] }], responses: { 201: { description: Favorite saved idempotently. } } }
 *   delete: { tags: [Driver Discovery], summary: Remove a property from favorites, security: [{ accessCookie: [] }], responses: { 200: { description: Favorite removed. } } }
 * /api/v1/driver/saved-locations:
 *   get: { tags: [Driver Discovery], summary: List private saved search locations, security: [{ accessCookie: [] }], responses: { 200: { description: Saved locations. } } }
 *   post: { tags: [Driver Discovery], summary: Save a private search location, security: [{ accessCookie: [] }], responses: { 201: { description: Location saved. } } }
 * /api/v1/driver/recent-searches:
 *   get: { tags: [Driver Discovery], summary: List bounded recent parking searches, security: [{ accessCookie: [] }], responses: { 200: { description: Recent searches. } } }
 *   post: { tags: [Driver Discovery], summary: Record a privacy-rounded parking search, security: [{ accessCookie: [] }], responses: { 201: { description: Search recorded. } } }
 *   delete: { tags: [Driver Discovery], summary: Clear parking search history, security: [{ accessCookie: [] }], responses: { 200: { description: Search history cleared. } } }
 * /api/v1/driver/recent-searches/{searchId}:
 *   delete: { tags: [Driver Discovery], summary: Remove one parking search from history, security: [{ accessCookie: [] }], responses: { 200: { description: Search history item removed. } } }
 */
marketplaceRouter.get(
  "/driver/favorites",
  requireRole(UserRoleType.DRIVER),
  controller.listDriverFavorites,
);
marketplaceRouter.post(
  "/driver/favorites/:propertyId",
  requireRole(UserRoleType.DRIVER),
  validate(schema.driverFavoriteParamsSchema),
  controller.addDriverFavorite,
);
marketplaceRouter.delete(
  "/driver/favorites/:propertyId",
  requireRole(UserRoleType.DRIVER),
  validate(schema.driverFavoriteParamsSchema),
  controller.removeDriverFavorite,
);
marketplaceRouter.get(
  "/driver/saved-locations",
  requireRole(UserRoleType.DRIVER),
  controller.listDriverSavedLocations,
);
marketplaceRouter.post(
  "/driver/saved-locations",
  requireRole(UserRoleType.DRIVER),
  validate(schema.createSavedLocationSchema),
  controller.createDriverSavedLocation,
);
marketplaceRouter.patch(
  "/driver/saved-locations/:locationId",
  requireRole(UserRoleType.DRIVER),
  validate(schema.updateSavedLocationSchema),
  controller.updateDriverSavedLocation,
);
marketplaceRouter.delete(
  "/driver/saved-locations/:locationId",
  requireRole(UserRoleType.DRIVER),
  validate(schema.savedLocationParamsSchema),
  controller.deleteDriverSavedLocation,
);
marketplaceRouter.get(
  "/driver/recent-searches",
  requireRole(UserRoleType.DRIVER),
  controller.listDriverSearchHistory,
);
marketplaceRouter.post(
  "/driver/recent-searches",
  requireRole(UserRoleType.DRIVER),
  validate(schema.createSearchHistorySchema),
  controller.addDriverSearchHistory,
);
marketplaceRouter.delete(
  "/driver/recent-searches",
  requireRole(UserRoleType.DRIVER),
  controller.clearDriverSearchHistory,
);
marketplaceRouter.delete(
  "/driver/recent-searches/:searchId",
  requireRole(UserRoleType.DRIVER),
  validate(schema.searchHistoryParamsSchema),
  controller.deleteDriverSearchHistoryItem,
);

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
marketplaceRouter.post(
  "/provider/properties/:propertyId/parking-resources",
  providerOrManager,
  validate(schema.createResourceSchema),
  controller.createResource,
);
marketplaceRouter.post(
  "/provider/properties/:propertyId/parking-resources/bulk",
  providerOrManager,
  validate(schema.createBulkResourcesSchema),
  controller.createBulkResources,
);
marketplaceRouter.get(
  "/provider/properties/:propertyId/parking-resources",
  providerOrManager,
  validate(schema.propertyResourceParamsSchema),
  controller.listResources,
);
marketplaceRouter.get(
  "/provider/properties/:propertyId/reports",
  providerOrManager,
  validate(schema.propertyResourceParamsSchema),
  controller.getPropertyReports,
);
marketplaceRouter.get(
  "/provider/parking-resources/:resourceId",
  providerOrManager,
  validate(schema.resourceParamsSchema),
  controller.getResource,
);
marketplaceRouter.patch(
  "/provider/parking-resources/:resourceId",
  providerOrManager,
  validate(schema.updateResourceSchema),
  controller.updateResource,
);
marketplaceRouter.delete(
  "/provider/parking-resources/:resourceId",
  providerOrManager,
  validate(schema.resourceParamsSchema),
  controller.deleteResource,
);

/**
 * @openapi
 * /api/v1/provider/parking-resources/{resourceId}/rights/claims:
 *   post: { tags: [Parking Rights], summary: Submit a parking-right claim, security: [{ accessCookie: [] }], responses: { 201: { description: Claim submitted. } } }
 * /api/v1/provider/parking-rights:
 *   get: { tags: [Parking Rights], summary: List accessible parking rights, security: [{ accessCookie: [] }], responses: { 200: { description: Parking-right list. } } }
 * /api/v1/admin/parking-rights/pending:
 *   get: { tags: [Parking Rights], summary: List pending rights for Admin verification, security: [{ accessCookie: [] }], responses: { 200: { description: Pending claims. } } }
 * /api/v1/admin/parking-rights:
 *   get: { tags: [Parking Rights], summary: Search all parking rights for Admin operations, security: [{ accessCookie: [] }], responses: { 200: { description: Paginated parking rights. } } }
 * /api/v1/admin/parking-rights/{rightId}/verification:
 *   patch: { tags: [Parking Rights], summary: Verify, reject, dispute, or revoke a right, security: [{ accessCookie: [] }], responses: { 200: { description: Right updated. } } }
 */
marketplaceRouter.post(
  "/provider/parking-resources/:resourceId/rights/claims",
  providerOrManager,
  validate(schema.claimRightSchema),
  controller.claimRight,
);
marketplaceRouter.post(
  "/provider/properties/:propertyId/parking-right-claim-batches",
  providerOrManager,
  validate(schema.createRightClaimBatchSchema),
  controller.createRightClaimBatch,
);
marketplaceRouter.get(
  "/provider/parking-right-claim-batches",
  providerOrManager,
  controller.listProviderRightClaimBatches,
);
marketplaceRouter.get(
  "/provider/parking-rights",
  providerOrManager,
  controller.listRights,
);
marketplaceRouter.get(
  "/provider/parking-rights/:rightId",
  providerOrManager,
  validate(schema.rightParamsSchema),
  controller.getRight,
);
marketplaceRouter.patch(
  "/provider/parking-rights/:rightId",
  providerOrManager,
  validate(schema.updatePendingRightSchema),
  controller.updatePendingRight,
);
marketplaceRouter.post(
  "/provider/parking-rights/:rightId/amendments",
  providerOrManager,
  validate(schema.createRightAmendmentSchema),
  controller.createRightAmendment,
);
marketplaceRouter.post(
  "/provider/parking-rights/:rightId/documents",
  providerOrManager,
  rightDocumentUpload,
  validate(schema.rightDocumentUploadByRightSchema),
  controller.uploadRightDocuments,
);
marketplaceRouter.get(
  "/provider/parking-rights/:rightId/documents",
  providerOrManager,
  validate(schema.rightParamsSchema),
  controller.listRightDocuments,
);
marketplaceRouter.get(
  "/provider/parking-rights/:rightId/amendments",
  providerOrManager,
  validate(schema.rightParamsSchema),
  controller.listRightAmendments,
);
marketplaceRouter.post(
  "/provider/parking-right-amendments/:amendmentId/cancel",
  providerOrManager,
  validate(schema.rightAmendmentParamsSchema),
  controller.cancelRightAmendment,
);
marketplaceRouter.post(
  "/provider/parking-right-amendments/:amendmentId/documents",
  providerOrManager,
  rightDocumentUpload,
  validate(schema.rightDocumentUploadByAmendmentSchema),
  controller.uploadAmendmentDocuments,
);
marketplaceRouter.get(
  "/provider/parking-right-amendments/:amendmentId/documents",
  providerOrManager,
  validate(schema.rightAmendmentParamsSchema),
  controller.listAmendmentDocuments,
);
marketplaceRouter.post(
  "/provider/parking-right-claim-batches/:batchId/documents",
  providerOrManager,
  rightDocumentUpload,
  validate(schema.rightDocumentUploadByBatchSchema),
  controller.uploadBatchDocuments,
);
marketplaceRouter.get(
  "/provider/parking-right-claim-batches/:batchId/documents",
  providerOrManager,
  validate(schema.rightClaimBatchParamsSchema),
  controller.listBatchDocuments,
);
marketplaceRouter.delete(
  "/provider/parking-right-documents/:documentId",
  providerOrManager,
  sensitiveAccountRateLimit,
  validate(schema.rightDocumentParamsSchema),
  controller.deleteRightDocument,
);
marketplaceRouter.get(
  "/parking-right-documents/:documentId/download",
  validate(schema.rightDocumentParamsSchema),
  controller.downloadRightDocument,
);
marketplaceRouter.get(
  "/admin/parking-rights",
  requireRole(UserRoleType.ADMIN),
  validate(schema.adminParkingRightQuerySchema),
  controller.listAdminParkingRights,
);
marketplaceRouter.get(
  "/admin/parking-rights/pending",
  requireRole(UserRoleType.ADMIN),
  controller.listPendingRights,
);
marketplaceRouter.patch(
  "/admin/parking-rights/:rightId/verification",
  requireRole(UserRoleType.ADMIN),
  validate(schema.verifyRightSchema),
  controller.verifyRight,
);
marketplaceRouter.get(
  "/admin/parking-right-amendments",
  requireRole(UserRoleType.ADMIN),
  validate(schema.adminRightAmendmentQuerySchema),
  controller.listAdminRightAmendments,
);
marketplaceRouter.patch(
  "/admin/parking-right-amendments/:amendmentId",
  requireRole(UserRoleType.ADMIN),
  sensitiveAccountRateLimit,
  validate(schema.reviewRightAmendmentSchema),
  controller.reviewRightAmendment,
);
marketplaceRouter.get(
  "/admin/parking-right-claim-batches",
  requireRole(UserRoleType.ADMIN),
  validate(schema.rightClaimBatchQuerySchema),
  controller.listAdminRightClaimBatches,
);
marketplaceRouter.patch(
  "/admin/parking-right-claim-batches/:batchId",
  requireRole(UserRoleType.ADMIN),
  sensitiveAccountRateLimit,
  validate(schema.reviewRightClaimBatchSchema),
  controller.reviewRightClaimBatch,
);

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
marketplaceRouter.post(
  "/provider/listings",
  providerOrManager,
  validate(schema.createListingSchema),
  controller.createListing,
);
marketplaceRouter.get(
  "/provider/listings",
  providerOrManager,
  controller.listListings,
);
marketplaceRouter.get(
  "/provider/listings/:listingId",
  providerOrManager,
  validate(schema.listingParamsSchema),
  controller.getListing,
);
marketplaceRouter.post(
  "/provider/listings/:listingId/vehicle-rates",
  providerOrManager,
  validate(schema.vehicleListingRatesSchema),
  controller.updateVehicleListingRates,
);
marketplaceRouter.patch(
  "/provider/listings/:listingId",
  providerOrManager,
  validate(schema.updateListingSchema),
  controller.updateListing,
);
marketplaceRouter.post(
  "/provider/listings/:listingId/activate",
  providerOrManager,
  validate(schema.listingParamsSchema),
  controller.activateListing,
);
marketplaceRouter.post(
  "/provider/listings/:listingId/pause",
  providerOrManager,
  validate(schema.listingParamsSchema),
  controller.pauseListing,
);
marketplaceRouter.delete(
  "/provider/listings/:listingId",
  providerOrManager,
  validate(schema.listingParamsSchema),
  controller.endListing,
);
/**
 * @openapi
 * /api/v1/admin/listings/{listingId}/suspend:
 *   post: { tags: [Parking Listings], summary: Suspend a marketplace listing with an audited reason, security: [{ accessCookie: [] }], responses: { 200: { description: Listing suspended. } } }
 */
marketplaceRouter.get(
  "/admin/listings",
  requireRole(UserRoleType.ADMIN),
  validate(schema.adminListingQuerySchema),
  controller.listAdminListings,
);
marketplaceRouter.get(
  "/admin/listings/:listingId",
  requireRole(UserRoleType.ADMIN),
  validate(schema.listingParamsSchema),
  controller.getAdminListing,
);
marketplaceRouter.post(
  "/admin/listings/:listingId/suspend",
  requireRole(UserRoleType.ADMIN),
  validate(schema.adminListingSuspensionSchema),
  controller.suspendListing,
);
marketplaceRouter.post(
  "/admin/listings/:listingId/resume",
  requireRole(UserRoleType.ADMIN),
  validate(schema.adminListingSuspensionSchema),
  controller.resumeListing,
);
marketplaceRouter.post(
  "/listings/:listingId/reports",
  validate(schema.listingReportSchema),
  controller.reportListing,
);

/**
 * @openapi
 * /api/v1/provider/parking-resources/{resourceId}/availability:
 *   get: { tags: [Availability], summary: Get weekly rules and exceptions, security: [{ accessCookie: [] }], responses: { 200: { description: Asia/Dhaka availability configuration. } } }
 *   put: { tags: [Availability], summary: Atomically replace weekly schedule, security: [{ accessCookie: [] }], responses: { 200: { description: Schedule replaced. } } }
 * /api/v1/provider/parking-resources/{resourceId}/availability/exceptions:
 *   post: { tags: [Availability], summary: Add date-specific availability override, security: [{ accessCookie: [] }], responses: { 201: { description: Exception created. } } }
 */
marketplaceRouter.get(
  "/provider/parking-resources/:resourceId/availability",
  providerOrManager,
  validate(schema.resourceParamsSchema),
  controller.listAvailability,
);
marketplaceRouter.put(
  "/provider/parking-resources/:resourceId/availability",
  providerOrManager,
  validate(schema.replaceAvailabilitySchema),
  controller.replaceAvailability,
);
marketplaceRouter.post(
  "/provider/parking-resources/:resourceId/availability/exceptions",
  providerOrManager,
  validate(schema.createAvailabilityExceptionSchema),
  controller.createAvailabilityException,
);
marketplaceRouter.patch(
  "/provider/availability/exceptions/:exceptionId",
  providerOrManager,
  validate(schema.updateAvailabilityExceptionSchema),
  controller.updateAvailabilityException,
);
marketplaceRouter.delete(
  "/provider/availability/exceptions/:exceptionId",
  providerOrManager,
  validate(schema.availabilityExceptionParamsSchema),
  controller.deleteAvailabilityException,
);

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
marketplaceRouter.post(
  "/parking/quotes",
  requireRole(UserRoleType.DRIVER),
  validate(schema.createQuoteSchema),
  controller.createQuote,
);
marketplaceRouter.get(
  "/parking/quotes/:quoteId",
  requireRole(UserRoleType.DRIVER),
  validate(schema.quoteParamsSchema),
  controller.getQuote,
);
marketplaceRouter.post(
  "/parking/holds",
  requireRole(UserRoleType.DRIVER),
  validate(schema.createHoldSchema),
  controller.createHold,
);
marketplaceRouter.get(
  "/parking/holds/:holdId",
  requireRole(UserRoleType.DRIVER),
  validate(schema.holdParamsSchema),
  controller.getHold,
);
marketplaceRouter.delete(
  "/parking/holds/:holdId",
  requireRole(UserRoleType.DRIVER),
  validate(schema.holdParamsSchema),
  controller.releaseHold,
);
marketplaceRouter.post(
  "/bookings",
  requireRole(UserRoleType.DRIVER),
  validate(schema.createBookingSchema),
  controller.createBooking,
);
marketplaceRouter.get(
  "/bookings",
  requireRole(UserRoleType.DRIVER),
  controller.listDriverBookings,
);
marketplaceRouter.get(
  "/bookings/:bookingId",
  requireRole(UserRoleType.DRIVER),
  validate(schema.bookingParamsSchema),
  controller.getDriverBooking,
);
marketplaceRouter.get(
  "/bookings/:bookingId/cancellation-preview",
  requireRole(UserRoleType.DRIVER),
  validate(schema.bookingParamsSchema),
  controller.previewBookingCancellation,
);
marketplaceRouter.post(
  "/bookings/:bookingId/cancel",
  requireRole(UserRoleType.DRIVER),
  validate(schema.cancelBookingSchema),
  controller.cancelBooking,
);
marketplaceRouter.post(
  "/bookings/:bookingId/checkout-request",
  requireRole(UserRoleType.DRIVER),
  validate(schema.bookingParamsSchema),
  controller.requestCheckout,
);
marketplaceRouter.get(
  "/bookings/:bookingId/settlement",
  requireRole(UserRoleType.DRIVER),
  validate(schema.bookingParamsSchema),
  controller.getDriverBookingSettlement,
);
marketplaceRouter.get(
  "/provider/bookings",
  providerOrManager,
  controller.listProviderBookings,
);
marketplaceRouter.get(
  "/provider/bookings/:bookingId",
  providerOrManager,
  validate(schema.bookingParamsSchema),
  controller.getProviderBooking,
);
marketplaceRouter.get(
  "/provider/bookings/:bookingId/settlement",
  providerOrManager,
  validate(schema.bookingParamsSchema),
  controller.getProviderBookingSettlement,
);

/**
 * @openapi
 * /api/v1/payments/simulated/capture:
 *   post: { tags: [Payments], summary: Capture semester-MVP simulated payment, description: Does not claim a real bank or MFS transfer., security: [{ accessCookie: [] }], responses: { 201: { description: Payment, balanced ledger, confirmation, and one-time access token created. } } }
 * /api/v1/guard/access/verify:
 *   post: { tags: [Guard Booking Operations], summary: Verify access credential within Guard scope, security: [{ accessCookie: [] }], responses: { 200: { description: Credential and booking details verified. } } }
 */
marketplaceRouter.post(
  "/payments/simulated/capture",
  requireRole(UserRoleType.DRIVER),
  sensitiveAccountRateLimit,
  validate(schema.capturePaymentSchema),
  controller.capturePayment,
);
marketplaceRouter.post(
  "/guard/access/verify",
  requireRole(UserRoleType.GUARD),
  validate(schema.verifyCredentialSchema),
  controller.verifyCredential,
);
marketplaceRouter.get(
  "/guard/bookings",
  requireRole(UserRoleType.GUARD),
  validate(schema.guardBookingQuerySchema),
  controller.listGuardBookings,
);
marketplaceRouter.get(
  "/guard/bookings/:bookingId",
  requireRole(UserRoleType.GUARD),
  validate(schema.bookingParamsSchema),
  controller.getGuardBooking,
);
marketplaceRouter.post(
  "/guard/bookings/:bookingId/check-in",
  requireRole(UserRoleType.GUARD),
  validate(schema.bookingParamsSchema.merge(schema.verifyCredentialSchema)),
  controller.checkIn,
);
marketplaceRouter.post(
  "/guard/bookings/:bookingId/check-out",
  requireRole(UserRoleType.GUARD),
  validate(schema.bookingParamsSchema.merge(schema.checkoutCredentialSchema)),
  controller.checkOut,
);

/**
 * @openapi
 * /api/v1/wallet:
 *   get: { tags: [Wallet], summary: Get authenticated user's BDT wallet, security: [{ accessCookie: [] }], responses: { 200: { description: Wallet balances. } } }
 * /api/v1/provider/earnings/summary:
 *   get: { tags: [Wallet], summary: Get Provider earnings or delegated earnings view, security: [{ accessCookie: [] }], responses: { 200: { description: Aggregate earnings. } } }
 */
marketplaceRouter.get("/wallet", controller.getWallet);
marketplaceRouter.get(
  "/wallet/transactions",
  controller.listWalletTransactions,
);
marketplaceRouter.get(
  "/provider/earnings/summary",
  providerOrManager,
  controller.earningsSummary,
);
marketplaceRouter.get(
  "/provider/earnings/transactions",
  providerOrManager,
  controller.listEarningsTransactions,
);
marketplaceRouter.get(
  "/provider/payout-methods",
  requireRole(UserRoleType.PROVIDER),
  controller.listPayoutMethods,
);
marketplaceRouter.post(
  "/provider/payout-methods",
  requireRole(UserRoleType.PROVIDER),
  sensitiveAccountRateLimit,
  validate(schema.payoutMethodSchema),
  controller.createPayoutMethod,
);
marketplaceRouter.post(
  "/provider/payout-methods/:payoutMethodId/default",
  requireRole(UserRoleType.PROVIDER),
  sensitiveAccountRateLimit,
  validate(schema.payoutMethodParamsSchema),
  controller.setDefaultPayoutMethod,
);
marketplaceRouter.post(
  "/provider/payout-methods/:payoutMethodId/deactivate",
  requireRole(UserRoleType.PROVIDER),
  sensitiveAccountRateLimit,
  validate(schema.payoutMethodParamsSchema),
  controller.deactivatePayoutMethod,
);
marketplaceRouter.get(
  "/admin/payout-methods/pending",
  requireRole(UserRoleType.ADMIN),
  controller.listPendingPayoutMethods,
);
marketplaceRouter.post(
  "/admin/payout-methods/:payoutMethodId/review",
  requireRole(UserRoleType.ADMIN),
  validate(schema.adminPayoutMethodReviewSchema),
  controller.reviewPayoutMethod,
);
marketplaceRouter.post(
  "/payments/:paymentId/refunds",
  requireRole(UserRoleType.ADMIN),
  sensitiveAccountRateLimit,
  validate(schema.refundSchema),
  controller.createRefund,
);
marketplaceRouter.get(
  "/refunds",
  requireRole(UserRoleType.DRIVER),
  validate(schema.driverRefundQuerySchema),
  controller.listDriverRefunds,
);
marketplaceRouter.get(
  "/refunds/:refundId",
  requireRole(UserRoleType.DRIVER),
  validate(schema.refundParamsSchema),
  controller.getDriverRefund,
);
marketplaceRouter.post(
  "/provider/payouts",
  requireRole(UserRoleType.PROVIDER),
  sensitiveAccountRateLimit,
  validate(schema.payoutSchema),
  controller.createPayout,
);
marketplaceRouter.get(
  "/provider/payouts",
  requireRole(UserRoleType.PROVIDER),
  validate(schema.providerPayoutQuerySchema),
  controller.listProviderPayouts,
);
marketplaceRouter.get(
  "/provider/payouts/:payoutId",
  requireRole(UserRoleType.PROVIDER),
  validate(schema.payoutParamsSchema),
  controller.getProviderPayout,
);
marketplaceRouter.get(
  "/driver/payout-methods",
  requireRole(UserRoleType.DRIVER),
  controller.listPayoutMethods,
);
marketplaceRouter.post(
  "/driver/payout-methods",
  requireRole(UserRoleType.DRIVER),
  sensitiveAccountRateLimit,
  validate(schema.payoutMethodSchema),
  controller.createPayoutMethod,
);
marketplaceRouter.post(
  "/driver/payout-methods/:payoutMethodId/default",
  requireRole(UserRoleType.DRIVER),
  sensitiveAccountRateLimit,
  validate(schema.payoutMethodParamsSchema),
  controller.setDefaultPayoutMethod,
);
marketplaceRouter.post(
  "/driver/payout-methods/:payoutMethodId/deactivate",
  requireRole(UserRoleType.DRIVER),
  sensitiveAccountRateLimit,
  validate(schema.payoutMethodParamsSchema),
  controller.deactivatePayoutMethod,
);
marketplaceRouter.post(
  "/driver/payouts",
  requireRole(UserRoleType.DRIVER),
  sensitiveAccountRateLimit,
  validate(schema.payoutSchema),
  controller.createPayout,
);
marketplaceRouter.get(
  "/driver/payouts",
  requireRole(UserRoleType.DRIVER),
  validate(schema.providerPayoutQuerySchema),
  controller.listProviderPayouts,
);
marketplaceRouter.get(
  "/driver/payouts/:payoutId",
  requireRole(UserRoleType.DRIVER),
  validate(schema.payoutParamsSchema),
  controller.getProviderPayout,
);
/**
 * @openapi
 * /api/v1/admin/payouts:
 *   get: { tags: [Wallet], summary: List payout requests for manual review, security: [{ accessCookie: [] }], responses: { 200: { description: Payout review queue. } } }
 * /api/v1/admin/payouts/{payoutId}:
 *   patch: { tags: [Wallet], summary: Approve, reject, or record an approved manual payout as paid, security: [{ accessCookie: [] }], responses: { 200: { description: Payout and wallet reservation updated atomically. } } }
 */
marketplaceRouter.get(
  "/admin/payouts",
  requireRole(UserRoleType.ADMIN),
  validate(schema.adminPayoutQuerySchema),
  controller.listPayouts,
);
marketplaceRouter.patch(
  "/admin/payouts/:payoutId",
  requireRole(UserRoleType.ADMIN),
  sensitiveAccountRateLimit,
  validate(schema.adminPayoutReviewSchema),
  controller.reviewPayout,
);

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
marketplaceRouter.patch(
  "/notifications/:notificationId/read",
  validate(schema.notificationParamsSchema),
  controller.readNotification,
);
marketplaceRouter.post(
  "/notifications/read-all",
  controller.readAllNotifications,
);
marketplaceRouter.post(
  "/bookings/:bookingId/reviews",
  requireRole(UserRoleType.DRIVER),
  validate(schema.createReviewSchema),
  controller.createReview,
);
marketplaceRouter.get(
  "/reviews",
  requireRole(UserRoleType.DRIVER),
  controller.listDriverReviews,
);
marketplaceRouter.get(
  "/provider/reviews",
  providerOrManager,
  controller.listProviderReviews,
);
marketplaceRouter.post(
  "/provider/reviews/:reviewId/reply",
  providerOrManager,
  validate(schema.replyReviewSchema),
  controller.replyReview,
);
marketplaceRouter.post(
  "/bookings/:bookingId/disputes",
  requireRole(UserRoleType.DRIVER, UserRoleType.PROVIDER),
  validate(schema.createDisputeSchema),
  controller.createDispute,
);
marketplaceRouter.get(
  "/disputes",
  requireRole(UserRoleType.DRIVER),
  validate(schema.disputeListQuerySchema),
  controller.listDriverDisputes,
);
marketplaceRouter.get(
  "/disputes/:disputeId",
  requireRole(UserRoleType.DRIVER),
  validate(schema.disputeParamsSchema),
  controller.getDriverDispute,
);
marketplaceRouter.get(
  "/provider/disputes",
  providerOrManager,
  validate(schema.disputeListQuerySchema),
  controller.listProviderDisputes,
);
marketplaceRouter.get(
  "/provider/disputes/:disputeId",
  providerOrManager,
  validate(schema.disputeParamsSchema),
  controller.getProviderDispute,
);
/**
 * @openapi
 * /api/v1/admin/disputes:
 *   get: { tags: [Disputes], summary: List booking disputes for Admin review, security: [{ accessCookie: [] }], responses: { 200: { description: Dispute queue. } } }
 * /api/v1/admin/disputes/{disputeId}:
 *   patch: { tags: [Disputes], summary: Resolve or reject a booking dispute, security: [{ accessCookie: [] }], responses: { 200: { description: Dispute resolved and user notified. } } }
 */
marketplaceRouter.get(
  "/admin/disputes",
  requireRole(UserRoleType.ADMIN),
  validate(schema.adminDisputeQuerySchema),
  controller.listDisputes,
);
marketplaceRouter.patch(
  "/admin/disputes/:disputeId",
  requireRole(UserRoleType.ADMIN),
  sensitiveAccountRateLimit,
  validate(schema.resolveDisputeSchema),
  controller.resolveDispute,
);

/**
 * @openapi
 * /api/v1/parking/properties/{propertyId}:
 *   get: { tags: [Parking Marketplace], summary: Get a public-safe Property and available offers for a requested period, responses: { 200: { description: Public Property detail. }, 404: { description: Property unavailable. } } }
 * /api/v1/guard/bookings:
 *   get: { tags: [Guard Booking Operations], summary: List active bookings in the authenticated Guard assignment scope, security: [{ accessCookie: [] }], responses: { 200: { description: Paginated Guard booking operations. } } }
 * /api/v1/guard/bookings/{bookingId}:
 *   get: { tags: [Guard Booking Operations], summary: Get a booking in Guard scope without financial fields, security: [{ accessCookie: [] }], responses: { 200: { description: Guard-safe booking detail. }, 404: { description: Booking not found in Guard scope. } } }
 * /api/v1/provider/payouts:
 *   get: { tags: [Wallet], summary: List authenticated Provider payout requests, security: [{ accessCookie: [] }], responses: { 200: { description: Paginated Provider payout history. } } }
 * /api/v1/provider/payouts/{payoutId}:
 *   get: { tags: [Wallet], summary: Get one authenticated Provider payout request, security: [{ accessCookie: [] }], responses: { 200: { description: Provider payout detail. }, 404: { description: Payout not found in Provider scope. } } }
 * /api/v1/refunds:
 *   get: { tags: [Payments], summary: List refunds linked to authenticated Driver payments, security: [{ accessCookie: [] }], responses: { 200: { description: Paginated Driver refund history. } } }
 * /api/v1/refunds/{refundId}:
 *   get: { tags: [Payments], summary: Get a refund linked to an authenticated Driver payment, security: [{ accessCookie: [] }], responses: { 200: { description: Driver refund detail. }, 404: { description: Refund not found in Driver scope. } } }
 * /api/v1/disputes:
 *   get: { tags: [Disputes], summary: List authenticated Driver disputes, security: [{ accessCookie: [] }], responses: { 200: { description: Paginated Driver disputes. } } }
 * /api/v1/disputes/{disputeId}:
 *   get: { tags: [Disputes], summary: Get one authenticated Driver dispute, security: [{ accessCookie: [] }], responses: { 200: { description: Driver dispute detail. }, 404: { description: Dispute not found in Driver scope. } } }
 * /api/v1/provider/disputes:
 *   get: { tags: [Disputes], summary: List disputes in Provider or delegated Manager booking scope, security: [{ accessCookie: [] }], responses: { 200: { description: Paginated Provider disputes. } } }
 * /api/v1/provider/disputes/{disputeId}:
 *   get: { tags: [Disputes], summary: Get a dispute in Provider or delegated Manager booking scope, security: [{ accessCookie: [] }], responses: { 200: { description: Provider dispute detail. }, 404: { description: Dispute not found in Provider scope. } } }
 * /api/v1/admin/listings:
 *   get: { tags: [Parking Listings], summary: List marketplace listings for Admin review, security: [{ accessCookie: [] }], responses: { 200: { description: Paginated listing review queue. } } }
 * /api/v1/admin/listings/{listingId}:
 *   get: { tags: [Parking Listings], summary: Get full Admin listing review detail, security: [{ accessCookie: [] }], responses: { 200: { description: Listing review detail. }, 404: { description: Listing not found. } } }
 * /api/v1/provider/availability/exceptions/{exceptionId}:
 *   patch: { tags: [Availability], summary: Update an availability exception within Provider or Manager scope, security: [{ accessCookie: [] }], responses: { 200: { description: Exception updated. }, 409: { description: Overlapping exception or booking conflict. } } }
 *   delete: { tags: [Availability], summary: Delete an availability exception within Provider or Manager scope, security: [{ accessCookie: [] }], responses: { 200: { description: Exception deleted. } } }
 */

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
 * /api/v1/provider/bookings/{bookingId}:
 *   get: { tags: [Booking], summary: Get one Provider or delegated Manager booking within scope, security: [{ accessCookie: [] }], responses: { 200: { description: Scoped booking detail. }, 404: { description: Booking absent or outside the caller scope. } } }
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
