import { Booking, Vehicle } from "@/types/driver";

export const MOCK_DRIVER_PROFILE = {
  name: "Anisa Rahman",
  email: "anisa.rahman@example.com",
  phone: "+880 1712-345678",
  avatarUrl: "/assets/avatar-anisa.jpg",
};

export const MOCK_VEHICLES: Vehicle[] = [
  {
    id: "v-1",
    name: "Toyota Corolla",
    brand: "Toyota",
    model: "Corolla",
    registrationNumber: "Dhaka Metro GA 12-3456",
    type: "SEDAN",
    color: "White",
    year: "2022",
    isDefault: true,
  },
  {
    id: "v-2",
    name: "Honda Vezel",
    brand: "Honda",
    model: "Vezel",
    registrationNumber: "Dhaka Metro GHA 18-9021",
    type: "SUV",
    color: "Pearl White",
    year: "2023",
    isDefault: false,
  },
];

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: "PKBD-2026-1027-1842",
    propertyTitle: "Gulshan Residential Parking",
    address: "Road 12, Block E, Gulshan 1, Dhaka",
    area: "Gulshan 1",
    spotNumber: "Spot #B-04",
    date: "Oct 27, 2026",
    startTime: "10:00 AM",
    endTime: "4:00 PM",
    durationHours: 6,
    status: "CONFIRMED",
    accessOtp: "482731",
    imageThumbnail: "/assets/safety-garage.jpg",
    entranceInstructions:
      "Enter through Gate 2 beside Road 12 and follow the ParkEase BD parking sign.",
    vehicle: {
      name: "Toyota Corolla",
      type: "Sedan",
      registrationNumber: "Dhaka Metro GA 12-3456",
    },
    payment: {
      baseFee: 360,
      durationHours: 6,
      serviceFee: 20,
      vatAmount: 36,
      totalPaid: 416,
      paymentMethod: "bKash",
      isPaid: true,
    },
    timeline: [
      {
        id: "step-1",
        title: "Reserved",
        timestamp: "Oct 25, 2:30 PM",
        status: "COMPLETED",
      },
      {
        id: "step-2",
        title: "Payment Confirmed",
        timestamp: "Oct 25, 2:32 PM",
        status: "COMPLETED",
      },
      {
        id: "step-3",
        title: "Access Generated",
        timestamp: "Oct 25, 2:32 PM",
        status: "COMPLETED",
      },
      {
        id: "step-4",
        title: "Upcoming Arrival",
        timestamp: "Scheduled: Oct 27, 10:00 AM",
        status: "CURRENT",
      },
      {
        id: "step-5",
        title: "Guard Verification",
        timestamp: "Pending",
        status: "PENDING",
      },
      {
        id: "step-6",
        title: "Parking Entry",
        timestamp: "Pending",
        status: "PENDING",
      },
    ],
  },
  {
    id: "PKBD-2026-1102-4501",
    propertyTitle: "Banani Plaza Underground",
    address: "Road 11, Block D, Banani, Dhaka",
    area: "Banani",
    spotNumber: "Spot #U-12",
    date: "Nov 02, 2026",
    startTime: "02:00 PM",
    endTime: "06:00 PM",
    durationHours: 4,
    status: "CONFIRMED",
    accessOtp: "918234",
    imageThumbnail: "/assets/garage-entrance.jpg",
    entranceInstructions:
      "Proceed to basement ramp B1. Show OTP to security guard at barrier gate.",
    vehicle: {
      name: "Toyota Corolla",
      type: "Sedan",
      registrationNumber: "Dhaka Metro GA 12-3456",
    },
    payment: {
      baseFee: 400,
      durationHours: 4,
      serviceFee: 20,
      vatAmount: 30,
      totalPaid: 450,
      paymentMethod: "bKash",
      isPaid: true,
    },
    timeline: [
      { id: "step-1", title: "Reserved", timestamp: "Oct 26, 11:15 AM", status: "COMPLETED" },
      { id: "step-2", title: "Payment Confirmed", timestamp: "Oct 26, 11:16 AM", status: "COMPLETED" },
      { id: "step-3", title: "Access Generated", timestamp: "Oct 26, 11:16 AM", status: "COMPLETED" },
      { id: "step-4", title: "Upcoming Arrival", timestamp: "Scheduled: Nov 02, 02:00 PM", status: "CURRENT" },
      { id: "step-5", title: "Guard Verification", timestamp: "Pending", status: "PENDING" },
      { id: "step-6", title: "Parking Entry", timestamp: "Pending", status: "PENDING" },
    ],
  },
  {
    id: "PKBD-2026-1108-8002",
    propertyTitle: "Dhanmondi Residential Parking",
    address: "Road 27, House 42, Dhanmondi, Dhaka",
    area: "Dhanmondi",
    spotNumber: "Spot #A-02",
    date: "Nov 08, 2026",
    startTime: "09:00 AM",
    endTime: "05:00 PM",
    durationHours: 8,
    status: "CONFIRMED",
    accessOtp: "329841",
    imageThumbnail: "/assets/safety-garage.jpg",
    entranceInstructions:
      "South gate entrance. Building guard on duty will verify vehicle registration plate.",
    vehicle: {
      name: "Honda Vezel",
      type: "SUV",
      registrationNumber: "Dhaka Metro GHA 18-9021",
    },
    payment: {
      baseFee: 720,
      durationHours: 8,
      serviceFee: 25,
      vatAmount: 55,
      totalPaid: 800,
      paymentMethod: "bKash",
      isPaid: true,
    },
    timeline: [
      { id: "step-1", title: "Reserved", timestamp: "Oct 26, 04:40 PM", status: "COMPLETED" },
      { id: "step-2", title: "Payment Confirmed", timestamp: "Oct 26, 04:42 PM", status: "COMPLETED" },
      { id: "step-3", title: "Access Generated", timestamp: "Oct 26, 04:42 PM", status: "COMPLETED" },
      { id: "step-4", title: "Upcoming Arrival", timestamp: "Scheduled: Nov 08, 09:00 AM", status: "CURRENT" },
      { id: "step-5", title: "Guard Verification", timestamp: "Pending", status: "PENDING" },
      { id: "step-6", title: "Parking Entry", timestamp: "Pending", status: "PENDING" },
    ],
  },
  {
    id: "PKBD-2026-1014-3200",
    propertyTitle: "Uttara Sector 3 Covered Bay",
    address: "Road 7, Sector 3, Uttara, Dhaka",
    area: "Uttara",
    spotNumber: "Spot #C-01",
    date: "Oct 14, 2026",
    startTime: "11:00 AM",
    endTime: "03:00 PM",
    durationHours: 4,
    status: "COMPLETED",
    accessOtp: "774129",
    imageThumbnail: "/assets/garage-entrance.jpg",
    entranceInstructions: "North gate entry. Ramp down to slot C-01.",
    vehicle: {
      name: "Toyota Corolla",
      type: "Sedan",
      registrationNumber: "Dhaka Metro GA 12-3456",
    },
    payment: {
      baseFee: 280,
      durationHours: 4,
      serviceFee: 15,
      vatAmount: 25,
      totalPaid: 320,
      paymentMethod: "bKash",
      isPaid: true,
    },
    timeline: [
      { id: "step-1", title: "Reserved", timestamp: "Oct 14, 10:30 AM", status: "COMPLETED" },
      { id: "step-2", title: "Payment Confirmed", timestamp: "Oct 14, 10:31 AM", status: "COMPLETED" },
      { id: "step-3", title: "Access Generated", timestamp: "Oct 14, 10:31 AM", status: "COMPLETED" },
      { id: "step-4", title: "Driver Arrived", timestamp: "Oct 14, 11:05 AM", status: "COMPLETED" },
      { id: "step-5", title: "Guard Verified", timestamp: "Oct 14, 11:06 AM", status: "COMPLETED" },
      { id: "step-6", title: "Completed & Exited", timestamp: "Oct 14, 03:00 PM", status: "COMPLETED" },
    ],
  },
];

