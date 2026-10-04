import assert from "node:assert/strict";
import { it } from "node:test";
import {
  approximateCoordinates,
  driverLocationDisclosure,
  confirmedBookingCoordinates,
  operationalBooking,
} from "../../../src/modules/marketplace/public-data.js";

it("exact booking coordinates require confirmation and validate real coordinates", () => {
  const property = { latitude: "23.795896", longitude: "90.437249" };
  assert.equal(confirmedBookingCoordinates(false, property), null);
  assert.equal(confirmedBookingCoordinates(true, null), null);
  assert.equal(
    confirmedBookingCoordinates(true, { latitude: null, longitude: 90 }),
    null,
  );
  assert.equal(
    confirmedBookingCoordinates(true, { latitude: "invalid", longitude: 90 }),
    null,
  );
  assert.equal(
    confirmedBookingCoordinates(true, { latitude: 23, longitude: 181 }),
    null,
  );
  assert.deepEqual(confirmedBookingCoordinates(true, property), {
    latitude: 23.795896,
    longitude: 90.437249,
  });
});

it("Driver location disclosure requires consent and never includes private access details", () => {
  const property = {
    id: "test-property",
    name: "QA Parking",
    latitude: "23.800112",
    longitude: "90.439890",
    exactAddress: "private",
    accessInstructions: "private",
    otp: "private",
  };
  assert.deepEqual(driverLocationDisclosure(false, property), {
    available: false,
    reason: "PROVIDER_CONSENT_REQUIRED",
  });
  assert.deepEqual(driverLocationDisclosure(true, property), {
    available: true,
    propertyId: "test-property",
    name: "QA Parking",
    latitude: 23.800112,
    longitude: 90.43989,
  });
});

it("public coordinates use a small grid rather than an invertible entrance offset", () => {
  const a = approximateCoordinates("public-id", 23.74651, 90.37602);
  const b = approximateCoordinates("other-id", 23.74652, 90.37603);
  assert.deepEqual(a, b);
  assert.notEqual(a.latitude, 23.74651);
  assert.notEqual(a.longitude, 90.37602);
});

it("public locations stay inside the 40-metre area throughout Bangladesh", () => {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  for (const latitude of [
    20.74, 21.43, 23.74651, 23.795896, 23.800112, 26.64,
  ]) {
    for (const longitude of [88.01, 90.37602, 90.43989, 92.67]) {
      const approximate = approximateCoordinates("test", latitude, longitude);
      const haversine =
        Math.sin(radians(approximate.latitude - latitude) / 2) ** 2 +
        Math.cos(radians(latitude)) *
          Math.cos(radians(approximate.latitude)) *
          Math.sin(radians(approximate.longitude - longitude) / 2) ** 2;
      const distance = 2 * 6_371_000 * Math.asin(Math.sqrt(haversine));
      assert.ok(distance < 40, `Location displaced by ${distance} metres`);
      assert.deepEqual(
        approximate,
        approximateCoordinates("different-id", latitude, longitude),
      );
    }
  }
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
