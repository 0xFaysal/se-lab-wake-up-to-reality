import assert from "node:assert/strict";
import test from "node:test";
import { calculatePlatformFeePaisa } from "../../../src/common/finance/platform-fee.js";

test("platform fee uses the 10 percent default and rounds up to a full paisa", () => {
  assert.equal(calculatePlatformFeePaisa(10_001n), 1_001n);
});

test("platform fee calculates percentage rules in basis points", () => {
  assert.equal(calculatePlatformFeePaisa(20_000n, { feeType: "PERCENTAGE", percentageBps: 500 }), 1_000n);
});

test("platform fee uses an exact fixed-paisa rule", () => {
  assert.equal(calculatePlatformFeePaisa(20_000n, { feeType: "FIXED", fixedAmountPaisa: 750n }), 750n);
});

test("platform fee rejects invalid basis points", () => {
  assert.throws(() => calculatePlatformFeePaisa(20_000n, { feeType: "PERCENTAGE", percentageBps: 10_001 }), RangeError);
});
