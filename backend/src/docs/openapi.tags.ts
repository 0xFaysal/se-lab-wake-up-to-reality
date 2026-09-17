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
  {
    name: "Parking Marketplace",
    description: "Public parking discovery grouped by canonical Property",
  },
  { name: "Parking Resources", description: "Fixed-space and shared-pool inventory" },
  { name: "Parking Rights", description: "Provider parking entitlements and verification" },
  { name: "Parking Listings", description: "Commercial parking offers" },
  { name: "Availability", description: "Asia/Dhaka weekly schedules and exceptions" },
  { name: "Bookings", description: "Parking reservation lifecycle" },
  { name: "Booking", description: "Quote, hold, and booking lifecycle" },
  { name: "Payments", description: "MVP simulated payment and refund operations" },
  { name: "Guard Booking Operations", description: "Credential verification and access control" },
  { name: "Wallet", description: "Provider settlement balances and transactions" },
  { name: "Notifications", description: "Persistent user notifications" },
  { name: "Reviews", description: "Completed-booking reviews and Provider replies" },
  { name: "Disputes", description: "Booking dispute and administrative resolution" },
  { name: "Guard", description: "Security Guard operational APIs" },
  { name: "Admin", description: "Administrative operations" },
] as const;
