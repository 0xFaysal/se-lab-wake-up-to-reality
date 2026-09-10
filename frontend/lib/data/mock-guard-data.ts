import { GuardProfile, GuardStats, UpcomingArrival, CurrentlyParkedSession } from "@/features/guard/types";

export const MOCK_GUARD_PROFILE: GuardProfile = {
  id: "GD-8841",
  name: "Rahim Uddin",
  role: "SECURITY GUARD",
  shift: "8:00 AM – 6:00 PM",
  gate: "Gate 2",
  location: "Gulshan Avenue Parking • Gate 2",
  avatarUrl: "/assets/avatar-guard.jpg",
  isOnDuty: true,
};

export const MOCK_GUARD_STATS: GuardStats = {
  upcomingToday: 3,
  checkedIn: 2,
  completedToday: 5,
};

export const MOCK_UPCOMING_ARRIVALS: UpcomingArrival[] = [
  {
    id: "PE-BK-2058",
    bookingCode: "#PE-BK-2058",
    time: "10:30 AM",
    timeEstimate: "Next in 18 min",
    slot: "Slot B-08",
    vehicleModel: "Honda Vezel",
    vehicleColor: "White",
    vehiclePlate: "DHAKA METRO-GHA-11-2345",
    driverName: "Farhan Karim",
    driverPhone: "+880 17XX-XXXXXX",
  },
  {
    id: "PE-BK-2059",
    bookingCode: "#PE-BK-2059",
    time: "11:15 AM",
    timeEstimate: "In 1 hour",
    slot: "Slot B-12",
    vehicleModel: "Toyota Premio",
    vehicleColor: "Silver",
    vehiclePlate: "DHAKA METRO-GA-45-7890",
    driverName: "Tanvir Hasan",
    driverPhone: "+880 18XX-XXXXXX",
  },
  {
    id: "PE-BK-2060",
    bookingCode: "#PE-BK-2060",
    time: "12:00 PM",
    timeEstimate: "In 1h 45m",
    slot: "Slot A-04",
    vehicleModel: "Hyundai Tucson",
    vehicleColor: "Black",
    vehiclePlate: "DHAKA METRO-DHA-67-1122",
    driverName: "Nusrat Jahan",
    driverPhone: "+880 19XX-XXXXXX",
  },
];

export const MOCK_CURRENTLY_PARKED: CurrentlyParkedSession[] = [
  {
    id: "PE-BK-2051",
    bookingCode: "#PE-BK-2051",
    driverName: "Farhan Karim",
    driverPhone: "+880 17XX-XXXXXX",
    vehicleModel: "Honda Vezel",
    vehicleColor: "White",
    vehiclePlate: "DHAKA METRO-GHA-23-4567",
    assignedSlot: "B-08",
    entranceGate: "Gate 2",
    entryTime: "10:02 AM",
    expectedExit: "01:30 PM",
    durationElapsed: "00h 28m",
  },
  {
    id: "PE-BK-2048",
    bookingCode: "#PE-BK-2048",
    driverName: "Sadman Sakib",
    driverPhone: "+880 16XX-XXXXXX",
    vehicleModel: "Toyota Allion",
    vehicleColor: "Pearl White",
    vehiclePlate: "DHAKA METRO-CHA-89-9912",
    assignedSlot: "B-03",
    entranceGate: "Gate 2",
    entryTime: "09:15 AM",
    expectedExit: "12:15 PM",
    durationElapsed: "01h 15m",
  },
];