export interface PaymentTransaction {
  id: string;
  date: string;
  purpose: "Initial Booking" | "Session Extension" | "Overstay Fee";
  bookingId: string;
  propertyTitle: string;
  gateway: string;
  amount: number;
  status: "Validated" | "Pending" | "Failed";
  receiptNumber: string;
}

export interface RefundTransaction {
  id: string;
  date: string;
  reason: "Security Deposit Return" | "Booking Cancellation" | "Overcharge Adjustment";
  bookingId: string;
  propertyTitle: string;
  originalPayment: string;
  amount: number;
  status: "Refunded" | "Processing" | "Manual Review";
  transactionRef: string;
}

export const MOCK_PAYMENT_TRANSACTIONS: PaymentTransaction[] = [
  {
    id: "TXN-2026-1027-01",
    date: "Oct 27, 2026 • 10:02 AM",
    purpose: "Initial Booking",
    bookingId: "PKBD-2026-1027-1842",
    propertyTitle: "Gulshan Residential Parking",
    gateway: "SSLCOMMERZ (bKash)",
    amount: 480,
    status: "Validated",
    receiptNumber: "RCP-884102",
  },
  {
    id: "TXN-2026-1026-02",
    date: "Oct 26, 2026 • 04:42 PM",
    purpose: "Initial Booking",
    bookingId: "PKBD-2026-1026-7731",
    propertyTitle: "Banani Prime Basement",
    gateway: "SSLCOMMERZ (Visa •••• 4242)",
    amount: 220,
    status: "Validated",
    receiptNumber: "RCP-883921",
  },
  {
    id: "TXN-2026-1022-03",
    date: "Oct 22, 2026 • 06:15 PM",
    purpose: "Overstay Fee",
    bookingId: "PKBD-2026-0922-0914",
    propertyTitle: "Dhanmondi Lakeview Garage",
    gateway: "SSLCOMMERZ (bKash)",
    amount: 120,
    status: "Pending",
    receiptNumber: "RCP-882194",
  },
  {
    id: "TXN-2026-1014-04",
    date: "Oct 14, 2026 • 10:31 AM",
    purpose: "Initial Booking",
    bookingId: "PKBD-2026-1014-3200",
    propertyTitle: "Uttara Sector 3 Covered Bay",
    gateway: "SSLCOMMERZ (bKash)",
    amount: 320,
    status: "Validated",
    receiptNumber: "RCP-880150",
  },
  {
    id: "TXN-2026-1014-05",
    date: "Oct 14, 2026 • 02:45 PM",
    purpose: "Session Extension",
    bookingId: "PKBD-2026-1014-3200",
    propertyTitle: "Uttara Sector 3 Covered Bay",
    gateway: "SSLCOMMERZ (bKash)",
    amount: 70,
    status: "Validated",
    receiptNumber: "RCP-880211",
  },
];

