import { z } from "zod";

const uuid = z.uuid();
const isoDate = z.iso.datetime({ offset: true });
const vehicleType = z.enum(["MOTORCYCLE", "SEDAN", "SUV", "MICROBUS"]);
const positivePaisa = z.coerce.bigint().positive();
const idempotencyKey = z.string().trim().min(8).max(100);
const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

export const propertyResourceParamsSchema = z.object({
  params: z.object({ propertyId: uuid }),
});

export const resourceParamsSchema = z.object({
  params: z.object({ resourceId: uuid }),
});

export const rightParamsSchema = z.object({
  params: z.object({ rightId: uuid }),
});

export const listingParamsSchema = z.object({
  params: z.object({ listingId: uuid }),
});

export const createResourceSchema = z.object({
  params: z.object({ propertyId: uuid }),
  body: z.object({
    type: z.enum(["FIXED_SPACE", "SHARED_POOL"]),
    displayName: z.string().trim().min(2).max(120),
    spotCode: z.string().trim().min(1).max(30).optional(),
    floor: z.string().trim().max(40).optional(),
    zone: z.string().trim().max(60).optional(),
    capacity: z.number().int().min(1).max(1000).default(1),
    supportedVehicleTypes: z.array(vehicleType).min(1).max(4),
    isCovered: z.boolean().default(false),
    hasCctv: z.boolean().default(false),
    hasGuard: z.boolean().default(false),
    maxHeightCm: z.number().int().min(100).max(1000).optional(),
    maxWidthCm: z.number().int().min(100).max(1000).optional(),
    maxLengthCm: z.number().int().min(100).max(3000).optional(),
  }).strict().superRefine((value, context) => {
    if (value.type === "FIXED_SPACE" && !value.spotCode) {
      context.addIssue({ code: "custom", path: ["spotCode"], message: "spotCode is required for a fixed space" });
    }
    if (value.type === "FIXED_SPACE" && value.capacity !== 1) {
      context.addIssue({ code: "custom", path: ["capacity"], message: "Fixed-space capacity must be 1" });
    }
    if (value.type === "SHARED_POOL" && value.spotCode) {
      context.addIssue({ code: "custom", path: ["spotCode"], message: "Shared pools must not use a fixed spot code" });
    }
  }),
});

export const createBulkResourcesSchema = z.object({
  params: z.object({ propertyId: uuid }),
  body: z.union([z.object({
    resource: z.object({
      type: z.literal("FIXED_SPACE"),
      displayName: z.string().trim().min(2).max(120),
      floor: z.string().trim().max(40).optional(),
      zone: z.string().trim().max(60).optional(),
      supportedVehicleTypes: z.array(vehicleType).min(1).max(4),
      isCovered: z.boolean().default(false),
      hasCctv: z.boolean().default(false),
      hasGuard: z.boolean().default(false),
      maxHeightCm: z.number().int().min(100).max(1000).optional(),
      maxWidthCm: z.number().int().min(100).max(1000).optional(),
      maxLengthCm: z.number().int().min(100).max(3000).optional(),
    }).strict(),
    units: z.array(z.object({
      displayName: z.string().trim().min(2).max(120).optional(),
      spotCode: z.string().trim().min(1).max(30),
    }).strict()).min(1).max(100),
  }).strict(), z.object({
    spaces: z.array(z.object({
      displayName: z.string().trim().min(2).max(120),
      spotCode: z.string().trim().min(1).max(30),
    }).strict()).min(1).max(100),
    sharedDefaults: z.object({
      floor: z.string().trim().max(40).optional(),
      zone: z.string().trim().max(60).optional(),
      supportedVehicleTypes: z.array(vehicleType).min(1).max(4),
      isCovered: z.boolean().default(false),
      hasCctv: z.boolean().default(false),
      hasGuard: z.boolean().default(false),
      maxHeightCm: z.number().int().min(100).max(1000).optional(),
      maxWidthCm: z.number().int().min(100).max(1000).optional(),
      maxLengthCm: z.number().int().min(100).max(3000).optional(),
    }).strict(),
  }).strict()]),
});

