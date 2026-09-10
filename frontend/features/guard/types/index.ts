export interface GuardProfile {
  id: string;
  name: string;
  role: string;
  shift: string;
  gate: string;
  location: string;
  avatarUrl: string;
  isOnDuty: boolean;
}

export interface GuardStats {
  upcomingToday: number;
  checkedIn: number;
  completedToday: number;
}

export interface UpcomingArrival {
  id: string;
  bookingCode: string;
  time: string;
  timeEstimate: string;
  slot: string;
  vehicleModel: string;
  vehicleColor: string;
  vehiclePlate: string;
  driverName: string;
  driverPhone: string;
}

export interface CurrentlyParkedSession {
  id: string;
  bookingCode: string;
  driverName: string;
  driverPhone: string;
  vehicleModel: string;
  vehicleColor: string;
  vehiclePlate: string;
  assignedSlot: string;
  entranceGate: string;
  entryTime: string;
  expectedExit: string;
  durationElapsed: string;
}
