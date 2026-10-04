import assert from "node:assert/strict";
import { test } from "node:test";
import {
  propertyDistanceMeters,
  propertySearchBounds,
  PROPERTY_MATCH_RADIUS_METERS,
} from "../../../src/modules/properties/property-proximity.js";

test("nearby matching uses meters, not equal names or address strings", () => {
  const pin = { latitude: 23.78, longitude: 90.4 };
  assert.equal(propertyDistanceMeters(pin, pin), 0);
  assert.ok(
    propertyDistanceMeters(pin, { ...pin, latitude: pin.latitude + 0.0004 }) <
      PROPERTY_MATCH_RADIUS_METERS,
  );
  assert.ok(
    propertyDistanceMeters(pin, { ...pin, latitude: pin.latitude + 0.001 }) >
      PROPERTY_MATCH_RADIUS_METERS,
  );
  const bounds = propertySearchBounds(pin.latitude);
  assert.ok(
    propertyDistanceMeters(pin, {
      latitude: pin.latitude + bounds.latitudeDelta,
      longitude: pin.longitude + bounds.longitudeDelta,
    }) > PROPERTY_MATCH_RADIUS_METERS,
  );
});

test("longitude bounds account for latitude and dates across the antimeridian", () => {
  assert.ok(
    propertySearchBounds(60).longitudeDelta >
      propertySearchBounds(0).longitudeDelta,
  );
  assert.ok(
    propertyDistanceMeters(
      { latitude: 0, longitude: 179.9999 },
      { latitude: 0, longitude: -179.9999 },
    ) < PROPERTY_MATCH_RADIUS_METERS,
  );
});
