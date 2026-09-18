import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GuardAssignmentStatus, PropertyGuardMembershipStatus } from "../../../generated/prisma/client.js";
import { maskEmail, maskPhone, toGuardMembership, toProviderGuardAssignment } from "../../../src/modules/guard-assignments/guard-assignment.mapper.js";
import type { GuardMembershipRecord, ProviderGuardAssignmentRecord } from "../../../src/modules/guard-assignments/guard-assignment.repository.js";

const property = { id: "property-id", name: "Gulshan Parking", publicArea: "Gulshan, Dhaka" };
const guard = { id: "guard-id", fullName: "Security Guard", email: "guard@example.com", phone: "+8801712345678" };
const provider = { id: "provider-id", fullName: "Parking Provider" };

const membership = {
  id: "membership-id",
  propertyId: property.id,
  guardUserId: guard.id,
  addedByUserId: provider.id,
  status: PropertyGuardMembershipStatus.ACTIVE,
  invitedAt: new Date("2026-09-01T08:00:00.000Z"),
  joinedAt: new Date("2026-09-01T09:00:00.000Z"),
  endedAt: null,
  createdAt: new Date("2026-09-01T08:00:00.000Z"),
  updatedAt: new Date("2026-09-01T09:00:00.000Z"),
  property,
  guard,
} satisfies GuardMembershipRecord;

const assignment = {
  id: "assignment-id",
  propertyGuardMembershipId: membership.id,
  providerMembershipId: "provider-membership-id",
  createdByUserId: provider.id,
  status: GuardAssignmentStatus.ACTIVE,
  shiftStart: new Date("1970-01-01T08:00:00.000Z"),
  shiftEnd: new Date("1970-01-01T20:00:00.000Z"),
  assignedAt: new Date("2026-09-01T10:00:00.000Z"),
  endedAt: null,
  createdAt: new Date("2026-09-01T10:00:00.000Z"),
  updatedAt: new Date("2026-09-01T10:00:00.000Z"),
  propertyGuardMembership: membership,
  providerMembership: { id: "provider-membership-id", provider },
} satisfies ProviderGuardAssignmentRecord;

describe("normalized Guard privacy mappers", () => {
  it("masks contact data in shared memberships", () => {
    assert.equal(maskEmail(guard.email), "g***@example.com");
    assert.equal(maskPhone(guard.phone), "+880171****678");
    const result = toGuardMembership(membership);
    assert.equal(result.guard.emailMasked, "g***@example.com");
    assert.equal("email" in result.guard, false);
  });

  it("shows provider scope without exposing raw Guard contact details", () => {
    const result = toProviderGuardAssignment(assignment);
    assert.equal(result.providerMembershipId, "provider-membership-id");
    assert.equal(result.provider.fullName, "Parking Provider");
    assert.equal(result.shiftStart, "08:00");
    assert.equal("email" in result.guard, false);
  });
});
