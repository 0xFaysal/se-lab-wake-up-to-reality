export type AvailabilityWindow = {
  dayOfWeek: number;
  startLocalTime: string;
  endLocalTime: string;
  validFrom: string;
  validUntil?: string;
};

export function availabilityEditorError(windows: AvailabilityWindow[]): string | null {
  if (windows.length > 50) return "A schedule can contain at most 50 windows.";
  const clock = /^([01]\d|2[0-3]):[0-5]\d$/;
  const date = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(`${value}T00:00:00Z`))
    && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
  for (const window of windows) {
    if (!Number.isInteger(window.dayOfWeek) || window.dayOfWeek < 0 || window.dayOfWeek > 6) return "Choose a valid weekday.";
    if (!clock.test(window.startLocalTime) || !clock.test(window.endLocalTime)
      || window.endLocalTime <= window.startLocalTime) return "Each closing time must be later than its opening time.";
    if (!date(window.validFrom) || (window.validUntil && !date(window.validUntil))) return "Choose valid calendar dates for every window.";
    if (window.validUntil && window.validUntil < window.validFrom) return "An end date cannot be earlier than its start date.";
  }
  return null;
}

export function availabilityWindowInput(window: AvailabilityWindow): AvailabilityWindow {
  return { dayOfWeek: window.dayOfWeek, startLocalTime: window.startLocalTime,
    endLocalTime: window.endLocalTime, validFrom: window.validFrom.slice(0, 10),
    ...(window.validUntil ? { validUntil: window.validUntil.slice(0, 10) } : {}) };
}
