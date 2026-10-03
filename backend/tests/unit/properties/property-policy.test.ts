import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { VerificationStatus } from "../../../generated/prisma/client.js";
import {
  canDeleteProperty,
  shouldResetVerification,
} from "../../../src/modules/properties/property.policy.js";

describe("property policy", () => {
  it("resets a verified property only for critical identity or location changes", () => {
    assert.equal(
      shouldResetVerification(
        VerificationStatus.VERIFIED,
        new Set(["exactAddress"]),
      ),
      true,
    );
    assert.equal(
      shouldResetVerification(
        VerificationStatus.VERIFIED,
        new Set(["name", "accessInstructions"]),
      ),
      false,
    );
    assert.equal(
      shouldResetVerification(
        VerificationStatus.VERIFIED,
        new Set(["accessInstructions", "generalParkingRules"]),
      ),
      false,
    );
    assert.equal(
      shouldResetVerification(
        VerificationStatus.VERIFIED,
        new Set(["isSharedBuilding"]),
      ),
      true,
    );
  });

  it("returns rejected and draft properties to review after an edit", () => {
    for (const status of [
      VerificationStatus.REJECTED,
      VerificationStatus.DRAFT,
    ]) {
      assert.equal(shouldResetVerification(status, new Set(["name"])), true);
    }
  });

  it("blocks deletion when a business dependency exists", () => {
    assert.equal(
      canDeleteProperty({
        existingPropertyImageCount: 0,
        existingParkingSpotCount: 0,
        blockingGuardAssignmentCount: 0,
        providerCount: 1,
      }),
      true,
    );
    assert.equal(
      canDeleteProperty({
        existingPropertyImageCount: 0,
        existingParkingSpotCount: 1,
        blockingGuardAssignmentCount: 0,
        providerCount: 1,
      }),
      false,
    );
    assert.equal(
      canDeleteProperty({
        existingPropertyImageCount: 0,
        existingParkingSpotCount: 0,
        blockingGuardAssignmentCount: 1,
        providerCount: 1,
      }),
      false,
    );
    assert.equal(
      canDeleteProperty({
        existingPropertyImageCount: 1,
        existingParkingSpotCount: 0,
        blockingGuardAssignmentCount: 0,
        providerCount: 1,
      }),
      false,
    );
    assert.equal(
      canDeleteProperty({
        existingPropertyImageCount: 0,
        existingParkingSpotCount: 0,
        blockingGuardAssignmentCount: 0,
        providerCount: 2,
      }),
      false,
    );
  });
});
