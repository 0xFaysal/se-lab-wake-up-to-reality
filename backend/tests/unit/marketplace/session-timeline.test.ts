import test from "node:test";
import assert from "node:assert/strict";
import {
  bookingGraceWindow,
  canEnterBooking,
} from "../../../src/common/booking-grace.js";
import { sessionTimelineSchema } from "../../../src/modules/marketplace/marketplace.schema.js";
import {
  bookingSegments,
  clipSegment,
  dhakaDay,
  projectAvailability,
} from "../../../src/modules/marketplace/session-timeline.model.js";
const { start, end } = dhakaDay("2026-10-04");
const at = (hour: number) => new Date(+start + hour * 3600_000);
const base = {
  id: "qa-booking",
  bookingCode: "QA",
  startAt: at(10),
  scheduledEndAt: at(12),
  checkedInAt: at(10),
  checkedOutAt: null,
  checkoutRequestedAt: null,
  overtimeGracePeriodMinutes: 15,
  driver: { fullName: "QA Driver" },
  vehicle: { registrationNumber: "QA-ONLY" },
};
test("QR entry opens exactly five minutes before arrival and closes after scheduled end", () => {
  assert.equal(
    canEnterBooking(
      new Date(+base.startAt - 300001),
      base.startAt,
      base.scheduledEndAt,
    ),
    false,
  );
  assert.equal(
    canEnterBooking(
      new Date(+base.startAt - 300000),
      base.startAt,
      base.scheduledEndAt,
    ),
    true,
  );
  assert.equal(
    canEnterBooking(base.scheduledEndAt, base.startAt, base.scheduledEndAt),
    true,
  );
  assert.equal(
    canEnterBooking(
      new Date(+base.scheduledEndAt + 1),
      base.startAt,
      base.scheduledEndAt,
    ),
    false,
  );
  const window = bookingGraceWindow(start, at(1));
  assert.equal(window.startAt.toISOString(), "2026-10-03T17:55:00.000Z");
  assert.equal(+window.endAt - +at(1), 300000);
});
test("future reservations display entry and exit grace before check-in", () => {
  const segments = bookingSegments(
    {
      ...base,
      checkedInAt: null,
      overtimeGracePeriodMinutes: 5,
      overtimePolicyVersion: 2,
    },
    end,
    at(8),
  );
  const grace = segments.filter((segment) => segment.kind === "GRACE");
  assert.equal(grace.length, 2);
  assert.equal(grace[0]?.startAt, new Date(+at(10) - 300000).toISOString());
  assert.equal(grace[1]?.endAt, new Date(+at(12) + 300000).toISOString());
});
test("timeline query requires a valid property UUID and real calendar date", () => {
  const query = {
    propertyId: "7ab5e404-a6a4-4805-89e4-8d3c3ebea0a1",
    date: "2026-10-04",
  };
  assert.equal(sessionTimelineSchema.safeParse({ query }).success, true);
  assert.equal(
    sessionTimelineSchema.safeParse({
      query: { ...query, propertyId: "other-provider" },
    }).success,
    false,
  );
  assert.equal(
    sessionTimelineSchema.safeParse({ query: { ...query, date: "2026-02-30" } })
      .success,
    false,
  );
});
test("Dhaka day bounds and calendar validation", () => {
  assert.equal(start.toISOString(), "2026-10-03T18:00:00.000Z");
  assert.equal(+end - +start, 86400_000);
  assert.throws(() => dhakaDay("2026-02-30"));
});
test("blocked exceptions are distinct from closed hours and cannot claim capacity", () => {
  const intervals = projectAvailability(
    start,
    end,
    2,
    [{ start: +at(8), end: +at(22) }],
    [],
    [{ start: +at(10), end: +at(12) }],
  );
  const blocked = intervals.find((interval) => interval.label === "Blocked");
  assert.equal(blocked?.availableCapacity, 0);
  assert.equal(blocked?.startAt, at(10).toISOString());
  assert.equal(intervals[0]?.label, "Closed");
});
test("midnight clipping keeps half-open adjacent reservations", () => {
  const s = {
    id: "qa",
    startAt: at(-1).toISOString(),
    endAt: at(1).toISOString(),
    kind: "RESERVATION" as const,
    label: "Reserved",
  };
  assert.equal(clipSegment(s, start, end)?.startAt, start.toISOString());
  assert.equal(
    clipSegment(
      { ...s, startAt: end.toISOString(), endAt: at(25).toISOString() },
      start,
      end,
    ),
    null,
  );
});
test("zero grace immediately becomes overtime", () => {
  const segments = bookingSegments(
    { ...base, overtimeGracePeriodMinutes: 0 },
    end,
    at(13),
  );
  assert.equal(
    segments.some((s) => s.kind === "GRACE"),
    false,
  );
  assert.equal(
    segments.find((s) => s.kind === "OVERTIME")?.startAt,
    at(12).toISOString(),
  );
});
test("stored grace boundary is independent of current resource policy", () => {
  const segments = bookingSegments(base, end, at(13));
  assert.equal(
    segments.find((s) => s.kind === "GRACE")?.endAt,
    at(12.25).toISOString(),
  );
});
test("missing checkout stays occupied through the displayed day", () => {
  const segments = bookingSegments(base, end, at(13));
  assert.equal(
    segments.find((s) => s.label === "Awaiting checkout")?.endAt,
    end.toISOString(),
  );
  assert.ok(segments.every((s) => s.awaitingCheckout));
});
test("actual checkout ends the uncertain interval", () => {
  assert.equal(
    bookingSegments({ ...base, checkedOutAt: at(11) }, end, at(13)).some(
      (s) => s.label === "Awaiting checkout",
    ),
    false,
  );
});
test("shared pool occupancy preserves capacity and adjacency", () => {
  const intervals = projectAvailability(
    start,
    end,
    3,
    [{ start: +start, end: +end }],
    [
      { start: +at(10), end: +at(12), count: 2 },
      { start: +at(12), end: +at(14), count: 1 },
    ],
  );
  assert.equal(
    intervals.find((s) => s.startAt === at(10).toISOString())
      ?.availableCapacity,
    1,
  );
  assert.equal(
    intervals.find((s) => s.startAt === at(12).toISOString())
      ?.availableCapacity,
    2,
  );
});
test("closed and blocked intervals never claim free capacity", () => {
  const intervals = projectAvailability(
    start,
    end,
    1,
    [
      { start: +at(8), end: +at(12) },
      { start: +at(13), end: +at(18) },
    ],
    [],
  );
  assert.equal(
    intervals.find((s) => s.startAt === at(12).toISOString())?.label,
    "Closed",
  );
});
test("capacity is clamped rather than inventing negative free spots", () => {
  const intervals = projectAvailability(
    start,
    end,
    1,
    [{ start: +start, end: +end }],
    [{ start: +start, end: +end, count: 3 }],
  );
  assert.equal(intervals[0]?.availableCapacity, 0);
  assert.equal(intervals[0]?.occupiedCapacity, 3);
});
