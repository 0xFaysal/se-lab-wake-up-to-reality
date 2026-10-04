import assert from "node:assert/strict";
import { test } from "node:test";
import { availabilityTimeInput } from "../lib/availability-time.ts";

test("weekly opening hours accept both floating times and serialized database times", () => {
  for (const value of ["08:00", "08:00:00", "1970-01-01T08:00:00.000Z"])
    assert.equal(availabilityTimeInput(value), "08:00");
  assert.equal(availabilityTimeInput("1970-01-01T22:00:00Z"), "22:00");
  assert.equal(availabilityTimeInput("25:00"), "");
});
