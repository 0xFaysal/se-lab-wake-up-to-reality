import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GuardAssignmentStatus, PropertyGuardMembershipStatus } from "../../../generated/prisma/client.js";
import { canAcceptGuardMembership, canEditProviderAssignmentShift, canEndProviderAssignment, canRejectGuardMembership, canResumeProviderAssignment, canSuspendProviderAssignment } from "../../../src/modules/guard-assignments/guard-assignment.policy.js";

describe("normalized Guard lifecycle policy", () => {
  it("keeps Property membership consent separate", () => {
    assert.equal(canAcceptGuardMembership(PropertyGuardMembershipStatus.PENDING_ACCEPTANCE), true);
    assert.equal(canRejectGuardMembership(PropertyGuardMembershipStatus.PENDING_ACCEPTANCE), true);
    assert.equal(canAcceptGuardMembership(PropertyGuardMembershipStatus.ACTIVE), false);
  });

  it("allows only non-terminal provider assignment transitions", () => {
    assert.equal(canSuspendProviderAssignment(GuardAssignmentStatus.ACTIVE), true);
    assert.equal(canResumeProviderAssignment(GuardAssignmentStatus.SUSPENDED), true);
    assert.equal(canEditProviderAssignmentShift(GuardAssignmentStatus.ACTIVE), true);
    assert.equal(canEndProviderAssignment(GuardAssignmentStatus.SUSPENDED), true);
    assert.equal(canEndProviderAssignment(GuardAssignmentStatus.ENDED), false);
    assert.equal(canEndProviderAssignment(GuardAssignmentStatus.CANCELLED), false);
  });
});
