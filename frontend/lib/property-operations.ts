type Resource = {
  id: string;
  capacity: number;
  status: string;
  resourceType: string;
  units?: Array<{ id: string; status: string }>;
};
type Booking = {
  parkingSpotId: string;
  status: string;
  startAt: string;
};

export function propertyOperations<T extends Booking>(resources: Resource[], bookings: T[], now = new Date()) {
  const occupiedBookings = bookings.filter((b) => ["CHECKED_IN", "CHECKOUT_REQUESTED"].includes(b.status));
  const totalSpaces = resources.reduce((sum, r) => sum + r.capacity, 0);
  const activeCapacity = resources.reduce((sum, r) => {
    if (r.status !== "ACTIVE") return sum;
    return sum + (r.resourceType === "FIXED_SPACE" && r.units
      ? r.units.filter((unit) => unit.status === "ACTIVE").length
      : r.capacity);
  }, 0);
  const occupied = occupiedBookings.length;
  const available = Math.max(0, activeCapacity - occupied);
  const date = (value: Date) => value.toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
  const today = date(now);
  const todayBookings = bookings.filter((b) => date(new Date(b.startAt)) === today);
  const activeReservations = bookings.filter((b) => ["CONFIRMED", "CHECKED_IN", "CHECKOUT_REQUESTED", "PAYMENT_DUE"].includes(b.status)).length;
  return { totalSpaces, activeCapacity, occupied, available, todayBookings, activeReservations,
    vacancyPercent: activeCapacity ? Math.round(available / activeCapacity * 100) : 0 };
}