export const updateResourceSchema = z.object({
  params: z.object({ resourceId: uuid }),
  body: z.object({
    displayName: z.string().trim().min(2).max(120).optional(),
    floor: z.string().trim().max(40).nullable().optional(),
    zone: z.string().trim().max(60).nullable().optional(),
    capacity: z.number().int().min(1).max(1000).optional(),
    supportedVehicleTypes: z.array(vehicleType).min(1).max(4).optional(),
    status: z.enum(["ACTIVE", "BLOCKED", "MAINTENANCE", "INACTIVE"]).optional(),
    isCovered: z.boolean().optional(),
    hasCctv: z.boolean().optional(),
    hasGuard: z.boolean().optional(),
    maxHeightCm: z.number().int().min(100).max(1000).nullable().optional(),
    maxWidthCm: z.number().int().min(100).max(1000).nullable().optional(),
    maxLengthCm: z.number().int().min(100).max(3000).nullable().optional(),
  }).strict().refine((value) => Object.keys(value).length > 0, "At least one field is required"),
});

export const claimRightSchema = z.object({
  params: z.object({ resourceId: uuid }),
  body: z.object({
    rightType: z.enum(["OWNERSHIP", "USE_ONLY", "COMMERCIAL_LEASE", "AUTHORIZED_OPERATION"]),
    quantity: z.number().int().min(1).max(1000).default(1),
    canUse: z.boolean().default(true),
    canList: z.boolean().default(false),
    canSetPrice: z.boolean().default(false),
    canManageBookings: z.boolean().default(false),
    canDelegateManager: z.boolean().default(false),
    validFrom: isoDate.optional(),
    validUntil: isoDate.optional(),
  }).strict().superRefine((value, context) => {
    if (value.rightType === "USE_ONLY" && (value.canList || value.canSetPrice || value.canManageBookings)) {
      context.addIssue({ code: "custom", path: ["canList"], message: "USE_ONLY rights cannot grant commercial permissions" });
    }
    if (value.validFrom && value.validUntil && new Date(value.validUntil) <= new Date(value.validFrom)) {
      context.addIssue({ code: "custom", path: ["validUntil"], message: "validUntil must be later than validFrom" });
    }
  }),
});

export const createRightClaimBatchSchema = z.object({
  params: z.object({ propertyId: uuid }).strict(),
  body: z.object({
    resourceIds: z.array(uuid).min(2).max(100).refine((values) => new Set(values).size === values.length, "Resource IDs must be unique"),
    rightType: z.enum(["OWNERSHIP", "USE_ONLY", "COMMERCIAL_LEASE", "AUTHORIZED_OPERATION"]),
    quantity: z.number().int().min(1).max(1000).default(1),
    canUse: z.boolean().default(true), canList: z.boolean().default(false), canSetPrice: z.boolean().default(false),
    canManageBookings: z.boolean().default(false), canDelegateManager: z.boolean().default(false),
    validFrom: isoDate.optional(), validUntil: isoDate.optional(),
  }).strict().superRefine((value, context) => {
    if (value.validFrom && value.validUntil && new Date(value.validUntil) <= new Date(value.validFrom)) context.addIssue({ code: "custom", path: ["validUntil"], message: "validUntil must be later than validFrom" });
    if (value.rightType === "USE_ONLY" && (value.canList || value.canSetPrice || value.canManageBookings)) context.addIssue({ code: "custom", path: ["canList"], message: "USE_ONLY cannot grant commercial permissions" });
  }),
});

