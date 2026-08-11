import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  pendingAdminPropertiesSchema,
  verifyAdminPropertySchema,
} from "../../../src/modules/admin/properties/admin-property.schema.js";

const propertyId = "8c9f0dac-1260-4abc-a7d1-a7ebc1b6ab56";

describe("Admin Property verification validation", () => {
  it("accepts strict approve and valid reject decisions", () => {
    assert.equal(
      verifyAdminPropertySchema.safeParse({
        params: { propertyId },
        body: { decision: "APPROVE" },
      }).success,
      true,
    );
    assert.equal(
      verifyAdminPropertySchema.safeParse({
        params: { propertyId },
        body: { decision: "REJECT", reason: "Entrance image does not match" },
      }).success,
      true,
    );
  });

  it("rejects missing reasons and owner-field injection", () => {
    for (const body of [
      { decision: "REJECT" },
      { decision: "REJECT", reason: "too short" },
      { decision: "APPROVE", status: "ACTIVE" },
      { decision: "APPROVE", exactAddress: "changed by admin" },
    ]) {
      assert.equal(
        verifyAdminPropertySchema.safeParse({ params: { propertyId }, body })
          .success,
        false,
      );
    }
  });

  it("coerces and limits pending queue pagination", () => {
    const result = pendingAdminPropertiesSchema.safeParse({
      query: { page: "2", limit: "25" },
    });
    assert.equal(result.success, true);
    if (result.success) {
      assert.deepEqual(result.data.query, { page: 2, limit: 25 });
    }
    assert.equal(
      pendingAdminPropertiesSchema.safeParse({ query: { limit: "101" } })
        .success,
      false,
    );
  });
});
