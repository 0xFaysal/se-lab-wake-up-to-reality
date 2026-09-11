export interface OwnerProfile {
  name: string;
  role: string;
  initials: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  verifiedHost: boolean;
}

export interface OwnerMetric {
  title: string;
  value: number | string;
  subtext: string;
  subtextColor: "emerald" | "amber" | "slate";
  iconName: string;
}

export interface OwnerProperty {
  id: string;
  title: string;
  status: "ACTIVE" | "PAUSED" | "DRAFT";
  address: string;
  area: string;
  totalSpaces: number;
  availableSpaces: number;
  ratePerHour: number | null;
  managerName?: string;
  guardName?: string;
  guardStatus?: "On Duty" | "Off Duty" | "Not Assigned";
  imageUrl?: string;
}

export interface OwnerBooking {
  id: string;
  driverName: string;
  driverInitials: string;
  driverPhone?: string;
  driverEmail?: string;
  vehicleModel: string;
  vehicleColor?: string;
  licensePlate?: string;
  propertyId: string;
  propertyTitle: string;
  spotNumber: string;
  dateStr: string;
  timeStr: string;
  durationHours?: number;
  amountPaid: number;
  ownerEarnings?: number;
  status: "CONFIRMED" | "ACTIVE" | "UPCOMING" | "COMPLETED" | "CANCELLED" | "PENDING_ENTRY";
}

export interface OwnerActivity {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: "manager" | "booking" | "guard" | "system";
  isImportant?: boolean;
}

export const MOCK_OWNER_PROFILE: OwnerProfile = {
  name: "Tanvir Chowdhury",
  role: "Property Owner",
  initials: "TC",
  email: "tanvir.chowdhury@parkease.bd",
  phone: "+880 1711-928471",
  verifiedHost: true,
};

export const MOCK_OWNER_METRICS = {
  activeListings: {
    value: 1,
    subtext: "100% Operational",
    status: "positive",
  },
  upcomingBookings: {
    value: 3,
    subtext: "Next: Today 2:00 PM",
    status: "neutral",
  },
  occupiedSpaces: {
    value: 2,
    subtext: "25% Capacity filled",
    status: "warning",
  },
  availableSpaces: {
    value: 6,
    subtext: "Ready for booking",
    status: "positive",
  },
};

export const MOCK_OWNER_PROPERTIES: OwnerProperty[] = [
  {
    id: "prop-gulshan-1",
    title: "Residential Building, Gulshan",
    status: "ACTIVE",
    address: "Road 12, Block C, Gulshan, Dhaka",
    area: "Gulshan-2",
    totalSpaces: 8,
    availableSpaces: 6,
    ratePerHour: 50,
    managerName: "Rahim Uddin",
    guardName: "Tariqul Islam",
    guardStatus: "On Duty",
    imageUrl: "/assets/safety-garage.jpg",
  },
  {
    id: "prop-banani-2",
    title: "Office Parking, Banani",
    status: "PAUSED",
    address: "Road 11, Banani, Dhaka",
    area: "Banani",
    totalSpaces: 5,
    availableSpaces: 5,
    ratePerHour: 70,
    managerName: "Rahim Uddin",
    guardName: undefined,
    guardStatus: "Not Assigned",
    imageUrl: "/assets/garage-entrance.jpg",
  },
  {
    id: "prop-dhanmondi-3",
    title: "Apartment Parking, Dhanmondi",
    status: "DRAFT",
    address: "Road 8A, Dhanmondi, Dhaka",
    area: "Dhanmondi",
    totalSpaces: 4,
    availableSpaces: 4,
    ratePerHour: null,
    managerName: undefined,
    guardName: undefined,
    guardStatus: "Not Assigned",
    imageUrl: undefined,
  },
];