export const rightClaimBatchQuerySchema = z.object({ query: z.object({ ...pagination, status: z.enum(["PENDING", "COMPLETED", "PARTIALLY_RESOLVED", "CANCELLED"]).optional() }).strict() });
export const rightClaimBatchParamsSchema = z.object({ params: z.object({ batchId: uuid }).strict() });
export const reviewRightClaimBatchSchema = z.object({
  params: z.object({ batchId: uuid }).strict(),
  body: z.object({ decision: z.enum(["VERIFIED", "REJECTED"]), reason: z.string().trim().min(10).max(500).optional(), rights: z.array(z.object({ rightId: uuid, expectedVersion: z.number().int().positive() }).strict()).min(1).max(100).refine((rights) => new Set(rights.map((right) => right.rightId)).size === rights.length, "Each claim may appear only once") }).strict().superRefine((value, context) => {
    if (value.decision === "REJECTED" && !value.reason) context.addIssue({ code: "custom", path: ["reason"], message: "Rejection reason is required" });
  }),
});

const rightDocumentCategory = z.enum(["OWNERSHIP_DOCUMENT", "LEASE_AGREEMENT", "OWNER_CONSENT", "AUTHORIZATION_LETTER", "PARKING_ALLOCATION", "OTHER"]);
export const rightDocumentUploadByRightSchema = z.object({ params: z.object({ rightId: uuid }).strict(), body: z.object({ category: rightDocumentCategory }).strict() });
export const rightDocumentUploadByAmendmentSchema = z.object({ params: z.object({ amendmentId: uuid }).strict(), body: z.object({ category: rightDocumentCategory }).strict() });
export const rightDocumentUploadByBatchSchema = z.object({ params: z.object({ batchId: uuid }).strict(), body: z.object({ category: rightDocumentCategory }).strict() });
export const rightDocumentParamsSchema = z.object({ params: z.object({ documentId: uuid }).strict() });

export const updatePendingRightSchema = z.object({
  params: z.object({ rightId: uuid }),
  body: z.object({
    rightType: z.enum(["OWNERSHIP", "USE_ONLY", "COMMERCIAL_LEASE", "AUTHORIZED_OPERATION"]).optional(),
    quantity: z.number().int().min(1).max(1000).optional(),
    canUse: z.boolean().optional(),
    canList: z.boolean().optional(),
    canSetPrice: z.boolean().optional(),
    canManageBookings: z.boolean().optional(),
    canDelegateManager: z.boolean().optional(),
    validFrom: isoDate.optional(),
    validUntil: isoDate.nullable().optional(),
    expectedVersion: z.number().int().positive(),
  }).strict().superRefine((value, context) => {
    if (!Object.keys(value).some((key) => key !== "expectedVersion")) {
      context.addIssue({ code: "custom", message: "At least one claim field is required" });
    }
    if (value.rightType === "USE_ONLY" && (value.canList || value.canSetPrice || value.canManageBookings)) {
      context.addIssue({ code: "custom", path: ["canList"], message: "USE_ONLY rights cannot grant commercial permissions" });
    }
    if (value.validFrom && value.validUntil && new Date(value.validUntil) <= new Date(value.validFrom)) {
      context.addIssue({ code: "custom", path: ["validUntil"], message: "validUntil must be later than validFrom" });
    }
  }),
});

export const verifyRightSchema = z.object({
  params: z.object({ rightId: uuid }),
  body: z.object({
    decision: z.enum(["VERIFIED", "REJECTED", "DISPUTED", "REVOKED"]),
    reason: z.string().trim().min(5).max(500).optional(),
    expectedVersion: z.number().int().positive(),
  }).strict().superRefine((value, context) => {
    if (value.decision !== "VERIFIED" && !value.reason) {
      context.addIssue({ code: "custom", path: ["reason"], message: "A reason is required for this decision" });
    }
  }),
});

