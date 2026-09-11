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
