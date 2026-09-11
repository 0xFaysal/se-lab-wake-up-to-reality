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
