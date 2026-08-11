import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatRegistrationNumberForDisplay,
  normalizeRegistrationNumber,
} from "../../../src/common/vehicles/registration-number.js";

describe("vehicle registration number normalization", () => {
  it("normalizes equivalent case, spacing, and dash formats", () => {
    for (const value of [
      "DHAKA METRO GA 12-3456",
      "Dhaka-Metro-Ga-12-3456",
      "dhaka metro ga 12 3456",
      "DHAKA\u2013METRO\u2013GA\u201312\u20133456",
    ]) {
      assert.equal(
        normalizeRegistrationNumber(value),
        "DHAKAMETROGA123456",
      );
    }
  });

  it("keeps a readable display value without internal whitespace noise", () => {
    assert.equal(
      formatRegistrationNumberForDisplay("  DHAKA   METRO GA 12-3456  "),
      "DHAKA METRO GA 12-3456",
    );
  });
});