const listingBodySchema = z.object({
    parkingRightId: uuid,
    parkingResourceUnitId: uuid.optional(),
    title: z.string().trim().min(3).max(150),
    description: z.string().trim().max(3000).optional(),
    pricePerHourPaisa: positivePaisa,
    minDurationMinutes: z.number().int().min(15).max(1440).default(60),
    maxDurationMinutes: z.number().int().min(15).max(10080).default(720),
    allowedVehicleTypes: z.array(vehicleType).min(1).max(4),
    securityDepositPaisa: z.coerce.bigint().min(0n).default(0n),
    overtimeBillingMode: z.enum(["MULTIPLIER", "FIXED_PER_HOUR"]).default("MULTIPLIER"),
    overtimeMultiplierBps: z.number().int().min(10_000).max(50_000).nullable().optional(),
    overtimeRatePerHourPaisa: z.coerce.bigint().min(100n).max(10_000_000n).nullable().optional(),
    overtimeGracePeriodMinutes: z.number().int().min(0).max(180).default(15),
  }).strict().superRefine((value, context) => {
    if (value.overtimeBillingMode === "MULTIPLIER" && value.overtimeMultiplierBps === null) {
      context.addIssue({ code: "custom", path: ["overtimeMultiplierBps"], message: "Multiplier is required" });
    }
    if (value.overtimeBillingMode === "FIXED_PER_HOUR" && (value.overtimeRatePerHourPaisa === undefined || value.overtimeRatePerHourPaisa === null)) {
      context.addIssue({ code: "custom", path: ["overtimeRatePerHourPaisa"], message: "Fixed overtime rate is required" });
    }
  });

export const createListingSchema = z.object({
  body: listingBodySchema.refine((value) => value.maxDurationMinutes >= value.minDurationMinutes, {
    path: ["maxDurationMinutes"], message: "Maximum duration must be at least the minimum duration",
  }),
});

export const updateListingSchema = z.object({
  params: z.object({ listingId: uuid }),
  body: listingBodySchema.omit({ parkingRightId: true, parkingResourceUnitId: true }).partial()
    .refine((value) => Object.keys(value).length > 0, "At least one field is required")
    .refine(
      (value) => value.minDurationMinutes === undefined
        || value.maxDurationMinutes === undefined
        || value.maxDurationMinutes >= value.minDurationMinutes,
      { path: ["maxDurationMinutes"], message: "Maximum duration must be at least the minimum duration" },
    ),
});

const availabilityRule = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startLocalTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endLocalTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  validFrom: z.iso.date(),
  validUntil: z.iso.date().optional(),
}).refine((value) => value.endLocalTime > value.startLocalTime, {
  path: ["endLocalTime"], message: "End time must be later than start time",
});

export const replaceAvailabilitySchema = z.object({
  params: z.object({ resourceId: uuid }),
  body: z.object({ rules: z.array(availabilityRule).max(50) }).strict(),
});

export const createAvailabilityExceptionSchema = z.object({
  params: z.object({ resourceId: uuid }),
  body: z.object({
    startsAt: isoDate,
    endsAt: isoDate,
    exceptionType: z.enum(["BLOCKED", "SPECIAL_AVAILABLE"]),
    reason: z.string().trim().max(255).optional(),
  }).strict().refine((value) => new Date(value.endsAt) > new Date(value.startsAt), {
    path: ["endsAt"], message: "endsAt must be later than startsAt",
  }),
});

