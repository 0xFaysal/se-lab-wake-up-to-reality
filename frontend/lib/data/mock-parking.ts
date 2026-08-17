export type VehicleType = "MOTORCYCLE" | "SEDAN" | "SUV" | "MICROBUS";

export interface MockParkingSpot {
  id: string;
  propertyName: string;
  area: string;
  latitude: number;
  longitude: number;
  hourlyRate: number; // in BDT
  vehicleTypes: VehicleType[];
  facilities: {
    covered: boolean;
    cctv: boolean;
    guard: boolean;
  };
  rating: number;
  reviewCount: number;
  distance: string; // pre-calculated display string
  available: boolean;
  imageUrl: string;
}

export const MOCK_PARKING_SPOTS: MockParkingSpot[] = [
  {
    id: "spot-dhanmondi-01",
    propertyName: "Dhanmondi Lake View Parking",
    area: "Dhanmondi, Road 27",
    latitude: 23.7461,
    longitude: 90.3742,
    hourlyRate: 60,
    vehicleTypes: ["SEDAN", "SUV", "MOTORCYCLE"],
    facilities: { covered: true, cctv: true, guard: true },
    rating: 4.5,
    reviewCount: 28,
    distance: "0.8 km",
    available: true,
    imageUrl: "/images/placeholders/parking-1.jpg",
  },
  {
    id: "spot-gulshan-01",
    propertyName: "Gulshan Circle-1 Residence Parking",
    area: "Gulshan-1, Road 103",
    latitude: 23.7925,
    longitude: 90.4078,
    hourlyRate: 80,
    vehicleTypes: ["SEDAN", "SUV", "MICROBUS"],
    facilities: { covered: true, cctv: true, guard: true },
    rating: 4.8,
    reviewCount: 45,
    distance: "1.2 km",
    available: true,
    imageUrl: "/images/placeholders/parking-2.jpg",
  },
  {
    id: "spot-banani-01",
    propertyName: "Banani Chairmanbari Parking",
    area: "Banani, Road 11",
    latitude: 23.7937,
    longitude: 90.4023,
    hourlyRate: 50,
    vehicleTypes: ["MOTORCYCLE", "SEDAN"],
    facilities: { covered: false, cctv: true, guard: false },
    rating: 4.1,
    reviewCount: 12,
    distance: "2.1 km",
    available: true,
    imageUrl: "/images/placeholders/parking-3.jpg",
  },
  {
    id: "spot-uttara-01",
    propertyName: "Uttara Sector-7 Secure Parking",
    area: "Uttara, Sector 7",
    latitude: 23.8759,
    longitude: 90.3795,
    hourlyRate: 40,
    vehicleTypes: ["MOTORCYCLE", "SEDAN", "SUV"],
    facilities: { covered: true, cctv: false, guard: true },
    rating: 4.3,
    reviewCount: 19,
    distance: "5.4 km",
    available: false,
    imageUrl: "/images/placeholders/parking-4.jpg",
  },
];

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  MOTORCYCLE: "Motorcycle",
  SEDAN: "Sedan / Car",
  SUV: "SUV / Pickup",
  MICROBUS: "Microbus / Van",
};
