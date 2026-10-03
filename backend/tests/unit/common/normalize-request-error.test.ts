import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AppError } from "../../../src/common/errors/app-error.js";
import { normalizeRequestError } from "../../../src/common/errors/normalize-request-error.js";
import {
  initializationErrorMetadata,
  serverInitializationFailure,
} from "../../../src/common/errors/server-init-error.js";

describe("server initialization errors", () => {
  it("returns a stable, private failure envelope", () => {
    const result = serverInitializationFailure("test-request-id");
    assert.equal(result.success, false);
    assert.equal(result.error.code, "SERVICE_UNAVAILABLE");
    assert.equal(result.meta.requestId, "test-request-id");
    assert.ok(Number.isFinite(Date.parse(result.meta.timestamp)));
  });
  it("keeps connection strings, raw messages and stacks out of logs", () => {
    const error = Object.assign(
      new Error("postgresql://user:secret@private-host/db"),
      { code: "ECONNREFUSED" },
    );
    assert.deepEqual(initializationErrorMetadata(error), {
      name: "Error",
      code: "ECONNREFUSED",
    });
    assert.doesNotMatch(
      JSON.stringify(initializationErrorMetadata(error)),
      /secret|private-host|stack/,
    );
    assert.deepEqual(initializationErrorMetadata({ code: "secret-password" }), {
      name: "UnknownError",
    });
  });
});

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
