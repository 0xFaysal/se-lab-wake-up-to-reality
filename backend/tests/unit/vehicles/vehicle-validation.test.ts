import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createVehicleSchema,
  updateVehicleSchema,
} from "../../../src/modules/vehicles/vehicle.schema.js";

const validVehicle = {
  vehicleType: "SEDAN",
  registrationNumber: "DHAKA METRO GA 12-3456",
  brand: "Toyota",
  model: "Axio",
  color: "White",
  heightCm: 145,
  widthCm: 177,
  lengthCm: 440,
};

describe("vehicle request validation", () => {
  it("accepts a valid vehicle and defaults isDefault to false", () => {
    const result = createVehicleSchema.parse({ body: validVehicle });
    assert.equal(result.body.vehicleType, "SEDAN");
    assert.equal(result.body.isDefault, false);
  });

  it("uses only the vehicle types defined by the project schema", () => {
    assert.equal(
      createVehicleSchema.safeParse({
        body: { ...validVehicle, vehicleType: "CAR" },
      }).success,
      false,
    );
  });

  it("rejects registration numbers containing only separators", () => {
    assert.equal(
      createVehicleSchema.safeParse({
        body: { ...validVehicle, registrationNumber: "----" },
      }).success,
      false,
    );
  });

  it("rejects invalid vehicle dimensions", () => {
    for (const lengthCm of [0, -1, 10.5, 10_001]) {
      assert.equal(
        createVehicleSchema.safeParse({
          body: { ...validVehicle, lengthCm },
        }).success,
        false,
      );
    }
  });

  it("rejects an empty update", () => {
    assert.equal(
      updateVehicleSchema.safeParse({
        params: { vehicleId: "8c9f0dac-1260-4abc-a7d1-a7ebc1b6ab56" },
        body: {},
      }).success,
      false,
    );
  });

  it("allows dimensions to be cleared during an update", () => {
    assert.equal(
      updateVehicleSchema.safeParse({
        params: { vehicleId: "8c9f0dac-1260-4abc-a7d1-a7ebc1b6ab56" },
        body: { heightCm: null },
      }).success,
      true,
    );
  });

  it("rejects attempts to update protected vehicle fields", () => {
    for (const body of [
      { isDefault: true },
      { verificationStatus: "VERIFIED" },
      { ownerUserId: "8c9f0dac-1260-4abc-a7d1-a7ebc1b6ab56" },
    ]) {
      assert.equal(
        updateVehicleSchema.safeParse({
          params: { vehicleId: "8c9f0dac-1260-4abc-a7d1-a7ebc1b6ab56" },
          body,
        }).success,
        false,
      );
    }
  });
});