export const MOCK_UPCOMING_BOOKINGS: OwnerBooking[] = [
  {
    id: "#BK-7892",
    driverName: "Farhan Ahmed",
    driverInitials: "FA",
    driverPhone: "+880 1812-334455",
    driverEmail: "farhan.ahmed@example.com",
    vehicleModel: "Toyota Corolla",
    licensePlate: "Dhaka Metro-GA-11-2345",
    propertyId: "prop-gulshan-1",
    propertyTitle: "Residential Building, Gulshan",
    spotNumber: "Spot 3",
    dateStr: "Today",
    timeStr: "2:00 PM – 5:00 PM",
    amountPaid: 150,
    ownerEarnings: 135,
    status: "CONFIRMED",
  },
  {
    id: "#BK-7895",
    driverName: "Nusrat Jahan",
    driverInitials: "NJ",
    driverPhone: "+880 1719-887766",
    driverEmail: "nusrat.j@example.com",
    vehicleModel: "SUV (Toyota Harrier)",
    licensePlate: "Dhaka Metro-GHA-18-5621",
    propertyId: "prop-gulshan-1",
    propertyTitle: "Residential Building, Gulshan",
    spotNumber: "Spot 1",
    dateStr: "Tomorrow",
    timeStr: "9:00 AM – 1:00 PM",
    amountPaid: 200,
    ownerEarnings: 180,
    status: "CONFIRMED",
  },
  {
    id: "#BK-7901",
    driverName: "Kamal Hossain",
    driverInitials: "KH",
    driverPhone: "+880 1911-223344",
    driverEmail: "kamal.hossain@example.com",
    vehicleModel: "Hatchback (Suzuki Swift)",
    licensePlate: "Dhaka Metro-KHA-12-8899",
    propertyId: "prop-gulshan-1",
    propertyTitle: "Residential Building, Gulshan",
    spotNumber: "Spot 4",
    dateStr: "Oct 24",
    timeStr: "6:00 PM – 8:00 PM",
    amountPaid: 140,
    ownerEarnings: 126,
    status: "PENDING_ENTRY",
  },
];

