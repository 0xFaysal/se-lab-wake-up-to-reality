import assert from "node:assert/strict";
import { it } from "node:test";
import type { Request } from "express";
import {
  locationReadPolicy,
  profileUpdatePolicy,
} from "../../../src/common/middleware/regular-rate-limit-policy.js";

const request = { auth: { userId: "driver-one" }, ip: "192.0.2.1" } as Request;

it("location browsing allows 120 requests per minute per account and 600 per shared IP", () => {
  assert.equal(locationReadPolicy.windowMs, 60_000);
  assert.deepEqual(locationReadPolicy.identities(request), [
    { value: "account:driver-one", limit: 120 },
    { value: "ip:192.0.2.1", limit: 600 },
  ]);
});
it("routine profile edits allow 30 requests per 15 minutes per account", () => {
  assert.equal(profileUpdatePolicy.windowMs, 900_000);
  assert.deepEqual(profileUpdatePolicy.identities(request), [
    { value: "account:driver-one", limit: 30 },
    { value: "ip:192.0.2.1", limit: 150 },
  ]);
});
it("regular quotas are distinct from each other and the unchanged sensitive quota", () => {
  assert.notEqual(locationReadPolicy.keyPrefix, profileUpdatePolicy.keyPrefix);
  for (const policy of [locationReadPolicy, profileUpdatePolicy]) {
    assert.notEqual(policy.keyPrefix, "sensitive-account");
    const second = {
      auth: { userId: "driver-two" },
      ip: request.ip,
    } as Request;
    assert.notEqual(
      policy.identities(request)[0]!.value,
      policy.identities(second)[0]!.value,
    );
    assert.equal(
      policy.identities(request)[1]!.value,
      policy.identities(second)[1]!.value,
    );
  }
});
