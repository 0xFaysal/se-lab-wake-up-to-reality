import assert from "node:assert/strict";
import { it } from "node:test";
import {
  approximateCoordinates,
  operationalBooking,
} from "../../../src/modules/marketplace/public-data.js";

it("public coordinates identify a neighbourhood rather than an invertible entrance offset", () => {
  const a = approximateCoordinates("public-id", 23.74651, 90.37602);
  const b = approximateCoordinates("other-id", 23.74652, 90.37603);
  assert.deepEqual(a, b);
  assert.deepEqual(a, { latitude: 23.75, longitude: 90.38 });
});

it("operational bookings preserve dates but omit nested financial values", () => {
  const date = new Date("2026-10-03T10:00:00Z");
  const original = {
    id: "booking",
    startAt: date,
    driverWalletAppliedPaisa: 400n,
    providerNetPaisa: 36n,
    overtimeMultiplierBps: 15000,
    payments: [{ id: "secret" }],
    listing: { title: "Parking", pricePerHourPaisa: 18n },
    vehicle: { maxHeightCm: 200 },
  };
  const result = operationalBooking(original);
  assert.deepEqual(result, {
    id: "booking",
    startAt: date,
    listing: { title: "Parking" },
    vehicle: { maxHeightCm: 200 },
  });
  assert.equal(original.driverWalletAppliedPaisa, 400n);
});