export const MOCK_ALL_BOOKINGS: OwnerBooking[] = [
  {
    id: "#BK-7892",
    driverName: "Arif Hossain",
    driverInitials: "AH",
    driverPhone: "+880 1812-445566",
    driverEmail: "arif.hossain@example.com",
    vehicleModel: "Toyota Corolla",
    licensePlate: "Dhaka Metro-GA-11-2345",
    propertyId: "prop-gulshan-1",
    propertyTitle: "Residential Building, Gulshan",
    spotNumber: "Spot 3",
    dateStr: "Today",
    timeStr: "2:00 PM – 5:00 PM",
    durationHours: 3,
    amountPaid: 150,
    ownerEarnings: 135,
    status: "ACTIVE",
  },
  {
    id: "#BK-7895",
    driverName: "Nusrat Jahan",
    driverInitials: "NJ",
    driverPhone: "+880 1719-887766",
    driverEmail: "nusrat.j@example.com",
    vehicleModel: "SUV",
    licensePlate: "Dhaka Metro-GHA-18-5621",
    propertyId: "prop-gulshan-1",
    propertyTitle: "Residential Building, Gulshan",
    spotNumber: "Spot 1",
    dateStr: "Tomorrow",
    timeStr: "9:00 AM – 1:00 PM",
    durationHours: 4,
    amountPaid: 200,
    ownerEarnings: 180,
    status: "CONFIRMED",
  },
  {
    id: "#BK-7901",
    driverName: "Tanvir Ahmed",
    driverInitials: "TA",
    driverPhone: "+880 1611-998877",
    driverEmail: "tanvir.ahmed@example.com",
    vehicleModel: "Car (Hatchback)",
    licensePlate: "Dhaka Metro-KHA-12-8899",
    propertyId: "prop-banani-2",
    propertyTitle: "Office Parking, Banani",
    spotNumber: "Spot 4",
    dateStr: "Oct 24",
    timeStr: "6:00 PM – 8:00 PM",
    durationHours: 2,
    amountPaid: 140,
    ownerEarnings: 126,
    status: "UPCOMING",
  },
  {
    id: "#BK-7864",
    driverName: "Sadia Rahman",
    driverInitials: "SR",
    driverPhone: "+880 1722-112233",
    driverEmail: "sadia.rahman@example.com",
    vehicleModel: "Honda Civic",
    licensePlate: "Dhaka Metro-GA-21-4567",
    propertyId: "prop-gulshan-1",
    propertyTitle: "Residential Building, Gulshan",
    spotNumber: "Spot 2",
    dateStr: "Oct 20",
    timeStr: "10:00 AM – 1:00 PM",
    durationHours: 3,
    amountPaid: 150,
    ownerEarnings: 135,
    status: "COMPLETED",
  },
  {
    id: "#PE-BK-2048",
    driverName: "Nafis Ahmed",
    driverInitials: "NA",
    driverPhone: "+880 18XX-XXXXXX",
    driverEmail: "nafis@example.com",
    vehicleModel: "White Toyota Corolla",
    vehicleColor: "White",
    licensePlate: "DHAKA METRO-GA-XX-XXXX",
    propertyId: "prop-gulshan-1",
    propertyTitle: "Gulshan Avenue — Basement Slot B-12",
    spotNumber: "Slot B-12",
    dateStr: "August 14, 2026",
    timeStr: "10:00 AM – 3:00 PM",
    durationHours: 5,
    amountPaid: 540,
    ownerEarnings: 500,
    status: "ACTIVE",
  },
  {
    id: "#BK-7850",
    driverName: "Shakil Hasan",
    driverInitials: "SH",
    driverPhone: "+880 1912-334455",
    driverEmail: "shakil.h@example.com",
    vehicleModel: "Sedan (Nissan Sunny)",
    licensePlate: "Dhaka Metro-KHA-15-7788",
    propertyId: "prop-gulshan-1",
    propertyTitle: "Residential Building, Gulshan",
    spotNumber: "Spot 5",
    dateStr: "Oct 18",
    timeStr: "11:00 AM – 3:00 PM",
    durationHours: 4,
    amountPaid: 200,
    ownerEarnings: 180,
    status: "COMPLETED",
  },
  {
    id: "#BK-7842",
    driverName: "Mehedi Zaman",
    driverInitials: "MZ",
    driverPhone: "+880 1711-223344",
    driverEmail: "mehedi.z@example.com",
    vehicleModel: "Toyota Allion",
    licensePlate: "Dhaka Metro-GA-33-8899",
    propertyId: "prop-banani-2",
    propertyTitle: "Office Parking, Banani",
    spotNumber: "Spot 1",
    dateStr: "Oct 15",
    timeStr: "9:00 AM – 6:00 PM",
    durationHours: 9,
    amountPaid: 630,
    ownerEarnings: 567,
    status: "COMPLETED",
  },
  {
    id: "#BK-7839",
    driverName: "Rashed Khan",
    driverInitials: "RK",
    driverPhone: "+880 1822-667788",
    driverEmail: "rashed.khan@example.com",
    vehicleModel: "Hyundai Creta",
    licensePlate: "Dhaka Metro-GHA-19-4455",
    propertyId: "prop-gulshan-1",
    propertyTitle: "Residential Building, Gulshan",
    spotNumber: "Spot 6",
    dateStr: "Oct 14",
    timeStr: "2:00 PM – 7:00 PM",
    durationHours: 5,
    amountPaid: 250,
    ownerEarnings: 225,
    status: "COMPLETED",
  },
  {
    id: "#BK-7831",
    driverName: "Fatima Begum",
    driverInitials: "FB",
    driverPhone: "+880 1612-445566",
    driverEmail: "fatima.b@example.com",
    vehicleModel: "Toyota Premio",
    licensePlate: "Dhaka Metro-GA-25-1122",
    propertyId: "prop-banani-2",
    propertyTitle: "Office Parking, Banani",
    spotNumber: "Spot 3",
    dateStr: "Oct 12",
    timeStr: "1:00 PM – 4:00 PM",
    durationHours: 3,
    amountPaid: 210,
    ownerEarnings: 189,
    status: "COMPLETED",
  },
  {
    id: "#BK-7824",
    driverName: "Anik Chowdhury",
    driverInitials: "AC",
    driverPhone: "+880 1733-556677",
    driverEmail: "anik.c@example.com",
    vehicleModel: "Mitsubishi Lancer",
    licensePlate: "Dhaka Metro-KHA-18-9900",
    propertyId: "prop-gulshan-1",
    propertyTitle: "Residential Building, Gulshan",
    spotNumber: "Spot 8",
    dateStr: "Oct 10",
    timeStr: "8:00 AM – 12:00 PM",
    durationHours: 4,
    amountPaid: 200,
    ownerEarnings: 180,
    status: "COMPLETED",
  },
  {
    id: "#BK-7819",
    driverName: "Tahmina Akter",
    driverInitials: "TA",
    driverPhone: "+880 1918-778899",
    driverEmail: "tahmina.a@example.com",
    vehicleModel: "Honda Grace",
    licensePlate: "Dhaka Metro-GA-14-3322",
    propertyId: "prop-gulshan-1",
    propertyTitle: "Residential Building, Gulshan",
    spotNumber: "Spot 7",
    dateStr: "Oct 8",
    timeStr: "3:00 PM – 6:00 PM",
    durationHours: 3,
    amountPaid: 150,
    ownerEarnings: 135,
    status: "COMPLETED",
  },
  {
    id: "#BK-7910",
    driverName: "Zubair Al Mamun",
    driverInitials: "ZM",
    driverPhone: "+880 1714-332211",
    driverEmail: "zubair.m@example.com",
    vehicleModel: "Kia Sportage",
    licensePlate: "Dhaka Metro-GHA-22-1133",
    propertyId: "prop-banani-2",
    propertyTitle: "Office Parking, Banani",
    spotNumber: "Spot 2",
    dateStr: "Oct 26",
    timeStr: "10:00 AM – 2:00 PM",
    durationHours: 4,
    amountPaid: 280,
    ownerEarnings: 252,
    status: "UPCOMING",
  },
];

