import assert from "node:assert/strict";
import { test } from "node:test";
import { paymentSearchConditions } from "../../../src/modules/admin/operations/payment-search.js";

test("payment references and emails never enter the PostgreSQL UUID filter", () => {
  for (const search of [
    "PKMUMICR8Q9C0A70",
    "driver@example.com",
    "short",
    "not-a-uuid",
  ]) {
    const conditions = paymentSearchConditions(search);
    assert.equal(
      conditions.some((condition) => "id" in condition),
      false,
    );
    assert.equal(conditions.length, 3);
  }
});

test("a payment UUID supports exact ID search alongside reference search", () => {
  const id = "3e27ee65-3752-4bde-a522-75122f68fe5e";
  assert.deepEqual(paymentSearchConditions(id)[0], { id: { equals: id } });
});
