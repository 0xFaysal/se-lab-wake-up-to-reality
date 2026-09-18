import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  mergeAdminPropertiesSchema,
  mergeAdminPropertyByIdSchema,
  pendingAdminPropertiesSchema,
  verifyAdminPropertySchema,
} from "../../../src/modules/admin/properties/admin-property.schema.js";

const propertyId = "8c9f0dac-1260-4abc-a7d1-a7ebc1b6ab56";
const duplicateId = "65bb81d0-90ca-49bb-a918-bb1db912d352";

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

  it("validates canonical and compatibility merge requests", () => {
    const body = {
      canonicalPropertyId: propertyId,
      canonicalVersion: 3,
      duplicateVersion: 2,
      reason: "Verified duplicate of the canonical building",
    };
    assert.equal(
      mergeAdminPropertyByIdSchema.safeParse({
        params: { duplicateId },
        body,
      }).success,
      true,
    );
    assert.equal(
      mergeAdminPropertiesSchema.safeParse({
        body: { ...body, duplicatePropertyId: duplicateId },
      }).success,
      true,
    );
    assert.equal(
      mergeAdminPropertiesSchema.safeParse({
        body: { ...body, duplicatePropertyId: propertyId },
      }).success,
      false,
    );
  });
});