export const MOCK_REFUND_TRANSACTIONS: RefundTransaction[] = [
  {
    id: "REF-2026-1028-01",
    date: "Oct 28, 2026 • 04:15 PM",
    reason: "Security Deposit Return",
    bookingId: "PKBD-2026-1027-1842",
    propertyTitle: "Gulshan Residential Parking",
    originalPayment: "bKash (+880 1712-***678)",
    amount: 100,
    status: "Processing",
    transactionRef: "RF-BK-918231",
  },
  {
    id: "REF-2026-1015-02",
    date: "Oct 15, 2026 • 11:30 AM",
    reason: "Security Deposit Return",
    bookingId: "PKBD-2026-1014-3200",
    propertyTitle: "Uttara Sector 3 Covered Bay",
    originalPayment: "bKash (+880 1712-***678)",
    amount: 100,
    status: "Refunded",
    transactionRef: "RF-BK-772914",
  },
  {
    id: "REF-2026-1002-03",
    date: "Oct 02, 2026 • 09:20 AM",
    reason: "Booking Cancellation",
    bookingId: "PKBD-2026-1002-1102",
    propertyTitle: "Mohakhali Commercial Hub Bay",
    originalPayment: "Visa (•••• 4242)",
    amount: 360,
    status: "Refunded",
    transactionRef: "RF-VS-441829",
  },
  {
    id: "REF-2026-0925-04",
    date: "Sep 25, 2026 • 02:10 PM",
    reason: "Overcharge Adjustment",
    bookingId: "PKBD-2026-0925-8821",
    propertyTitle: "Bashundhara Gate 1 Parking",
    originalPayment: "bKash (+880 1712-***678)",
    amount: 50,
    status: "Manual Review",
    transactionRef: "RF-MR-109284",
  },
];

