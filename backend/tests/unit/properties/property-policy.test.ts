import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { VerificationStatus } from "../../../generated/prisma/client.js";
import {
  canDeleteProperty,
  shouldResetVerification,
} from "../../../src/modules/properties/property.policy.js";

describe("property policy", () => {
  it("resets a verified property only for critical location changes", () => {
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
      }),
      true,
    );
    assert.equal(
      canDeleteProperty({
        existingPropertyImageCount: 0,
        existingParkingSpotCount: 1,
        blockingGuardAssignmentCount: 0,
      }),
      false,
    );
    assert.equal(
      canDeleteProperty({
        existingPropertyImageCount: 0,
        existingParkingSpotCount: 0,
        blockingGuardAssignmentCount: 1,
      }),
      false,
    );
    assert.equal(
      canDeleteProperty({
        existingPropertyImageCount: 1,
        existingParkingSpotCount: 0,
        blockingGuardAssignmentCount: 0,
      }),
      false,
    );
  });
});
