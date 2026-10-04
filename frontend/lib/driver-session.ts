type SessionBooking = { id: string; status: string; startAt: string; scheduledEndAt: string };

export function driverSessionBookings<T extends SessionBooking>(bookings: T[], now: number): T[] {
  const parked = (booking: T) => ["CHECKED_IN", "CHECKOUT_REQUESTED"].includes(booking.status);
  return bookings.filter((booking) => parked(booking) || (booking.status === "CONFIRMED" && Date.parse(booking.scheduledEndAt) > now))
    .sort((a, b) => Number(parked(b)) - Number(parked(a)) || Date.parse(a.startAt) - Date.parse(b.startAt) || a.id.localeCompare(b.id));
}

export function bookingDirectionsUrl(location: { latitude: number; longitude: number } | null | undefined): string | null {
  if (!location || !Number.isFinite(location.latitude) || !Number.isFinite(location.longitude) || Math.abs(location.latitude) > 90 || Math.abs(location.longitude) > 180) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${location.latitude},${location.longitude}`)}&travelmode=driving`;
}