export const MOCK_OWNER_ACTIVITIES: OwnerActivity[] = [
  {
    id: "act-1",
    title: "Manager Assignment Updated",
    description: "Rahim Uddin was assigned to Office Parking, Banani.",
    timestamp: "20 mins ago",
    type: "manager",
    isImportant: true,
  },
  {
    id: "act-2",
    title: "New Booking Confirmed",
    description: "Spot 3 reserved for Farhan Ahmed.",
    timestamp: "45 mins ago",
    type: "booking",
    isImportant: true,
  },
  {
    id: "act-3",
    title: "Guard Check-In",
    description: "Guard Tariqul verified at Gulshan facility.",
    timestamp: "2 hrs ago",
    type: "guard",
    isImportant: false,
  },
  {
    id: "act-4",
    title: "Listing Status",
    description: "Residential Building, Gulshan operating at standard tariff.",
    timestamp: "4 hrs ago",
    type: "system",
    isImportant: false,
  },
];

export interface OwnerGuard {
  id: string;
  guardCode: string;
  name: string;
  initials: string;
  avatarUrl?: string;
  phone: string;
  email: string;
  propertyId: string;
  propertyTitle: string;
  gate: string;
  shiftStart?: string;
  shiftEnd?: string;
  shiftWindow?: string;
  status: "ON_DUTY" | "OFF_DUTY" | "PENDING_ACTIVATION";
  assignedBy: string;
  invitationNote?: string;
  recentActivity?: string;
  recentActivityTime?: string;
}

export const MOCK_OWNER_GUARDS: OwnerGuard[] = [
  {
    id: "guard-1",
    guardCode: "GD-4091",
    name: "Tariqul Islam",
    initials: "TI",
    phone: "+880 18XX-XXXXXX",
    email: "tariqul@example.com",
    propertyId: "prop-gulshan-1",
    propertyTitle: "Residential Bldg, Gulshan",
    gate: "Gate 2",
    shiftStart: "08:00 AM",
    shiftEnd: "06:00 PM",
    shiftWindow: "8:00 AM – 6:00 PM",
    status: "ON_DUTY",
    assignedBy: "Rahim Uddin (Property Manager)",
    recentActivity: "Verified booking #PE-BK-2051",
    recentActivityTime: "12 mins ago",
  },
  {
    id: "guard-2",
    guardCode: "GD-3822",
    name: "Mahmud Hasan",
    initials: "MH",
    phone: "+880 17XX-XXXXXX",
    email: "mahmud@example.com",
    propertyId: "prop-banani-2",
    propertyTitle: "Office Parking, Banani",
    gate: "Gate 1",
    shiftStart: "02:00 PM",
    shiftEnd: "10:00 PM",
    shiftWindow: "2:00 PM – 10:00 PM",
    status: "OFF_DUTY",
    assignedBy: "Tanvir Chowdhury (Property Owner)",
  },
  {
    id: "guard-3",
    guardCode: "GD-5510",
    name: "Nayeem Ahmed",
    initials: "NA",
    phone: "+880 19XX-XXXXXX",
    email: "nayeem@example.com",
    propertyId: "prop-gulshan-1",
    propertyTitle: "Residential Bldg, Gulshan",
    gate: "Gate 1",
    shiftStart: "10:00 AM",
    shiftEnd: "08:00 PM",
    shiftWindow: "10:00 AM – 8:00 PM",
    status: "ON_DUTY",
    assignedBy: "Rahim Uddin (Property Manager)",
  },
  {
    id: "guard-4",
    guardCode: "GD-2904",
    name: "Arif Hossain",
    initials: "AH",
    phone: "+880 16XX-XXXXXX",
    email: "arif@example.com",
    propertyId: "prop-banani-2",
    propertyTitle: "Office Parking, Banani",
    gate: "Gate 2",
    status: "PENDING_ACTIVATION",
    invitationNote: "Invitation: Sent Today",
    assignedBy: "Tanvir Chowdhury (Property Owner)",
  },
];

