import assert from "node:assert/strict";
import { Writable } from "node:stream";
import { describe, it } from "node:test";
import pino from "pino";
import { sensitiveLogPaths } from "../../../src/config/logger.js";

describe("logger redaction", () => {
  it("redacts request cookies and response Set-Cookie tokens", () => {
    let output = "";
    const destination = new Writable({
      write(chunk, _encoding, callback) {
        output += chunk.toString();
        callback();
      },
    });
    const testLogger = pino(
      {
        redact: {
          paths: [...sensitiveLogPaths],
          censor: "[REDACTED]",
        },
      },
      destination,
    );

    testLogger.info({
      req: { headers: { cookie: "access_token=request-secret" } },
      res: {
        headers: {
          "set-cookie": [
            "access_token=response-secret; HttpOnly",
            "refresh_token=refresh-secret; HttpOnly",
          ],
        },
      },
    });

    assert.doesNotMatch(
      output,
      /request-secret|response-secret|refresh-secret/,
    );
    const entry = JSON.parse(output) as {
      req: { headers: { cookie: string } };
      res: { headers: { "set-cookie": string } };
    };
    assert.equal(entry.req.headers.cookie, "[REDACTED]");
    assert.equal(entry.res.headers["set-cookie"], "[REDACTED]");
  });
});
