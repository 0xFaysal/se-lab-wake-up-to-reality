import test from "node:test";
import assert from "node:assert/strict";
import {
  dhakaDate,
  nextSevenDates,
  timelinePosition,
  sessionLanes,
  timelineClock,
  timelineHour,
  graceDuration,
} from "../lib/provider-session-display.ts";
test("timeline uses Dhaka AM/PM including noon and midnight", () => {
  assert.equal(timelineClock("2026-10-03T18:00:00Z"), "12:00 AM");
  assert.equal(timelineClock("2026-10-04T06:00:00Z"), "12:00 PM");
  assert.equal(timelineClock("2026-10-04T08:00:00Z"), "2:00 PM");
  assert.equal(timelineHour("2026-10-04T08:00:00Z"), "2 PM");
  assert.equal(timelineHour("2026-10-04T18:00:00Z"), "12 AM");
});
test("grace durations reflect saved terms and equal durations have equal proportional widths", () => {
  assert.equal(
    graceDuration("2026-10-04T07:55:00Z", "2026-10-04T08:00:00Z"),
    5,
  );
  assert.equal(
    graceDuration("2026-10-04T11:00:00Z", "2026-10-04T11:15:00Z"),
    15,
  );
  assert.equal(graceDuration(undefined, "2026-10-04T11:15:00Z"), null);
  const bounds = ["2026-10-03T18:00:00Z", "2026-10-04T18:00:00Z"];
  assert.equal(
    timelinePosition("2026-10-04T07:55:00Z", "2026-10-04T08:00:00Z", ...bounds)
      .width,
    timelinePosition("2026-10-04T11:00:00Z", "2026-10-04T11:05:00Z", ...bounds)
      .width,
  );
});
test("Dhaka calendar rolls across UTC midnight correctly", () => {
  assert.equal(dhakaDate(new Date("2026-10-03T19:00:00Z")), "2026-10-04");
  assert.deepEqual(nextSevenDates("2026-12-29"), [
    "2026-12-29",
    "2026-12-30",
    "2026-12-31",
    "2027-01-01",
    "2027-01-02",
    "2027-01-03",
    "2027-01-04",
  ]);
});
test("timeline coordinates remain stable for adjacent segments", () => {
  assert.deepEqual(
    timelinePosition(
      "2026-10-04T06:00:00Z",
      "2026-10-04T12:00:00Z",
      "2026-10-04T00:00:00Z",
      "2026-10-05T00:00:00Z",
    ),
    { left: "25%", width: "25%" },
  );
});
test("concurrent shared-pool cars occupy separate lanes, adjacent stays reuse lanes", () => {
  const lanes = sessionLanes([
    { startAt: "2026-10-04T06:00Z", endAt: "2026-10-04T08:00Z" },
    { startAt: "2026-10-04T07:00Z", endAt: "2026-10-04T09:00Z" },
    { startAt: "2026-10-04T08:00Z", endAt: "2026-10-04T10:00Z" },
  ]);
  assert.deepEqual(
    lanes.map((item) => item.lane),
    [0, 1, 0],
  );
});
