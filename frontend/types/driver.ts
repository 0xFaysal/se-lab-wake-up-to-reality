export type BookingStatus =
  | "CONFIRMED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED";

export type VehicleCategory =
  | "SEDAN"
  | "SUV"
  | "MOTORCYCLE"
  | "MICROBUS";

export interface Vehicle {
  id: string;
  name: string;
  brand: string;
  model: string;
  registrationNumber: string;
  type: VehicleCategory;
  color: string;
  year?: string;
  isDefault: boolean;
}

export interface PaymentSummary {
  baseFee: number;
  durationHours: number;
  serviceFee: number;
  vatAmount: number;
  totalPaid: number;
  paymentMethod: "bKash" | "Nagad" | "Card" | "SSLCOMMERZ";
  isPaid: boolean;
}

export interface TimelineStep {
  id: string;
  title: string;
  timestamp?: string;
  status: "COMPLETED" | "CURRENT" | "PENDING";
  description?: string;
}

export interface Booking {
  id: string;
  propertyTitle: string;
  address: string;
  area: string;
  spotNumber: string;
  date: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  status: BookingStatus;
  accessOtp: string;
  qrCodeUrl?: string;
  imageThumbnail: string;
  entranceInstructions: string;
  vehicle: {
    name: string;
    type: string;
    registrationNumber: string;
  };
  payment: PaymentSummary;
  timeline: TimelineStep[];
}
