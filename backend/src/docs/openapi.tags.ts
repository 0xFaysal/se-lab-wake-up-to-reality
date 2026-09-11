export const openApiTags = [
  {
    name: "Health",
    description: "API health and readiness endpoints",
  },
  {
    name: "Authentication",
    description:
      "Registration, login, refresh, verification, recovery, and authentication",
  },
  {
    name: "User Account",
    description:
      "Authenticated user profile, password, and active session management",
  },
  { name: "Vehicles", description: "Driver vehicle management" },
  { name: "Properties", description: "Provider Property management and governance" },
  {
    name: "Property Images",
    description: "Shared Property image management",
  },
  {
    name: "Admin Properties",
    description: "Administrative Property verification workflow",
  },
  {
    name: "Property Guards",
    description: "Shared Property Guard membership management",
  },
  {
    name: "Manager Delegations",
    description: "Provider-scoped Manager permission delegation",
  },
  {
    name: "Property Governance",
    description: "Provider membership, Building Manager, voting, and shared changes",
  },
  {
    name: "Guard Assignments",
    description: "Security Guard assignment consent and assignment views",
  },
  {
    name: "Parking",
    description: "Parking spot and availability operations",
  },
  { name: "Bookings", description: "Parking reservation lifecycle" },
  { name: "Guard", description: "Security Guard operational APIs" },
  { name: "Admin", description: "Administrative operations" },
] as const;
