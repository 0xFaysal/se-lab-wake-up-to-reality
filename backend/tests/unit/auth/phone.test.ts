import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeBangladeshPhone } from "../../../src/common/auth/phone.js";

describe("normalizeBangladeshPhone", () => {
  it("normalizes all supported Bangladesh formats", () => {
    for (const input of [
      "01712345678",
      "8801712345678",
      "+8801712345678",
      "017-1234-5678",
      "017 1234 5678",
    ]) {
      assert.equal(normalizeBangladeshPhone(input), "+8801712345678");
    }
  });

  it("rejects invalid or non-mobile numbers", () => {
    for (const input of ["12345", "+8801212345678", "0171234567", ""]) {
      assert.throws(
        () => normalizeBangladeshPhone(input),
        /INVALID_BANGLADESH_PHONE/,
      );
    }
  });
});
