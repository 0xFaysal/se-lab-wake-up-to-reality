import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  claimRightSchema,
  createListingSchema,
  createResourceSchema,
  createReviewSchema,
  guardBookingQuerySchema,
  publicPropertyDetailSchema,
  searchParkingSchema,
  updateAvailabilityExceptionSchema,
} from "../../../src/modules/marketplace/marketplace.schema.js";

const propertyId = "8c9f0dac-1260-4abc-a7d1-a7ebc1b6ab56";
const resourceId = "65bb81d0-90ca-49bb-a918-bb1db912d352";
const rightId = "3ec149eb-1c2f-45d7-84fa-4a1df93a402f";

describe("Marketplace validation invariants", () => {
  it("requires real codes only for fixed spaces", () => {
    assert.equal(createResourceSchema.safeParse({
      params: { propertyId },
      body: {
        type: "FIXED_SPACE", displayName: "Basement A-01", capacity: 1,
        supportedVehicleTypes: ["SEDAN"], isCovered: true, hasCctv: true, hasGuard: true,
      },
    }).success, false);
    assert.equal(createResourceSchema.safeParse({
      params: { propertyId },
      body: {
        type: "SHARED_POOL", displayName: "Basement shared parking", capacity: 20,
        supportedVehicleTypes: ["SEDAN", "SUV"], isCovered: true, hasCctv: true, hasGuard: true,
      },
    }).success, true);
  });

  it("prevents USE_ONLY rights from carrying commercial permissions", () => {
    assert.equal(claimRightSchema.safeParse({
      params: { resourceId },
      body: { rightType: "USE_ONLY", quantity: 1, canUse: true, canList: true },
    }).success, false);
  });

  it("accepts integer-paisa listing prices and rejects invalid durations", () => {
    assert.equal(createListingSchema.safeParse({ body: {
      parkingRightId: rightId, title: "Reserved basement space", pricePerHourPaisa: "6000",
      minDurationMinutes: 120, maxDurationMinutes: 60, allowedVehicleTypes: ["SEDAN"], securityDepositPaisa: "10000",
    } }).success, false);
  });

  it("requires an ordered UTC search interval", () => {
    assert.equal(searchParkingSchema.safeParse({ query: {
      latitude: "23.8103", longitude: "90.4125", radiusKm: "5",
      startAt: "2026-09-20T10:00:00.000Z", endAt: "2026-09-20T09:00:00.000Z", vehicleType: "SEDAN",
    } }).success, false);
  });

  it("limits reviews to the 1-5 rating scale", () => {
    assert.equal(createReviewSchema.safeParse({ params: { bookingId: resourceId }, body: { rating: 6 } }).success, false);
  });

  it("coerces bounded pagination for Guard booking queries", () => {
    const result = guardBookingQuerySchema.safeParse({ query: { page: "2", limit: "25", status: "CONFIRMED" } });
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.data.query.page, 2);
    assert.equal(result.data.query.limit, 25);
    assert.equal(guardBookingQuerySchema.safeParse({ query: { limit: "101" } }).success, false);
  });

  it("requires public Property detail search context", () => {
    assert.equal(publicPropertyDetailSchema.safeParse({
      params: { propertyId },
      query: { startAt: "2026-09-20T09:00:00.000Z", endAt: "2026-09-20T10:00:00.000Z", vehicleType: "SEDAN" },
    }).success, true);
    assert.equal(publicPropertyDetailSchema.safeParse({ params: { propertyId }, query: {} }).success, false);
  });

  it("rejects empty or internally reversed availability exception updates", () => {
    assert.equal(updateAvailabilityExceptionSchema.safeParse({ params: { exceptionId: resourceId }, body: {} }).success, false);
    assert.equal(updateAvailabilityExceptionSchema.safeParse({
      params: { exceptionId: resourceId },
      body: { startsAt: "2026-09-20T10:00:00.000Z", endsAt: "2026-09-20T09:00:00.000Z" },
    }).success, false);
  });
});

