import type { VehicleType } from "./api-types";

export type ParkingResourceType = "FIXED_SPACE" | "SHARED_POOL";
export type ParkingResourceStatus = "ACTIVE" | "BLOCKED" | "MAINTENANCE" | "INACTIVE";
export type ParkingRightType = "OWNERSHIP" | "USE_ONLY" | "COMMERCIAL_LEASE" | "AUTHORIZED_OPERATION";
export type ParkingRightStatus = "PENDING_VERIFICATION" | "VERIFIED" | "DISPUTED" | "REJECTED" | "REVOKED" | "EXPIRED";
export type ListingStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "SUSPENDED" | "ENDED";
export type HoldStatus = "ACTIVE" | "CONSUMED" | "EXPIRED" | "RELEASED";
export type MarketplaceBookingStatus = "PAYMENT_PENDING" | "CONFIRMED" | "CHECKED_IN" | "CHECKOUT_REQUESTED" | "PAYMENT_DUE" | "COMPLETED" | "CANCELLED" | "EXPIRED" | "NO_SHOW" | "DISPUTED";
export type PaymentStatus = "PENDING" | "CAPTURED" | "FAILED" | "PARTIALLY_REFUNDED" | "REFUNDED";
export type RefundStatus = "PENDING" | "SUCCEEDED" | "FAILED";
export type PayoutStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID";
export type DisputeStatus = "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED";
export interface PaginationDto { page: number; limit: number; total: number; totalPages: number }

export interface ParkingResourceDto {
  id: string; propertyId: string; providerMembershipId: string; resourceType: ParkingResourceType;
  displayName: string | null; spotCode: string | null; floor: string | null; zone: string | null;
  capacity: number; supportedVehicleTypes: VehicleType[]; status: ParkingResourceStatus;
  isCovered: boolean; hasCctv: boolean; hasGuard: boolean; maxHeightCm: number | null;
  maxWidthCm: number | null; maxLengthCm: number | null; createdAt: string; updatedAt: string;
  parkingRights?: ParkingRightDto[]; listings?: ParkingListingDto[];
  availabilityRules?: AvailabilityRuleDto[]; availabilityExceptions?: AvailabilityExceptionDto[];
}

export interface CreateParkingResourceInput {
  type: ParkingResourceType; displayName: string; spotCode?: string; floor?: string; zone?: string;
  capacity: number; supportedVehicleTypes: VehicleType[]; isCovered: boolean; hasCctv: boolean; hasGuard: boolean;
  maxHeightCm?: number; maxWidthCm?: number; maxLengthCm?: number;
}

export interface ParkingRightDto {
  id: string; parkingSpotId: string; holderUserId: string; providerMembershipId: string | null;
  rightType: ParkingRightType; quantity: number; canUse: boolean; canList: boolean; canSetPrice: boolean;
  canManageBookings: boolean; canDelegateManager: boolean; validFrom: string; validUntil: string | null;
  status: ParkingRightStatus; rejectionReason: string | null; verifiedAt: string | null; createdAt: string; updatedAt: string;
  parkingSpot?: ParkingResourceDto;
}

export interface ParkingRightClaimInput {
  rightType: ParkingRightType; quantity: number; canUse: boolean; canList: boolean; canSetPrice: boolean;
  canManageBookings: boolean; canDelegateManager: boolean; validFrom?: string; validUntil?: string;
}

export interface ParkingListingDto {
  id: string; parkingSpotId: string; providerUserId: string; providerMembershipId: string; parkingRightId: string;
  status: ListingStatus; title: string; description: string | null; pricePerHourPaisa: string;
  minDurationMinutes: number; maxDurationMinutes: number; allowedVehicleTypes: VehicleType[];
  securityDepositPaisa: string; publishedAt: string | null; deactivatedAt: string | null;
  createdAt: string; updatedAt: string; parkingSpot?: ParkingResourceDto; parkingRight?: ParkingRightDto;
}
export interface AdminListingDto extends ParkingListingDto {
  provider: { id: string; fullName: string; email: string; status: string };
  providerMembership: { id: string; status: string; verificationStatus: string };
  parkingRight: ParkingRightDto;
  parkingSpot: ParkingResourceDto & {
    property: { id: string; name: string; publicArea: string; verificationStatus: string; status: string };
  };
}