export interface GuardCoverageItem {
  propertyTitle: string;
  totalGuards: number;
  onDutyCount: number;
  offDutyCount: number;
  pendingCount: number;
  subtext: string;
}

export const MOCK_GUARD_COVERAGE: GuardCoverageItem[] = [
  {
    propertyTitle: "Residential Building, Gulshan",
    totalGuards: 2,
    onDutyCount: 2,
    offDutyCount: 0,
    pendingCount: 0,
    subtext: "Gates 1 & 2 staffed",
  },
  {
    propertyTitle: "Office Parking, Banani",
    totalGuards: 2,
    onDutyCount: 0,
    offDutyCount: 1,
    pendingCount: 1,
    subtext: "1 Off-Duty • 1 Pending Activation",
  },
];

export interface UpcomingShiftItem {
  id: string;
  guardName: string;
  initials: string;
  propertyTitle: string;
  gate: string;
  shiftWindow: string;
  dayLabel: "Today" | "Tomorrow";
}

export const MOCK_UPCOMING_SHIFTS: UpcomingShiftItem[] = [
  {
    id: "shift-1",
    guardName: "Mahmud Hasan",
    initials: "MH",
    propertyTitle: "Office Parking, Banani",
    gate: "Gate 1",
    shiftWindow: "2:00 PM – 10:00 PM",
    dayLabel: "Today",
  },
  {
    id: "shift-2",
    guardName: "Tariqul Islam",
    initials: "TI",
    propertyTitle: "Residential Bldg, Gulshan",
    gate: "Gate 2",
    shiftWindow: "8:00 AM – 6:00 PM",
    dayLabel: "Tomorrow",
  },
];

export const GUARD_ACCESS_SCOPE = {
  canAccess: [
    "Assigned property",
    "Assigned gate",
    "Assigned bookings",
    "QR / OTP verification",
    "Vehicle check-in",
    "Active parking sessions",
    "Vehicle check-out",
  ],
  cannotAccess: [
    "Pricing, Earnings & Payouts",
    "Ownership controls & Manager controls",
  ],
};

// ============================================================================
// EARNINGS & PAYOUTS MOCK DATA (STEP 2)
// ============================================================================

export interface DailyEarningPoint {
  date: string;
  dayLabel: string;
  earnings: number;
  baseline: number;
  bookings: number;
}

export const MOCK_DAILY_EARNINGS: DailyEarningPoint[] = [
  { date: "2026-08-15", dayLabel: "Aug 15", earnings: 620, baseline: 580, bookings: 4 },
  { date: "2026-08-18", dayLabel: "Aug 18", earnings: 710, baseline: 650, bookings: 5 },
  { date: "2026-08-21", dayLabel: "Aug 21", earnings: 690, baseline: 620, bookings: 4 },
  { date: "2026-08-24", dayLabel: "Aug 24", earnings: 820, baseline: 700, bookings: 6 },
  { date: "2026-08-27", dayLabel: "Aug 27", earnings: 780, baseline: 710, bookings: 5 },
  { date: "2026-08-30", dayLabel: "Aug 30", earnings: 890, baseline: 750, bookings: 7 },
  { date: "2026-09-02", dayLabel: "Sep 2", earnings: 920, baseline: 800, bookings: 7 },
  { date: "2026-09-05", dayLabel: "Sep 5", earnings: 980, baseline: 820, bookings: 8 },
  { date: "2026-09-08", dayLabel: "Sep 8", earnings: 1050, baseline: 850, bookings: 9 },
  { date: "2026-09-10", dayLabel: "Today", earnings: 990, baseline: 840, bookings: 8 },
];

