import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AppError } from "../../../src/common/errors/app-error.js";
import { normalizeRequestError } from "../../../src/common/errors/normalize-request-error.js";

describe("request error normalization", () => {
  it("converts body-parser malformed JSON errors into a safe 400 response", () => {
    const parserError = Object.assign(new SyntaxError("Unexpected newline"), {
      body: '{"code":"959355\n"}',
      status: 400,
      statusCode: 400,
      type: "entity.parse.failed",
    });

    const result = normalizeRequestError(parserError);

    assert.equal(result.statusCode, 400);
    assert.equal(result.code, "INVALID_JSON");
    assert.equal(result.message, "Request body contains invalid JSON");
    assert.equal(result.isOperational, true);
    assert.equal(result.details, undefined);
  });

  it("preserves operational application errors", () => {
    const original = new AppError({
      statusCode: 409,
      code: "CONFLICT",
      message: "Already exists",
    });

    assert.equal(normalizeRequestError(original), original);
  });

  it("keeps unexpected errors private and reports them as 500", () => {
    const result = normalizeRequestError(new Error("database secret"));

    assert.equal(result.statusCode, 500);
    assert.equal(result.code, "INTERNAL_SERVER_ERROR");
    assert.equal(result.message, "An unexpected error occurred");
    assert.equal(result.isOperational, false);
  });
});