export interface ListingInput {
  parkingRightId: string; title: string; description?: string; pricePerHourPaisa: string;
  minDurationMinutes: number; maxDurationMinutes: number; allowedVehicleTypes: VehicleType[]; securityDepositPaisa: string;
}

export interface AvailabilityRuleDto {
  id: string; parkingSpotId: string; dayOfWeek: number; startLocalTime: string; endLocalTime: string;
  validFrom: string; validUntil: string | null; isActive: boolean;
}
export interface AvailabilityRuleInput { dayOfWeek: number; startLocalTime: string; endLocalTime: string; validFrom: string; validUntil?: string }
export interface AvailabilityExceptionDto { id: string; parkingSpotId: string; startsAt: string; endsAt: string; exceptionType: "BLOCKED" | "SPECIAL_AVAILABLE"; reason: string | null; createdAt: string }
export interface AvailabilityDto { rules: AvailabilityRuleDto[]; exceptions: AvailabilityExceptionDto[]; timezone: "Asia/Dhaka" }

export interface ParkingSearchParams {
  latitude: number; longitude: number; radiusKm: number; startAt: string; endAt: string; vehicleType: VehicleType;
  minPricePaisa?: string; maxPricePaisa?: string; covered?: boolean;
}
export interface ParkingOfferDto { listingId: string; resourceType: ParkingResourceType; title: string; pricePerHourPaisa: string; allowedVehicleTypes: VehicleType[]; isCovered: boolean; facilities: string[]; availableUnits: number }
export interface ParkingSearchResultDto { id: string; name: string; publicArea: string; approximateAddress: string; latitude: number; longitude: number; coverImageUrl: string | null; distanceKm: number; availableUnits: number; minimumPricePaisa: string; maximumPricePaisa: string; offers: ParkingOfferDto[] }
export interface PublicPropertyOfferDto extends Omit<ParkingOfferDto, "facilities"> {
  description: string | null; displayName: string | null; floor: string | null; zone: string | null;
  securityDepositPaisa: string; minDurationMinutes: number; maxDurationMinutes: number;
  hasCctv: boolean; hasGuard: boolean; maxHeightCm: number | null; maxWidthCm: number | null;
  maxLengthCm: number | null; facilities: Array<{ code: string; displayName: string }>;
}
export interface PublicPropertyDetailDto {
  id: string; name: string; description: string | null; publicArea: string; approximateAddress: string;
  latitude: number; longitude: number; visitorIdentificationRequired: boolean; vehicleHeightLimitCm: number | null;
  entryCutoffLocalTime: string | null; generalParkingRules: string | null; commonSafetyRules: string | null;
  temporaryClosureReason: string | null; temporaryClosedAt: string | null; temporaryClosedUntil: string | null;
  images: Array<{ id: string; url: string; imageType: string; sortOrder: number; isCover: boolean }>;
  rating: number | null; reviewCount: number; facilities: Array<{ code: string; displayName: string }>;
  requestedPeriod: { startAt: string; endAt: string; vehicleType: VehicleType };
  offers: PublicPropertyOfferDto[];
}

