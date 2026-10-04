import { bookingGraceWindow } from "../../common/booking-grace.js";

export type TimelineKind =
  | "RESERVATION"
  | "PRESENT"
  | "GRACE"
  | "OVERTIME"
  | "CHECKOUT_REQUESTED"
  | "HOLD"
  | "BLOCKED";
export type TimelineSegment = {
  id: string;
  startAt: string;
  endAt: string;
  kind: TimelineKind;
  label: string;
  bookingId?: string;
  bookingCode?: string;
  driverName?: string;
  plate?: string;
  scheduledStartAt?: string;
  scheduledEndAt?: string;
  checkedInAt?: string | null;
  checkedOutAt?: string | null;
  graceEndAt?: string;
  entryGraceStartsAt?: string;
  overtimePolicyVersion?: number;
  awaitingCheckout?: boolean;
};
export type TimelineAvailability = {
  startAt: string;
  endAt: string;
  availableCapacity: number;
  occupiedCapacity: number;
  label: "Scheduled availability" | "Occupied" | "Closed" | "Blocked";
};

export function dhakaDay(date: string) {
  const start = new Date(`${date}T00:00:00+06:00`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(start.getTime()) ||
    new Date(start.getTime() + 6 * 3600_000).toISOString().slice(0, 10) !== date
  )
    throw new Error("Invalid calendar date");
  return { start, end: new Date(start.getTime() + 86400_000) };
}
export function clipSegment(
  segment: TimelineSegment,
  start: Date,
  end: Date,
): TimelineSegment | null {
  const a = Math.max(+start, Date.parse(segment.startAt)),
    b = Math.min(+end, Date.parse(segment.endAt));
  return a < b
    ? {
        ...segment,
        startAt: new Date(a).toISOString(),
        endAt: new Date(b).toISOString(),
      }
    : null;
}
export function projectAvailability(
  start: Date,
  end: Date,
  capacity: number,
  open: Array<{ start: number; end: number }>,
  occupied: Array<{ start: number; end: number; count: number }>,
  blocked: Array<{ start: number; end: number }> = [],
) {
  const edges = [
    ...new Set(
      [
        +start,
        +end,
        ...open.flatMap((i) => [i.start, i.end]),
        ...occupied.flatMap((i) => [i.start, i.end]),
        ...blocked.flatMap((i) => [i.start, i.end]),
      ].map((n) => Math.max(+start, Math.min(+end, n))),
    ),
  ].sort((a, b) => a - b);
  const result: TimelineAvailability[] = [];
  for (let i = 0; i < edges.length - 1; i++) {
    const a = edges[i]!,
      b = edges[i + 1]!;
    const isBlocked = blocked.some(
      (interval) => interval.start < b && interval.end > a,
    );
    const isOpen = !isBlocked && open.some((j) => j.start <= a && j.end >= b);
    const count = occupied
      .filter((j) => j.start < b && j.end > a)
      .reduce((total, j) => total + j.count, 0);
    const available = isOpen ? Math.max(0, capacity - count) : 0;
    const label = isBlocked
      ? "Blocked"
      : !isOpen
        ? "Closed"
        : available > 0
          ? "Scheduled availability"
          : "Occupied";
    const previous = result.at(-1);
    if (
      previous &&
      previous.endAt === new Date(a).toISOString() &&
      previous.availableCapacity === available &&
      previous.occupiedCapacity === count &&
      previous.label === label
    )
      previous.endAt = new Date(b).toISOString();
    else
      result.push({
        startAt: new Date(a).toISOString(),
        endAt: new Date(b).toISOString(),
        availableCapacity: available,
        occupiedCapacity: count,
        label,
      });
  }
  return result;
}
export function bookingSegments(
  booking: {
    id: string;
    bookingCode: string;
    startAt: Date;
    scheduledEndAt: Date;
    checkedInAt: Date | null;
    checkedOutAt: Date | null;
    checkoutRequestedAt: Date | null;
    overtimeGracePeriodMinutes: number;
    overtimePolicyVersion?: number;
    driver: { fullName: string };
    vehicle: { registrationNumber: string };
  },
  dayEnd: Date,
  now: Date,
): TimelineSegment[] {
  const window = bookingGraceWindow(
    booking.startAt,
    booking.scheduledEndAt,
    booking.overtimeGracePeriodMinutes,
  );
  const grace = window.endAt;
  const base = {
    bookingId: booking.id,
    bookingCode: booking.bookingCode,
    driverName: booking.driver.fullName,
    plate: booking.vehicle.registrationNumber,
    scheduledStartAt: booking.startAt.toISOString(),
    scheduledEndAt: booking.scheduledEndAt.toISOString(),
    checkedInAt: booking.checkedInAt?.toISOString() ?? null,
    checkedOutAt: booking.checkedOutAt?.toISOString() ?? null,
    graceEndAt: grace.toISOString(),
    entryGraceStartsAt: window.startAt.toISOString(),
    overtimePolicyVersion: booking.overtimePolicyVersion ?? 1,
    awaitingCheckout: Boolean(booking.checkedInAt && !booking.checkedOutAt),
  };
  const result: TimelineSegment[] = [];
  const add = (
    suffix: string,
    start: Date,
    end: Date,
    kind: TimelineKind,
    label: string,
  ) => {
    if (+start < +end)
      result.push({
        ...base,
        id: `${booking.id}:${suffix}`,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        kind,
        label,
      });
  };
  if (!booking.checkedInAt) {
    add("entry-grace", window.startAt, booking.startAt, "GRACE", "Entry grace");
    add(
      "reservation",
      booking.startAt,
      booking.scheduledEndAt,
      "RESERVATION",
      "Reserved",
    );
    add(
      "exit-grace",
      booking.scheduledEndAt,
      grace,
      "GRACE",
      "Exit grace · no fine",
    );
    return result;
  }
  add(
    "reservation",
    booking.startAt,
    booking.checkedInAt,
    "RESERVATION",
    "Reserved",
  );
  const actualEnd =
    booking.checkedOutAt ??
    new Date(Math.min(+dayEnd, Math.max(+now, +booking.checkedInAt)));
  add(
    "entry-grace",
    booking.checkedInAt,
    new Date(Math.min(+actualEnd, +booking.startAt)),
    "GRACE",
    "Early entry · no fine",
  );
  add(
    "present",
    new Date(Math.max(+booking.checkedInAt, +booking.startAt)),
    new Date(Math.min(+actualEnd, +booking.scheduledEndAt)),
    "PRESENT",
    "Parked",
  );
  add(
    "grace",
    new Date(Math.max(+booking.checkedInAt, +booking.scheduledEndAt)),
    new Date(Math.min(+actualEnd, +grace)),
    "GRACE",
    "Grace period",
  );
  if (!booking.checkedOutAt && +actualEnd < +grace)
    add(
      "planned-exit-grace",
      new Date(Math.max(+actualEnd, +booking.scheduledEndAt)),
      grace,
      "GRACE",
      "Exit grace · no fine",
    );
  add(
    "overtime",
    new Date(Math.max(+booking.checkedInAt, +grace)),
    actualEnd,
    "OVERTIME",
    "Overtime",
  );
  if (booking.checkoutRequestedAt)
    add(
      "checkout",
      booking.checkoutRequestedAt,
      booking.checkedOutAt ?? dayEnd,
      "CHECKOUT_REQUESTED",
      "Checkout requested",
    );
  if (!booking.checkedOutAt)
    add(
      "uncertain",
      new Date(Math.max(+now, +booking.checkedInAt)),
      dayEnd,
      "BLOCKED",
      "Awaiting checkout",
    );
  return result;
}