const rightAmendmentChangesSchema = z.object({
  rightType: z.enum(["OWNERSHIP", "USE_ONLY", "COMMERCIAL_LEASE", "AUTHORIZED_OPERATION"]).optional(),
  quantity: z.number().int().min(1).max(1000).optional(),
  canUse: z.boolean().optional(),
  canList: z.boolean().optional(),
  canSetPrice: z.boolean().optional(),
  canManageBookings: z.boolean().optional(),
  canDelegateManager: z.boolean().optional(),
  validFrom: isoDate.optional(),
  validUntil: isoDate.nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "At least one proposed change is required");

export const createRightAmendmentSchema = z.object({
  params: z.object({ rightId: uuid }).strict(),
  body: z.object({
    expectedVersion: z.number().int().positive(),
    proposedChanges: rightAmendmentChangesSchema,
  }).strict(),
});

export const rightAmendmentParamsSchema = z.object({
  params: z.object({ amendmentId: uuid }).strict(),
});

export const adminRightAmendmentQuerySchema = z.object({
  query: z.object({
    ...pagination,
    status: z.enum(["DRAFT", "PENDING", "APPROVED", "REJECTED", "CANCELLED"]).optional(),
  }).strict(),
});

export const reviewRightAmendmentSchema = z.object({
  params: z.object({ amendmentId: uuid }).strict(),
  body: z.object({
    decision: z.enum(["APPROVED", "REJECTED"]),
    expectedRightVersion: z.number().int().positive(),
    reason: z.string().trim().min(5).max(500).optional(),
  }).strict().superRefine((value, context) => {
    if (value.decision === "REJECTED" && !value.reason) {
      context.addIssue({ code: "custom", path: ["reason"], message: "A rejection reason is required" });
    }
  }),
});

export const adminParkingRightQuerySchema = z.object({
  query: z.object({
    ...pagination,
    status: z.enum(["PENDING_VERIFICATION", "VERIFIED", "DISPUTED", "REJECTED", "REVOKED", "EXPIRED"]).optional(),
    propertyId: uuid.optional(),
    holderUserId: uuid.optional(),
  }).strict(),
});

export const availabilityExceptionParamsSchema = z.object({
  params: z.object({ exceptionId: uuid }),
});

export const updateAvailabilityExceptionSchema = z.object({
  params: z.object({ exceptionId: uuid }),
  body: z.object({
    startsAt: isoDate.optional(),
    endsAt: isoDate.optional(),
    exceptionType: z.enum(["BLOCKED", "SPECIAL_AVAILABLE"]).optional(),
    reason: z.string().trim().max(255).nullable().optional(),
  }).strict().refine((value) => Object.keys(value).length > 0, "At least one field is required")
    .refine(
      (value) => !value.startsAt || !value.endsAt || new Date(value.endsAt) > new Date(value.startsAt),
      { path: ["endsAt"], message: "endsAt must be later than startsAt" },
    ),
});

export const searchParkingSchema = z.object({
  query: z.object({
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    radiusKm: z.coerce.number().positive().max(100).default(10),
    startAt: isoDate,
    endAt: isoDate,
    vehicleType,
    minPricePaisa: z.coerce.bigint().min(0n).optional(),
    maxPricePaisa: z.coerce.bigint().min(0n).optional(),
    covered: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
    hasCctv: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
    hasGuard: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
    resourceType: z.enum(["FIXED_SPACE", "SHARED_POOL"]).optional(),
    facilityCodes: z.string().trim().max(300).transform((value) => value.split(",").map((item) => item.trim()).filter(Boolean)).optional(),
    minAvailableUnits: z.coerce.number().int().min(1).max(100).optional(),
  }).strict().refine((value) => new Date(value.startAt) > new Date(), {
    path: ["startAt"], message: "startAt must be in the future",
  }).refine((value) => new Date(value.endAt) > new Date(value.startAt), {
    path: ["endAt"], message: "endAt must be later than startAt",
  }),
});

export const browseParkingSchema = z.object({
  query: z.object({
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
  }).strict(),
});

export const driverFavoriteParamsSchema = z.object({ params: z.object({ propertyId: uuid }) });

export const createSavedLocationSchema = z.object({
  body: z.object({
    label: z.string().trim().min(1).max(60),
    displayName: z.string().trim().min(2).max(255),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).strict(),
});

export const savedLocationParamsSchema = z.object({ params: z.object({ locationId: uuid }) });

export const updateSavedLocationSchema = z.object({
  params: z.object({ locationId: uuid }),
  body: z.object({
    label: z.string().trim().min(1).max(60).optional(),
    displayName: z.string().trim().min(2).max(255).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  }).strict().refine((value) => Object.keys(value).length > 0, "At least one field is required"),
});

export const createSearchHistorySchema = z.object({
  body: z.object({
    displayName: z.string().trim().min(2).max(255),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    radiusKm: z.number().positive().max(100),
    vehicleType,
  }).strict(),
});

export const searchHistoryParamsSchema = z.object({ params: z.object({ searchId: uuid }) });

export const publicPropertyDetailSchema = z.object({
  params: z.object({ propertyId: uuid }),
  query: z.object({
    startAt: isoDate,
    endAt: isoDate,
    vehicleType,
  }).strict().refine((value) => new Date(value.startAt) > new Date(), {
    path: ["startAt"], message: "startAt must be in the future",
  }).refine((value) => new Date(value.endAt) > new Date(value.startAt), {
    path: ["endAt"], message: "endAt must be later than startAt",
  }),
});

export const createQuoteSchema = z.object({
  body: z.object({ listingId: uuid, vehicleId: uuid, startAt: isoDate, endAt: isoDate }).strict()
    .refine((value) => new Date(value.startAt) > new Date(), {
      path: ["startAt"], message: "startAt must be in the future",
    })
    .refine((value) => new Date(value.endAt) > new Date(value.startAt), {
      path: ["endAt"], message: "endAt must be later than startAt",
    }),
});

export const quoteParamsSchema = z.object({ params: z.object({ quoteId: uuid }) });
export const holdParamsSchema = z.object({ params: z.object({ holdId: uuid }) });
export const bookingParamsSchema = z.object({ params: z.object({ bookingId: uuid }) });
export const paymentParamsSchema = z.object({ params: z.object({ paymentId: uuid }) });

export const guardBookingQuerySchema = z.object({
  query: z.object({
    ...pagination,
    status: z.enum(["CONFIRMED", "CHECKED_IN", "CHECKOUT_REQUESTED"]).optional(),
  }).strict(),
});

export const createHoldSchema = z.object({
  body: z.object({ quoteId: uuid, idempotencyKey }).strict(),
});

export const createBookingSchema = z.object({
  body: z.object({ holdId: uuid, idempotencyKey }).strict(),
});

export const capturePaymentSchema = z.object({
  body: z.object({ bookingId: uuid, idempotencyKey }).strict(),
});

export const verifyCredentialSchema = z.object({
  body: z.object({ credential: z.string().min(32).max(256) }).strict(),
});

export const refundSchema = z.object({
  params: z.object({ paymentId: uuid }),
  body: z.object({ amountPaisa: positivePaisa, reason: z.string().trim().min(5).max(500), idempotencyKey }).strict(),
});

export const payoutSchema = z.object({
  body: z.object({ amountPaisa: positivePaisa, payoutMethodId: uuid, idempotencyKey }).strict(),
});

export const payoutMethodSchema = z.object({
  body: z.object({
    type: z.enum(["BANK", "BKASH", "NAGAD", "OTHER_MFS"]),
    accountHolderName: z.string().trim().min(2).max(120),
    accountIdentifier: z.string().trim().min(6).max(100),
    bankName: z.string().trim().min(2).max(120).optional(),
    branchName: z.string().trim().max(120).optional(),
    routingNumber: z.string().trim().max(40).optional(),
    isDefault: z.boolean().default(false),
  }).strict().superRefine((value, context) => {
    if (value.type === "BANK" && !value.bankName) {
      context.addIssue({ code: "custom", path: ["bankName"], message: "Bank name is required for a bank payout method" });
    }
    if (value.type !== "BANK" && !/^(?:\+?88)?01[3-9]\d{8}$/.test(value.accountIdentifier.replace(/[\s-]/g, ""))) {
      context.addIssue({ code: "custom", path: ["accountIdentifier"], message: "Use a valid Bangladesh mobile wallet number" });
    }
  }),
});

export const payoutMethodParamsSchema = z.object({ params: z.object({ payoutMethodId: uuid }) });

export const payoutParamsSchema = z.object({ params: z.object({ payoutId: uuid }) });
export const providerPayoutQuerySchema = z.object({
  query: z.object({
    ...pagination,
    status: z.enum(["PENDING", "ON_HOLD", "APPROVED", "REJECTED", "PAID"]).optional(),
  }).strict(),
});

export const refundParamsSchema = z.object({ params: z.object({ refundId: uuid }) });
export const driverRefundQuerySchema = z.object({
  query: z.object({
    ...pagination,
    status: z.enum(["PENDING", "PROCESSING", "SUCCEEDED", "FAILED", "REJECTED"]).optional(),
  }).strict(),
});

export const adminListingSuspensionSchema = z.object({
  params: z.object({ listingId: uuid }),
  body: z.object({ reason: z.string().trim().min(5).max(500) }).strict(),
});

export const adminPayoutQuerySchema = z.object({
  query: z.object({ ...pagination, status: z.enum(["PENDING", "ON_HOLD", "APPROVED", "REJECTED", "PAID"]).optional() }).strict(),
});

export const adminPayoutReviewSchema = z.object({
  params: z.object({ payoutId: uuid }),
  body: z.object({
    decision: z.enum(["APPROVED", "REJECTED", "PAID"]),
    note: z.string().trim().min(3).max(500),
    externalReference: z.string().trim().min(3).max(120).optional(),
  }).strict().superRefine((value, context) => {
    if (value.decision === "PAID" && !value.externalReference) {
      context.addIssue({ code: "custom", path: ["externalReference"], message: "External transfer reference is required when marking a payout paid" });
    }
  }),
});

export const adminDisputeQuerySchema = z.object({
  query: z.object({ ...pagination, status: z.enum(["OPEN", "UNDER_REVIEW", "RESOLVED", "REJECTED"]).optional() }).strict(),
});

export const listingReportSchema = z.object({
  params: z.object({ listingId: uuid }),
  body: z.object({ reason: z.string().trim().min(10).max(500), details: z.string().trim().max(2000).optional() }).strict(),
});

export const disputeListQuerySchema = z.object({
  query: z.object({
    ...pagination,
    status: z.enum(["OPEN", "UNDER_REVIEW", "RESOLVED", "REJECTED"]).optional(),
  }).strict(),
});

export const adminListingQuerySchema = z.object({
  query: z.object({
    ...pagination,
    search: z.string().trim().max(120).optional(),
    status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "SUSPENDED", "ENDED"]).optional(),
    providerUserId: uuid.optional(),
    propertyId: uuid.optional(),
  }).strict(),
});

