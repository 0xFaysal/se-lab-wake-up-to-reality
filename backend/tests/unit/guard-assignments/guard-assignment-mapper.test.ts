import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GuardAssignmentStatus } from "../../../generated/prisma/client.js";
import {
  maskEmail,
  maskPhone,
  toGuardAssignment,
  toOwnerGuardAssignment,
} from "../../../src/modules/guard-assignments/guard-assignment.mapper.js";
import type { GuardAssignmentRecord } from "../../../src/modules/guard-assignments/guard-assignment.repository.js";

const fixture = {
  id: "assignment-id",
  propertyId: "property-id",
  guardUserId: "guard-id",
  status: GuardAssignmentStatus.PENDING_ACCEPTANCE,
  shiftStart: new Date("1970-01-01T08:00:00.000Z"),
  shiftEnd: new Date("1970-01-01T20:00:00.000Z"),
  invitedAt: new Date("2026-08-13T08:00:00.000Z"),
  acceptedAt: null,
  assignedAt: null,
  endedAt: null,
  createdAt: new Date("2026-08-13T08:00:00.000Z"),
  updatedAt: new Date("2026-08-13T08:00:00.000Z"),
  property: {
    id: "property-id",
    name: "Gulshan Parking",
    publicArea: "Gulshan, Dhaka",
    status: "ACTIVE",
    verificationStatus: "VERIFIED",
    deletedAt: null,
    owner: { id: "owner-id", fullName: "Parking Owner" },
  },
  guard: {
    id: "guard-id",
    fullName: "Security Guard",
    email: "guard@example.com",
    phone: "+8801712345678",
    status: "ACTIVE",
    mustChangePassword: false,
    emailVerifiedAt: new Date("2026-08-13T07:00:00.000Z"),
    deletedAt: null,
  },
} satisfies GuardAssignmentRecord;

describe("Guard assignment privacy mappers", () => {
  it("masks Guard contacts in Owner responses", () => {
    assert.equal(maskEmail("guard@example.com"), "g***@example.com");
    assert.equal(maskPhone("+8801712345678"), "+88017*****678");
    const result = toOwnerGuardAssignment(fixture);
    assert.equal(result.guard.emailMasked, "g***@example.com");
    assert.equal(result.guard.phoneMasked, "+88017*****678");
    assert.equal("email" in result.guard, false);
    assert.equal("phone" in result.guard, false);
    assert.equal(result.shiftStart, "08:00");
  });

  it("exposes only relevant Property and Owner display data to the Guard", () => {
    const result = toGuardAssignment(fixture);
    assert.deepEqual(result.property, {
      id: "property-id",
      name: "Gulshan Parking",
      publicArea: "Gulshan, Dhaka",
    });
    assert.deepEqual(result.owner, {
      id: "owner-id",
      fullName: "Parking Owner",
    });
    assert.equal("guard" in result, false);
  });
});
