import assert from "node:assert/strict";
import { describe, it } from "node:test";
import "./public-data.test.js";
import {
  claimRightSchema,
  createBulkResourcesSchema,
  createRightClaimBatchSchema,
  createListingSchema,
  createResourceSchema,
  createReviewSchema,
  createSavedLocationSchema,
  createSearchHistorySchema,
  guardBookingQuerySchema,
  publicPropertyDetailSchema,
  reviewRightClaimBatchSchema,
  searchParkingSchema,
  updateAvailabilityExceptionSchema,
} from "../../../src/modules/marketplace/marketplace.schema.js";

const propertyId = "8c9f0dac-1260-4abc-a7d1-a7ebc1b6ab56";
const resourceId = "65bb81d0-90ca-49bb-a918-bb1db912d352";
const rightId = "3ec149eb-1c2f-45d7-84fa-4a1df93a402f";

describe("Marketplace validation invariants", () => {
  it("requires real codes only for fixed spaces", () => {
    assert.equal(
      createResourceSchema.safeParse({
        params: { propertyId },
        body: {
          type: "FIXED_SPACE",
          displayName: "Basement A-01",
          capacity: 1,
          supportedVehicleTypes: ["SEDAN"],
          isCovered: true,
          hasCctv: true,
          hasGuard: true,
        },
      }).success,
      false,
    );
    assert.equal(
      createResourceSchema.safeParse({
        params: { propertyId },
        body: {
          type: "SHARED_POOL",
          displayName: "Basement shared parking",
          capacity: 20,
          supportedVehicleTypes: ["SEDAN", "SUV"],
          isCovered: true,
          hasCctv: true,
          hasGuard: true,
        },
      }).success,
      true,
    );
  });

  it("prevents USE_ONLY rights from carrying commercial permissions", () => {
    assert.equal(
      claimRightSchema.safeParse({
        params: { resourceId },
        body: {
          rightType: "USE_ONLY",
          quantity: 1,
          canUse: true,
          canList: true,
        },
      }).success,
      false,
    );
  });

  it("accepts integer-paisa listing prices and rejects invalid durations", () => {
    assert.equal(
      createListingSchema.safeParse({
        body: {
          parkingRightId: rightId,
          title: "Reserved basement space",
          pricePerHourPaisa: "6000",
          minDurationMinutes: 120,
          maxDurationMinutes: 60,
          allowedVehicleTypes: ["SEDAN"],
          securityDepositPaisa: "10000",
        },
      }).success,
      false,
    );
  });

  it("requires an ordered UTC search interval", () => {
    assert.equal(
      searchParkingSchema.safeParse({
        query: {
          latitude: "23.8103",
          longitude: "90.4125",
          radiusKm: "5",
          startAt: "2026-09-20T10:00:00.000Z",
          endAt: "2026-09-20T09:00:00.000Z",
          vehicleType: "SEDAN",
        },
      }).success,
      false,
    );
  });

  it("limits reviews to the 1-5 rating scale", () => {
    assert.equal(
      createReviewSchema.safeParse({
        params: { bookingId: resourceId },
        body: { rating: 6 },
      }).success,
      false,
    );
    assert.equal(
      createReviewSchema.safeParse({
        params: { bookingId: resourceId },
        body: {
          rating: 5,
          securityRating: 4,
          locationAccuracyRating: 5,
          cleanlinessRating: 3,
        },
      }).success,
      true,
    );
  });

  it("accepts supported parking discovery filters and rejects unknown query fields", () => {
    const futureStart = new Date(Date.now() + 3600_000).toISOString();
    const futureEnd = new Date(Date.now() + 7200_000).toISOString();
    const query = {
      latitude: "23.8103",
      longitude: "90.4125",
      radiusKm: "5",
      startAt: futureStart,
      endAt: futureEnd,
      vehicleType: "SEDAN",
      covered: "true",
      hasCctv: "true",
      hasGuard: "false",
      resourceType: "FIXED_SPACE",
      facilityCodes: "EV_CHARGING,WHEELCHAIR_ACCESS",
      minAvailableUnits: "2",
      sort: "price",
      page: "2",
      limit: "5",
    };
    const parsed = searchParkingSchema.safeParse({ query });
    assert.equal(parsed.success, true);
    if (parsed.success)
      assert.deepEqual(parsed.data.query.facilityCodes, [
        "EV_CHARGING",
        "WHEELCHAIR_ACCESS",
      ]);
    if (parsed.success) {
      assert.equal(parsed.data.query.sort, "price");
      assert.equal(parsed.data.query.page, 2);
      assert.equal(parsed.data.query.limit, 5);
    }
    assert.equal(
      searchParkingSchema.safeParse({
        query: { ...query, unsupportedFilter: "true" },
      }).success,
      false,
    );
  });

  it("validates Driver saved places and bounded recent-search coordinates", () => {
    assert.equal(
      createSavedLocationSchema.safeParse({
        body: {
          label: "Office",
          displayName: "Gulshan 1, Dhaka",
          latitude: 23.7808,
          longitude: 90.4167,
        },
      }).success,
      true,
    );
    assert.equal(
      createSavedLocationSchema.safeParse({
        body: {
          label: "Office",
          displayName: "Gulshan 1, Dhaka",
          latitude: 123,
          longitude: 90.4167,
        },
      }).success,
      false,
    );
    assert.equal(
      createSearchHistorySchema.safeParse({
        body: {
          displayName: "Dhanmondi, Dhaka",
          latitude: 23.7465,
          longitude: 90.376,
          radiusKm: 5,
          vehicleType: "SEDAN",
        },
      }).success,
      true,
    );
    assert.equal(
      createSearchHistorySchema.safeParse({
        body: {
          displayName: "Dhanmondi, Dhaka",
          latitude: 23.7465,
          longitude: 90.376,
          radiusKm: 101,
          vehicleType: "SEDAN",
        },
      }).success,
      false,
    );
  });

  it("requires unique resources and bounded batch claims", () => {
    const body = {
      resourceIds: [resourceId, rightId],
      rightType: "OWNERSHIP",
      quantity: 1,
      canUse: true,
      canList: true,
      canSetPrice: true,
      canManageBookings: true,
      canDelegateManager: false,
    };
    assert.equal(
      createRightClaimBatchSchema.safeParse({ params: { propertyId }, body })
        .success,
      true,
    );
    assert.equal(
      createRightClaimBatchSchema.safeParse({
        params: { propertyId },
        body: { ...body, resourceIds: [resourceId, resourceId] },
      }).success,
      false,
    );
  });

  it("bounds bulk fixed-space creation and preserves per-row validation", () => {
    const sharedDefaults = {
      floor: "B1",
      zone: "A",
      supportedVehicleTypes: ["SEDAN"],
      isCovered: true,
      hasCctv: true,
      hasGuard: true,
    };
    assert.equal(
      createBulkResourcesSchema.safeParse({
        params: { propertyId },
        body: {
          spaces: [{ displayName: "A-01", spotCode: "A-01" }],
          sharedDefaults,
        },
      }).success,
      true,
    );
    assert.equal(
      createBulkResourcesSchema.safeParse({
        params: { propertyId },
        body: { spaces: [{ displayName: "A", spotCode: "" }], sharedDefaults },
      }).success,
      false,
    );
    assert.equal(
      createBulkResourcesSchema.safeParse({
        params: { propertyId },
        body: {
          resource: {
            type: "FIXED_SPACE",
            displayName: "Basement Zone A",
            ...sharedDefaults,
          },
          units: [
            { displayName: "Parking space A-01", spotCode: "A-01" },
            { displayName: "Parking space A-02", spotCode: "A-02" },
          ],
        },
      }).success,
      true,
    );
  });

  it("accepts an optional fixed-unit scope on a listing", () => {
    assert.equal(
      createListingSchema.safeParse({
        body: {
          parkingRightId: rightId,
          parkingResourceUnitId: resourceId,
          title: "Extra-wide A-10",
          pricePerHourPaisa: "15000",
          minDurationMinutes: 60,
          maxDurationMinutes: 720,
          allowedVehicleTypes: ["SUV"],
          securityDepositPaisa: "0",
        },
      }).success,
      true,
    );
  });

  it("rejects duplicate claims in one Admin batch decision", () => {
    const body = {
      decision: "VERIFIED",
      rights: [
        { rightId: resourceId, expectedVersion: 1 },
        { rightId: resourceId, expectedVersion: 1 },
      ],
    };
    assert.equal(
      reviewRightClaimBatchSchema.safeParse({
        params: { batchId: propertyId },
        body,
      }).success,
      false,
    );
  });

  it("coerces bounded pagination for Guard booking queries", () => {
    const result = guardBookingQuerySchema.safeParse({
      query: { page: "2", limit: "25", status: "CONFIRMED" },
    });
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.data.query.page, 2);
    assert.equal(result.data.query.limit, 25);
    assert.equal(
      guardBookingQuerySchema.safeParse({ query: { limit: "101" } }).success,
      false,
    );
  });

  it("requires public Property detail search context", () => {
    const futureStart = new Date(Date.now() + 3600_000).toISOString();
    const futureEnd = new Date(Date.now() + 7200_000).toISOString();
    assert.equal(
      publicPropertyDetailSchema.safeParse({
        params: { propertyId },
        query: { startAt: futureStart, endAt: futureEnd, vehicleType: "SEDAN" },
      }).success,
      true,
    );
    assert.equal(
      publicPropertyDetailSchema.safeParse({
        params: { propertyId },
        query: {},
      }).success,
      false,
    );
  });

  it("rejects empty or internally reversed availability exception updates", () => {
    assert.equal(
      updateAvailabilityExceptionSchema.safeParse({
        params: { exceptionId: resourceId },
        body: {},
      }).success,
      false,
    );
    assert.equal(
      updateAvailabilityExceptionSchema.safeParse({
        params: { exceptionId: resourceId },
        body: {
          startsAt: "2026-09-20T10:00:00.000Z",
          endsAt: "2026-09-20T09:00:00.000Z",
        },
      }).success,
      false,
    );
  });
});
