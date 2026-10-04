import assert from "node:assert/strict";
import { test } from "node:test";
import { propertyJourneyProgress } from "../lib/property-journey.ts";

const base = { verified: true, rejected: false, resourceCount: 1, activeListingCount: 1, failed: false };
test("published property completes setup instead of requesting another parking resource", () => {
  const result = propertyJourneyProgress(base);
  assert.equal(result.status, "Listing is live");
  assert.equal(result.steps.every((step) => step.complete), true);
});
test("empty and unpublished properties identify the correct next step", () => {
  assert.equal(propertyJourneyProgress({ ...base, resourceCount: 0, activeListingCount: 0 }).status, "Next: add parking");
  const unpublished = propertyJourneyProgress({ ...base, activeListingCount: 0 });
  assert.equal(unpublished.status, "Next: publish parking");
  assert.equal(unpublished.steps[3].current, true);
});
test("missing or failed data is not reported as empty inventory", () => {
  assert.equal(propertyJourneyProgress({ ...base, resourceCount: null }).status, "Checking parking setup");
  assert.equal(propertyJourneyProgress({ ...base, failed: true }).status, "Parking status unavailable");
});
test("unapproved property cannot be reported as live even with an active listing", () => {
  const result = propertyJourneyProgress({ ...base, verified: false, rejected: true });
  assert.equal(result.status, "Action required");
  assert.equal(result.steps[3].complete, false);
});
