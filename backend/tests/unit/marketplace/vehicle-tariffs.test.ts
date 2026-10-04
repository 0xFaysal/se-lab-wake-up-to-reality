import assert from "node:assert/strict";
import { test } from "node:test";
import { validateVehicleTariffs } from "../../../src/common/vehicle-tariffs.js";
import { vehicleListingRatesSchema } from "../../../src/modules/marketplace/marketplace.schema.js";

test("vehicle tariffs must cover selected vehicles exactly once with bounded positive paisa", () => {
  const rates = [{ vehicleType: "SEDAN", pricePerHourPaisa: 1200n }, { vehicleType: "SUV", pricePerHourPaisa: 1800n }];
  assert.ok(validateVehicleTariffs(["SEDAN", "SUV"], rates));
  assert.ok(!validateVehicleTariffs(["SEDAN"], rates));
  assert.ok(!validateVehicleTariffs(["SEDAN", "SUV"], [rates[0]!, rates[0]!]));
  assert.ok(!validateVehicleTariffs(["SEDAN"], [{ ...rates[0]!, pricePerHourPaisa: 0n }]));
});
test("vehicle pricing request validates version, duplicate vehicles and forbids changing authority", () => {
  const request = { params: { listingId: "8c9f0dac-1260-4abc-a7d1-a7ebc1b6ab56" }, body: { expectedUpdatedAt: "2026-10-04T00:00:00Z", settings: {}, rates: [{ vehicleType: "SEDAN", pricePerHourPaisa: "1200" }] } };
  assert.ok(vehicleListingRatesSchema.safeParse(request).success);
  assert.ok(!vehicleListingRatesSchema.safeParse({ ...request, body: { ...request.body, rates: [...request.body.rates, ...request.body.rates] } }).success);
  assert.ok(!vehicleListingRatesSchema.safeParse({ ...request, body: { ...request.body, settings: { parkingRightId: request.params.listingId } } }).success);
});
