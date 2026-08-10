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
  { name: "Properties", description: "Parking Owner property management" },
  {
    name: "Parking",
    description: "Parking spot and availability operations",
  },
  { name: "Bookings", description: "Parking reservation lifecycle" },
  { name: "Guard", description: "Security Guard operational APIs" },
  { name: "Admin", description: "Administrative operations" },
] as const;
