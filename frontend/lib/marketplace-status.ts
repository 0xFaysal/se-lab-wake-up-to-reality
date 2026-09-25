import type { DisputeStatus, HoldStatus, ListingStatus, MarketplaceBookingStatus, ParkingRightStatus, PaymentStatus, PayoutStatus, RefundStatus } from "./api/marketplace-types";

export interface StatusPresentation { label: string; className: string }
const green = "bg-emerald-100 text-emerald-800";
const amber = "bg-amber-100 text-amber-800";
const red = "bg-red-100 text-red-800";
const blue = "bg-blue-100 text-blue-800";
const slate = "bg-slate-100 text-slate-700";

export const parkingRightStatus: Record<ParkingRightStatus, StatusPresentation> = {
  PENDING_VERIFICATION: { label: "Pending verification", className: amber }, VERIFIED: { label: "Verified", className: green },
  DISPUTED: { label: "Disputed", className: red }, REJECTED: { label: "Rejected", className: red },
  REVOKED: { label: "Revoked", className: red }, EXPIRED: { label: "Expired", className: slate },
};
export const listingStatus: Record<ListingStatus, StatusPresentation> = {
  DRAFT: { label: "Draft", className: slate }, ACTIVE: { label: "Active", className: green }, PAUSED: { label: "Paused", className: amber },
  SUSPENDED: { label: "Suspended", className: red }, ENDED: { label: "Ended", className: slate },
};
export const holdStatus: Record<HoldStatus, StatusPresentation> = {
  ACTIVE: { label: "Held", className: blue }, CONSUMED: { label: "Used", className: green }, EXPIRED: { label: "Expired", className: red }, RELEASED: { label: "Released", className: slate },
};
export const bookingStatus: Record<MarketplaceBookingStatus, StatusPresentation> = {
  PAYMENT_PENDING: { label: "Payment pending", className: amber }, CONFIRMED: { label: "Confirmed", className: green },
  CHECKED_IN: { label: "Checked in", className: blue }, CHECKOUT_REQUESTED: { label: "Checkout requested", className: amber },
  PAYMENT_DUE: { label: "Payment due", className: amber }, COMPLETED: { label: "Completed", className: green },
  CANCELLED: { label: "Cancelled", className: red }, EXPIRED: { label: "Expired", className: slate },
  NO_SHOW: { label: "No show", className: red }, DISPUTED: { label: "Disputed", className: red },
};
export const paymentStatus: Record<PaymentStatus, StatusPresentation> = {
  CREATED: { label: "Starting", className: amber }, SESSION_CREATED: { label: "Checkout ready", className: blue }, PENDING: { label: "Pending", className: amber }, VALIDATING: { label: "Verifying", className: amber }, SUCCEEDED: { label: "Paid", className: green }, CAPTURED: { label: "Paid", className: green }, FAILED: { label: "Failed", className: red }, CANCELLED: { label: "Cancelled", className: red }, EXPIRED: { label: "Expired", className: slate }, REFUND_PENDING: { label: "Refund pending", className: amber },
  PARTIALLY_REFUNDED: { label: "Partially refunded", className: blue }, REFUNDED: { label: "Refunded", className: slate },
};
export const refundStatus: Record<RefundStatus, StatusPresentation> = {
  PENDING: { label: "Pending", className: amber }, PROCESSING: { label: "Processing", className: blue }, SUCCEEDED: { label: "Refunded", className: green }, FAILED: { label: "Failed", className: red }, REJECTED: { label: "Rejected", className: red },
};
export const payoutStatus: Record<PayoutStatus, StatusPresentation> = {
  PENDING: { label: "Pending review", className: amber }, REQUESTED: { label: "Requested", className: amber }, ON_HOLD: { label: "On hold", className: red }, APPROVED: { label: "Approved", className: blue }, REJECTED: { label: "Rejected", className: red }, PAID: { label: "Paid", className: green }, CANCELLED: { label: "Cancelled", className: slate },
};
export const disputeStatus: Record<DisputeStatus, StatusPresentation> = {
  OPEN: { label: "Open", className: amber }, UNDER_REVIEW: { label: "Under review", className: blue }, RESOLVED: { label: "Resolved", className: green }, REJECTED: { label: "Rejected", className: red },
};