export interface BookingQuoteDto { id: string; driverUserId: string; listingId: string; vehicleId: string; parkingSpotId: string; startAt: string; endAt: string; durationMinutes: number; baseAmountPaisa: string; platformFeePaisa: string; depositPaisa: string; totalAmountPaisa: string; expiresAt: string; createdAt: string; expired?: boolean }
export interface ReservationHoldDto { id: string; quoteId: string; driverUserId: string; listingId: string; parkingSpotId: string; allocationId: string; status: HoldStatus; expiresAt: string; createdAt: string; updatedAt: string; expired?: boolean; quote?: BookingQuoteDto }
export interface PaymentDto { id: string; bookingId: string; payerUserId: string; amountPaisa: string; currency: string; status: PaymentStatus; providerReference: string | null; capturedAt: string | null; createdAt: string; updatedAt: string }
export interface BookingDto {
  id: string; bookingCode: string; holdId: string; driverUserId: string; vehicleId: string; propertyId: string;
  parkingSpotId: string; listingId: string; providerUserId: string; status: MarketplaceBookingStatus;
  startAt: string; scheduledEndAt: string; effectiveEndAt: string; baseAmountPaisa: string; platformFeePaisa: string;
  depositPaisa: string; totalAmountPaisa: string; confirmedAt: string | null; checkedInAt: string | null;
  checkoutRequestedAt: string | null; checkedOutAt: string | null; cancelledAt: string | null; createdAt: string; updatedAt: string;
  vehicle?: { id: string; vehicleType: VehicleType; registrationNumber: string };
  property?: { id: string; name: string; publicArea: string; approximateAddress: string };
  parkingSpot?: { id: string; displayName: string | null; spotCode: string | null; resourceType: ParkingResourceType; floor: string | null; zone: string | null };
  listing?: { id: string; title: string; providerMembershipId?: string }; payments?: PaymentDto[];
}
export interface GuardBookingDto {
  id: string; bookingCode: string; status: "CONFIRMED" | "CHECKED_IN" | "CHECKOUT_REQUESTED";
  startAt: string; scheduledEndAt: string; effectiveEndAt: string; confirmedAt: string | null;
  checkedInAt: string | null; checkoutRequestedAt: string | null; checkedOutAt: string | null; createdAt: string;
  driver: { id: string; fullName: string };
  vehicle: { id: string; vehicleType: VehicleType; registrationNumber: string; brand: string | null; model: string | null; color: string | null };
  property: { id: string; name: string; publicArea: string; approximateAddress: string };
  parkingSpot: { id: string; displayName: string | null; spotCode: string | null; resourceType: ParkingResourceType; floor: string | null; zone: string | null };
  listing: { id: string; title: string };
}
export interface PaymentCaptureResult { payment: PaymentDto; booking: BookingDto; accessCredential: string | null; credentialAlreadyIssued: boolean }

export interface WalletDto { id: string; userId: string; currency: string; status: string; availableBalancePaisa: string; pendingBalancePaisa: string; heldBalancePaisa: string; balanceVersion: number; createdAt: string; updatedAt: string }
export interface LedgerEntryDto { id: string; accountCode: string; entrySide: "DEBIT" | "CREDIT"; amountPaisa: string; createdAt: string; ledgerTransaction: { id: string; referenceType: string; referenceId: string; description: string; createdAt: string } }
export interface EarningsSummaryDto { currency: string; availableBalancePaisa: string; pendingBalancePaisa: string; heldBalancePaisa: string; providerCount: number }
export interface RefundDto { id: string; paymentId: string; requestedByUserId: string; amountPaisa: string; reason: string; status: RefundStatus; processedAt: string | null; createdAt: string; payment?: { id: string; amountPaisa: string; currency: string; status: PaymentStatus; capturedAt: string | null; booking: { id: string; bookingCode: string; status: MarketplaceBookingStatus; property: { id: string; name: string; publicArea: string } } } }
export interface PayoutDto { id: string; providerUserId: string; walletAccountId: string; amountPaisa: string; status: PayoutStatus; reviewNote: string | null; reviewedAt: string | null; paidAt: string | null; createdAt: string; updatedAt?: string; provider?: { id: string; fullName: string; email: string } }
export interface NotificationDto { id: string; type: string; title: string; message: string; entityType: string | null; entityId: string | null; readAt: string | null; createdAt: string }
export interface ReviewDto { id: string; bookingId: string; driverUserId: string; rating: number; comment: string | null; providerReply: string | null; providerRepliedAt: string | null; createdAt: string; booking?: { bookingCode: string; propertyId: string; parkingSpotId: string }; driver?: { id: string; fullName: string } }
export interface DisputeDto { id: string; bookingId: string; openedByUserId: string; category: string; description: string; evidence: Array<{ url: string; type: string }> | null; status: DisputeStatus; resolution: string | null; resolvedAt: string | null; createdAt: string; updatedAt?: string; booking?: { id: string; bookingCode: string; status?: MarketplaceBookingStatus; propertyId?: string; driverUserId?: string; providerUserId?: string; startAt?: string; scheduledEndAt?: string; property?: { id: string; name: string; publicArea: string }; parkingSpot?: { id: string; displayName: string | null; spotCode: string | null }; driver?: { id: string; fullName: string }; provider?: { id: string; fullName: string } }; openedBy?: { id: string; fullName: string; email?: string }; resolvedBy?: { id: string; fullName: string } | null }
export interface GuardCredentialResult { valid: true; booking: GuardBookingDto }
