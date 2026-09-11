import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addPropertyGuardSchema, createProviderGuardAssignmentSchema, updateGuardAssignmentSchema } from "../../../src/modules/guard-assignments/guard-assignment.schema.js";

const propertyId = "8c9f0dac-1260-4abc-a7d1-a7ebc1b6ab56";
const membershipId = "65bb81d0-90ca-49bb-a918-bb1db912d352";
const assignmentId = "1ab8bbeb-9668-4d1d-a798-7bc07162c720";

describe("normalized Guard request validation", () => {
  it("separates Property invitation from provider assignment", () => {
    assert.equal(addPropertyGuardSchema.safeParse({ params: { propertyId }, body: { identifier: "guard@example.com" } }).success, true);
    assert.equal(createProviderGuardAssignmentSchema.safeParse({
      params: { propertyId },
      body: { guardMembershipId: membershipId, shiftStart: "08:00", shiftEnd: "20:00" },
    }).success, true);
  });

  it("rejects invalid or overnight shifts", () => {
    for (const [shiftStart, shiftEnd] of [["24:00", "25:00"], ["08:00", "08:00"], ["20:00", "08:00"]]) {
      assert.equal(createProviderGuardAssignmentSchema.safeParse({
        params: { propertyId },
        body: { guardMembershipId: membershipId, shiftStart, shiftEnd },
      }).success, false);
    }
  });

  it("uses a strict assignment action union", () => {
    assert.equal(updateGuardAssignmentSchema.safeParse({ params: { assignmentId }, body: { action: "SUSPEND" } }).success, true);
    assert.equal(updateGuardAssignmentSchema.safeParse({ params: { assignmentId }, body: { action: "SUSPEND", status: "ACTIVE" } }).success, false);
  });
});