export interface PropertyEarningsSummary {
  id: string;
  propertyTitle: string;
  location: string;
  code: string;
  badgeBg: string;
  badgeText: string;
  totalBookings: number;
  grossRevenue: number;
  platformFeeRate: number;
  platformFeeAmount: number;
  netOwnerEarnings: number;
  payoutRate: number;
}

export const MOCK_PROPERTY_EARNINGS: PropertyEarningsSummary[] = [
  {
    id: "prop-gulshan-1",
    propertyTitle: "Residential Building, Gulshan",
    location: "Road 45, Gulshan-2",
    code: "RG",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-800",
    totalBookings: 84,
    grossRevenue: 18400,
    platformFeeRate: 10,
    platformFeeAmount: 1840,
    netOwnerEarnings: 16560,
    payoutRate: 90,
  },
  {
    id: "prop-banani-2",
    propertyTitle: "Office Parking, Banani",
    location: "Road 11, Banani",
    code: "OB",
    badgeBg: "bg-sky-100",
    badgeText: "text-sky-800",
    totalBookings: 52,
    grossRevenue: 11700,
    platformFeeRate: 10,
    platformFeeAmount: 1170,
    netOwnerEarnings: 10530,
    payoutRate: 90,
  },
  {
    id: "prop-dhanmondi-3",
    propertyTitle: "Apartment Parking, Dhanmondi",
    location: "Road 27, Dhanmondi",
    code: "AD",
    badgeBg: "bg-purple-100",
    badgeText: "text-purple-800",
    totalBookings: 28,
    grossRevenue: 6200,
    platformFeeRate: 10,
    platformFeeAmount: 620,
    netOwnerEarnings: 5580,
    payoutRate: 90,
  },
];

export interface EarningsTransaction {
  id: string;
  bookingCode: string;
  dateStr: string;
  propertyTitle: string;
  parkingFee: number;
  platformFee: number;
  ownerEarnings: number;
  status: "Settled" | "Pending" | "Refunded";
  paymentMethod: string;
  customerName: string;
}

export const MOCK_EARNINGS_TRANSACTIONS: EarningsTransaction[] = [
  {
    id: "tx-1",
    bookingCode: "#PE-BK-2892",
    dateStr: "Sep 10, 2026",
    propertyTitle: "Residential Building, Gulshan",
    parkingFee: 150,
    platformFee: 15,
    ownerEarnings: 135,
    status: "Settled",
    paymentMethod: "bKash Online",
    customerName: "Arif Hossain",
  },
  {
    id: "tx-2",
    bookingCode: "#PE-BK-2889",
    dateStr: "Sep 10, 2026",
    propertyTitle: "Office Parking, Banani",
    parkingFee: 200,
    platformFee: 20,
    ownerEarnings: 180,
    status: "Settled",
    paymentMethod: "Nagad Gateway",
    customerName: "Nusrat Jahan",
  },
  {
    id: "tx-3",
    bookingCode: "#PE-BK-2884",
    dateStr: "Sep 9, 2026",
    propertyTitle: "Residential Building, Gulshan",
    parkingFee: 180,
    platformFee: 18,
    ownerEarnings: 162,
    status: "Pending",
    paymentMethod: "Visa Card",
    customerName: "Kamal Hossain",
  },
  {
    id: "tx-4",
    bookingCode: "#PE-BK-2879",
    dateStr: "Sep 9, 2026",
    propertyTitle: "Apartment Parking, Dhanmondi",
    parkingFee: 160,
    platformFee: 16,
    ownerEarnings: 144,
    status: "Settled",
    paymentMethod: "bKash Online",
    customerName: "Farhan Ahmed",
  },
];

export interface PayoutTimelineItem {
  id: string;
  title: string;
  amount: number;
  subtext: string;
  status: "UNDER_REVIEW" | "REQUESTED" | "COMPLETED";
}

export const MOCK_PAYOUT_TIMELINE: PayoutTimelineItem[] = [
  {
    id: "payout-1",
    title: "Payout Under Review",
    amount: 6250,
    subtext: "Today • Verification in progress by Admin",
    status: "UNDER_REVIEW",
  },
  {
    id: "payout-2",
    title: "Payout Requested",
    amount: 6250,
    subtext: "Sep 9, 2026 • Batch #PR-8902",
    status: "REQUESTED",
  },
  {
    id: "payout-3",
    title: "Payout Completed",
    amount: 12000,
    subtext: "Sep 5, 2026 • Transferred to BRAC •••• 4821",
    status: "COMPLETED",
  },
];

