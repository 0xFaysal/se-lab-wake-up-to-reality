import assert from "node:assert/strict";
import test from "node:test";
import {
  gatewayAmountToPaisa,
  paisaToGatewayAmount,
  sessionFailureFromReason,
} from "../../../src/modules/payments/sslcommerz.gateway.js";

test("converts integer paisa to the exact two-decimal gateway amount", () => {
  assert.equal(paisaToGatewayAmount(10000n), "100.00");
  assert.equal(paisaToGatewayAmount(1001n), "10.01");
  assert.equal(paisaToGatewayAmount(1n), "0.01");
});

test("converts validated gateway decimals back to integer paisa", () => {
  assert.equal(gatewayAmountToPaisa(100), 10000n);
  assert.equal(gatewayAmountToPaisa(10.01), 1001n);
});

test("rejects non-positive monetary values", () => {
  assert.throws(() => paisaToGatewayAmount(0n));
  assert.throws(() => gatewayAmountToPaisa(Number.NaN));
});

test("classifies rejected merchant credentials without exposing secrets", () => {
  const error = sessionFailureFromReason(
    "Store Credential Error Or Store is De-active",
  );

  assert.equal(error.statusCode, 503);
  assert.equal(error.code, "PAYMENT_GATEWAY_CREDENTIALS_REJECTED");
  assert.equal(
    error.message,
    "The payment gateway rejected the configured merchant account",
  );
});

test("preserves non-credential gateway failures for diagnosis", () => {
  const error = sessionFailureFromReason("Invalid callback URL");

  assert.equal(error.statusCode, 502);
  assert.equal(error.code, "PAYMENT_SESSION_FAILED");
  assert.deepEqual(error.details, { gatewayReason: "Invalid callback URL" });
});
