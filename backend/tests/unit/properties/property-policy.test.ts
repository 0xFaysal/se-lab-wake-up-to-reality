import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { VerificationStatus } from "../../../generated/prisma/client.js";
import { updatePropertySchema } from "../../../src/modules/properties/property.schema.js";
import {
  canDeleteProperty,
  actualPropertyChanges,
  shouldResetVerification,
} from "../../../src/modules/properties/property.policy.js";

describe("property policy", () => {
  it("accepts multiline rules but rejects unsafe controls and multiline identity fields", () => {
    const params = { propertyId: "5f89554a-1c85-49df-a431-c54d5133860b" };
    for (const field of [
      "generalParkingRules",
      "commonSafetyRules",
      "accessInstructions",
    ]) {
      assert.equal(
        updatePropertySchema.safeParse({
          params,
          body: { version: 1, [field]: "First rule\r\nSecond rule" },
        }).success,
        true,
      );
      assert.equal(
        updatePropertySchema.safeParse({
          params,
          body: { version: 1, [field]: "First\u0000rule" },
        }).success,
        false,
      );
    }
    assert.equal(
      updatePropertySchema.safeParse({
        params,
        body: { version: 1, name: "First\nSecond" },
      }).success,
      false,
    );
  });
  it("unchanged location fields in a full form do not reset verification", () => {
    const before = {
      latitude: 23.78,
      longitude: 90.47,
      exactAddress: "Private address",
      isSharedBuilding: false,
      generalParkingRules: "Old rule",
    };
    const changes = actualPropertyChanges(before, {
      ...before,
      generalParkingRules: "New rule",
      version: 2,
    });
    assert.deepEqual([...changes], ["generalParkingRules"]);
    assert.equal(
      shouldResetVerification(VerificationStatus.VERIFIED, changes),
      false,
    );
  });

  it("real critical changes and explicit clearing remain visible", () => {
    const changes = actualPropertyChanges(
      {
        latitude: 23.78,
        entranceLatitude: 23.79,
        accessInstructions: "Call the guard",
      },
      {
        latitude: 23.8,
        entranceLatitude: null,
        accessInstructions: null,
        version: 3,
      },
    );
    assert.deepEqual(
      [...changes],
      ["latitude", "entranceLatitude", "accessInstructions"],
    );
    assert.equal(
      shouldResetVerification(VerificationStatus.VERIFIED, changes),
      true,
    );
  });

  it("version, omitted fields and repeated null values are not changes", () => {
    assert.equal(
      actualPropertyChanges(
        { accessInstructions: null },
        { accessInstructions: null, latitude: undefined, version: 4 },
      ).size,
      0,
    );
  });
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
