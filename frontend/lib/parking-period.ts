export function isValidParkingPeriod(startAt: string, endAt: string): boolean {
  const start = Date.parse(startAt);
  const end = Date.parse(endAt);
  return Number.isFinite(start) && Number.isFinite(end) && end > start;
}

export function isCheckoutLocked(context: {
  hasQuote: boolean;
  hasHold: boolean;
  hasBooking: boolean;
  quotePending: boolean;
}): boolean {
  return context.hasQuote || context.hasHold || context.hasBooking || context.quotePending;
}
