export const BOOKING_GRACE_MINUTES = 5;
export const OVERTIME_POLICY_VERSION = 2;
export const CHECKOUT_GRACE_MINUTES = 2;
export const ENTRY_GRACE_MS = BOOKING_GRACE_MINUTES * 60_000;

export function bookingGraceWindow(
  startAt: Date,
  endAt: Date,
  exitGraceMinutes = BOOKING_GRACE_MINUTES,
) {
  return {
    startAt: new Date(+startAt - ENTRY_GRACE_MS),
    endAt: new Date(+endAt + exitGraceMinutes * 60_000),
  };
}

export function canEnterBooking(now: Date, startAt: Date, endAt: Date) {
  return +now >= +startAt - ENTRY_GRACE_MS && +now <= +endAt;
}
