import assert from "node:assert/strict";
import { test } from "node:test";
import { ApiError, isAuthenticationFailure } from "../lib/api/api-error.ts";

test("only an actual authentication refusal redirects a role session to login", () => {
  assert.equal(isAuthenticationFailure(new ApiError("Expired", 401)), true);
  for (const status of [403, 408, 429, 500, 502, 503]) {
    assert.equal(isAuthenticationFailure(new ApiError("Unavailable", status)), false);
  }
  assert.equal(isAuthenticationFailure(new TypeError("Network request failed")), false);
  assert.equal(isAuthenticationFailure(null), false);
});