// ============================================================================
// REVIEWS MOCK DATA (STEP 3)
// ============================================================================

export interface OwnerReview {
  id: string;
  reviewerName: string;
  reviewerInitials: string;
  avatarBg: string;
  avatarText: string;
  rating: number; // 1 to 5
  propertyTitle: string;
  bookingCode: string;
  dateStr: string;
  comment: string;
  status: "Replied" | "Needs Reply";
  isLowRating?: boolean;
  ownerReply?: {
    text: string;
    dateStr: string;
  };
}

export const MOCK_OWNER_REVIEWS: OwnerReview[] = [
  {
    id: "rev-1",
    reviewerName: "Arif Hossain",
    reviewerInitials: "AH",
    avatarBg: "bg-emerald-100",
    avatarText: "text-[#064E3B]",
    rating: 5,
    propertyTitle: "Residential Building, Gulshan",
    bookingCode: "#BK-7892",
    dateStr: "Today",
    comment: "The guard was very helpful and the space was clean. Highly recommended.",
    status: "Replied",
    ownerReply: {
      text: "Thank you for the great review. We're glad you had a smooth parking experience.",
      dateStr: "Today, 2:15 PM",
    },
  },
  {
    id: "rev-2",
    reviewerName: "Sadia Rahman",
    reviewerInitials: "SR",
    avatarBg: "bg-indigo-100",
    avatarText: "text-indigo-800",
    rating: 4,
    propertyTitle: "Office Parking, Banani",
    bookingCode: "#BK-7895",
    dateStr: "Yesterday",
    comment: "Good spot, but the signage from the main road could be a little clearer.",
    status: "Needs Reply",
  },
  {
    id: "rev-3",
    reviewerName: "Tanvir Ahmed",
    reviewerInitials: "TA",
    avatarBg: "bg-rose-100",
    avatarText: "text-rose-800",
    rating: 2,
    propertyTitle: "Office Parking, Banani",
    bookingCode: "#BK-7901",
    dateStr: "Oct 24, 2026",
    comment: "The entrance is extremely tight for an SUV. Another car was parked poorly near the ramp, making it very difficult to maneuver.",
    status: "Needs Reply",
    isLowRating: true,
  },
  {
    id: "rev-4",
    reviewerName: "Farhan Kabir",
    reviewerInitials: "FK",
    avatarBg: "bg-amber-100",
    avatarText: "text-amber-800",
    rating: 5,
    propertyTitle: "Residential Building, Gulshan",
    bookingCode: "#BK-7850",
    dateStr: "Oct 20, 2026",
    comment: "Super smooth automated barrier check-in with the QR code. Guard Arif was very attentive.",
    status: "Replied",
    ownerReply: {
      text: "Thank you Farhan! We strive to make digital parking effortless for everyone.",
      dateStr: "Oct 20, 5:40 PM",
    },
  },
];

export const MOCK_RATING_BREAKDOWN = [
  { stars: 5, count: 98, percentage: 78 },
  { stars: 4, count: 18, percentage: 14 },
  { stars: 3, count: 6, percentage: 5 },
  { stars: 2, count: 3, percentage: 2 },
  { stars: 1, count: 1, percentage: 1 },
];

export interface ReviewActivityItem {
  id: string;
  type: "new_5_star" | "reply_published" | "low_star" | "reported";
  title: string;
  subtext: string;
  dotColor: string;
}

export const MOCK_REVIEW_ACTIVITY: ReviewActivityItem[] = [
  {
    id: "act-rev-1",
    type: "new_5_star",
    title: "New 5–Star Review",
    subtext: "Arif Hossain • 20 mins ago",
    dotColor: "bg-emerald-500",
  },
  {
    id: "act-rev-2",
    type: "reply_published",
    title: "Owner Reply Published",
    subtext: "Sadia Rahman • 45 mins ago",
    dotColor: "bg-blue-500",
  },
  {
    id: "act-rev-3",
    type: "low_star",
    title: "2–Star Review Received",
    subtext: "Tanvir Ahmed • Yesterday",
    dotColor: "bg-amber-500",
  },
  {
    id: "act-rev-4",
    type: "reported",
    title: "Review Reported",
    subtext: "Booking #BK-7864 • 2 days ago",
    dotColor: "bg-rose-500",
  },
];




