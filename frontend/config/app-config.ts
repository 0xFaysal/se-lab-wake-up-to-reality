import type { UserRole } from "@/lib/api/api-types";

export const backendCapabilities = {
  auth: true, vehicles: true, properties: true, propertyImages: true,
  guardAssignments: true, adminVerification: true, managerDelegations: true,
  propertyGovernance: true,
  parkingResources: true, parkingRights: true, listings: true, availability: true,
  parkingSearch: true, quotes: true, holds: true, bookings: true, payments: true,
  wallet: true, earnings: true, refunds: true, payouts: true, notifications: true,
  reviews: true, disputes: true, guardBookingOperations: true,
  supportTickets: false, realtimeSocket: false, advancedOvertime: false, realPaymentGateway: false,
} as const;

export const portalHome: Record<UserRole, string> = {
  DRIVER: "/driver/dashboard", PROVIDER: "/owner/dashboard", PARKING_OWNER: "/owner/dashboard", MANAGER: "/owner/dashboard",
  GUARD: "/guard", ADMIN: "/admin/properties/pending",
};

export const routeRoles = [
  { prefix: "/driver", roles: ["DRIVER"] },
  { prefix: "/owner", roles: ["PROVIDER", "PARKING_OWNER", "MANAGER"] },
  { prefix: "/guard", roles: ["GUARD"] },
  { prefix: "/admin", roles: ["ADMIN"] },
] satisfies Array<{ prefix: string; roles: UserRole[] }>;
