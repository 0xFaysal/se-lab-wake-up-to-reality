import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createPropertySchema,
  updatePropertySchema,
} from "../../../src/modules/properties/property.schema.js";

const validProperty = {
  name: "Gulshan Residential Parking",
  publicArea: "Gulshan 2, Dhaka",
  approximateAddress: "Near Gulshan 2 circle",
  exactAddress: "House 12, Road 45, Gulshan 2, Dhaka",
  latitude: 23.7949,
  longitude: 90.4143,
  entranceLatitude: 23.7947,
  entranceLongitude: 90.4146,
  accessInstructions: "Use the south gate",
};

describe("property request validation", () => {
  it("accepts valid coordinates and a complete entrance pair", () => {
    assert.equal(
      createPropertySchema.safeParse({ body: validProperty }).success,
      true,
    );
  });

  it("accepts the shared-building governance flag", () => {
    const result = createPropertySchema.safeParse({
      body: { ...validProperty, isSharedBuilding: true },
    });
    assert.equal(result.success, true);
    if (result.success) assert.equal(result.data.body.isSharedBuilding, true);
  });

  it("rejects latitude and longitude outside global bounds", () => {
    for (const body of [
      { ...validProperty, latitude: 90.01 },
      { ...validProperty, latitude: -90.01 },
      { ...validProperty, longitude: 180.01 },
      { ...validProperty, longitude: -180.01 },
    ]) {
      assert.equal(createPropertySchema.safeParse({ body }).success, false);
    }
  });

  it("requires entrance coordinates together", () => {
    const { entranceLongitude: _unused, ...missingLongitude } = validProperty;
    assert.equal(
      createPropertySchema.safeParse({ body: missingLongitude }).success,
      false,
    );
  });

  it("allows both entrance coordinates to be cleared", () => {
    assert.equal(
      updatePropertySchema.safeParse({
        params: { propertyId: "8c9f0dac-1260-4abc-a7d1-a7ebc1b6ab56" },
        body: { version: 1, entranceLatitude: null, entranceLongitude: null },
      }).success,
      true,
    );
  });

  it("rejects an empty update", () => {
    assert.equal(
      updatePropertySchema.safeParse({
        params: { propertyId: "8c9f0dac-1260-4abc-a7d1-a7ebc1b6ab56" },
        body: {},
      }).success,
      false,
    );
    assert.equal(
      updatePropertySchema.safeParse({
        params: { propertyId: "8c9f0dac-1260-4abc-a7d1-a7ebc1b6ab56" },
        body: { version: 1 },
      }).success,
      false,
    );
  });

  it("rejects protected and unknown fields", () => {
    for (const body of [
      { verificationStatus: "VERIFIED" },
      { status: "ACTIVE" },
      { verifiedAt: new Date().toISOString() },
      { verifiedByAdminId: "8c9f0dac-1260-4abc-a7d1-a7ebc1b6ab56" },
      { ownerUserId: "8c9f0dac-1260-4abc-a7d1-a7ebc1b6ab56" },
    ]) {
      assert.equal(
        updatePropertySchema.safeParse({
          params: { propertyId: "8c9f0dac-1260-4abc-a7d1-a7ebc1b6ab56" },
          body,
        }).success,
        false,
      );
    }
  });
});
