import type { UserRole } from "@/lib/api/api-types";

export const backendCapabilities = {
  auth: true, vehicles: true, properties: true, propertyImages: true,
  guardAssignments: true, adminVerification: true, managerDelegations: true,
  propertyGovernance: true,
  parkingSearch: false, parkingSpots: false, availability: false, bookings: false, payments: false,
  wallet: false, earnings: false, payouts: false, notifications: false, reviews: false, disputes: false, support: false,
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
