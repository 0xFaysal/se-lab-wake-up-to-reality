import assert from "node:assert/strict";
import { Writable } from "node:stream";
import { describe, it } from "node:test";
import pino from "pino";
import { sensitiveLogPaths } from "../../../src/config/logger.js";

describe("logger redaction", () => {
  it("redacts cookies and Vercel authentication headers including forwarded signatures", () => {
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
      req: {
        headers: {
          cookie: "access_token=request-secret",
          "x-vercel-oidc-token": "oidc-secret",
          "x-vercel-proxy-signature": "Bearer proxy-secret",
          "x-vercel-protection-bypass": "bypass-secret",
          "x-vercel-set-bypass-cookie": "bypass-cookie-secret",
          forwarded: "for=127.0.0.1;sig=forwarded-secret",
        },
      },
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
      /request-secret|response-secret|refresh-secret|oidc-secret|proxy-secret|bypass-secret|bypass-cookie-secret|forwarded-secret/,
    );
    const entry = JSON.parse(output) as {
      req: { headers: Record<string, string> };
      res: { headers: { "set-cookie": string } };
    };
    assert.equal(entry.req.headers.cookie, "[REDACTED]");
    for (const header of [
      "x-vercel-oidc-token",
      "x-vercel-proxy-signature",
      "x-vercel-protection-bypass",
      "x-vercel-set-bypass-cookie",
      "forwarded",
    ]) {
      assert.equal(entry.req.headers[header], "[REDACTED]");
    }
    assert.equal(entry.res.headers["set-cookie"], "[REDACTED]");
  });
});