export const notificationParamsSchema = z.object({ params: z.object({ notificationId: uuid }) });

export const createReviewSchema = z.object({
  params: z.object({ bookingId: uuid }),
  body: z.object({ rating: z.number().int().min(1).max(5), comment: z.string().trim().max(2000).optional() }).strict(),
});

export const replyReviewSchema = z.object({
  params: z.object({ reviewId: uuid }),
  body: z.object({ reply: z.string().trim().min(1).max(2000) }).strict(),
});

export const createDisputeSchema = z.object({
  params: z.object({ bookingId: uuid }),
  body: z.object({
    category: z.enum(["PAYMENT", "ACCESS", "PARKING_CONDITION", "OVERCHARGE", "VEHICLE_DAMAGE", "OTHER"]),
    description: z.string().trim().min(10).max(3000),
    evidence: z.array(z.object({ url: z.url(), type: z.string().trim().min(1).max(50) }).strict()).max(10).optional(),
  }).strict(),
});

export const resolveDisputeSchema = z.object({
  params: z.object({ disputeId: uuid }),
  body: z.object({ decision: z.enum(["RESOLVED", "REJECTED"]), resolution: z.string().trim().min(10).max(3000) }).strict(),
});

export const reviewParamsSchema = z.object({ params: z.object({ reviewId: uuid }) });
export const disputeParamsSchema = z.object({ params: z.object({ disputeId: uuid }) });
