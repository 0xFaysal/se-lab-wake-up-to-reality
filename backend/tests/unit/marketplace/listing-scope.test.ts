import assert from "node:assert/strict";
import { test } from "node:test";
import { listingScopesOverlap } from "../../../src/common/listing-scope.js";
const offer = (unit: string | null, ...types: string[]) => ({
  parkingResourceUnitId: unit,
  allowedVehicleTypes: types,
});
test("vehicle-specific offers share a spot without overlapping tariffs", () => {
  assert.equal(
    listingScopesOverlap(offer(null, "SEDAN"), offer(null, "SUV")),
    false,
  );
  assert.equal(
    listingScopesOverlap(offer("a", "SEDAN"), offer("a", "SEDAN", "SUV")),
    true,
  );
  assert.equal(
    listingScopesOverlap(offer("a", "SEDAN"), offer("b", "SEDAN")),
    false,
  );
  assert.equal(
    listingScopesOverlap(offer(null, "SEDAN"), offer("a", "SEDAN")),
    true,
  );
  assert.equal(
    listingScopesOverlap(offer("a", "SEDAN"), offer(null, "SEDAN")),
    true,
  );
});
