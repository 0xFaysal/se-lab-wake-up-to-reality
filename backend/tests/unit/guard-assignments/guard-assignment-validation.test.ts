import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createGuardInvitationSchema,
  updateGuardAssignmentSchema,
} from "../../../src/modules/guard-assignments/guard-assignment.schema.js";

const propertyId = "8c9f0dac-1260-4abc-a7d1-a7ebc1b6ab56";
const assignmentId = "1ab8bbeb-9668-4d1d-a798-7bc07162c720";

describe("Guard assignment request validation", () => {
  it("accepts a valid same-day shift", () => {
    assert.equal(
      createGuardInvitationSchema.safeParse({
        params: { propertyId },
        body: {
          identifier: "guard@example.com",
          shiftStart: "08:00",
          shiftEnd: "20:00",
        },
      }).success,
      true,
    );
  });

  it("rejects malformed, zero-length, and overnight shifts", () => {
    for (const [shiftStart, shiftEnd] of [
      ["24:00", "25:00"],
      ["08:00", "08:00"],
      ["20:00", "08:00"],
    ]) {
      assert.equal(
        createGuardInvitationSchema.safeParse({
          params: { propertyId },
          body: { identifier: "guard@example.com", shiftStart, shiftEnd },
        }).success,
        false,
      );
    }
  });

  it("uses a strict action union and rejects protected fields", () => {
    assert.equal(
      updateGuardAssignmentSchema.safeParse({
        params: { assignmentId },
        body: { action: "SUSPEND" },
      }).success,
      true,
    );
    for (const body of [
      { status: "ACTIVE" },
      { action: "SUSPEND", guardUserId: propertyId },
      { action: "UPDATE_SHIFT", shiftStart: "09:00", shiftEnd: "09:00" },
    ]) {
      assert.equal(
        updateGuardAssignmentSchema.safeParse({
          params: { assignmentId },
          body,
        }).success,
        false,
      );
    }
  });
});
