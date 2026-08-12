import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GuardAssignmentStatus } from "../../../generated/prisma/client.js";
import {
  canAcceptAssignment,
  canCancelAssignment,
  canEditShift,
  canEndAssignment,
  canRejectAssignment,
  canResumeAssignment,
  canSuspendAssignment,
  requiresReacceptance,
} from "../../../src/modules/guard-assignments/guard-assignment.policy.js";

describe("Guard assignment transition policy", () => {
  it("allows only the documented state transitions", () => {
    assert.equal(
      canAcceptAssignment(GuardAssignmentStatus.PENDING_ACCEPTANCE),
      true,
    );
    assert.equal(
      canRejectAssignment(GuardAssignmentStatus.PENDING_ACCEPTANCE),
      true,
    );
    assert.equal(
      canCancelAssignment(GuardAssignmentStatus.PENDING_ACCEPTANCE),
      true,
    );
    assert.equal(canSuspendAssignment(GuardAssignmentStatus.ACTIVE), true);
    assert.equal(canResumeAssignment(GuardAssignmentStatus.SUSPENDED), true);
    assert.equal(canEndAssignment(GuardAssignmentStatus.ACTIVE), true);
    assert.equal(canEndAssignment(GuardAssignmentStatus.SUSPENDED), true);
  });

  it("keeps ENDED and CANCELLED assignments terminal", () => {
    for (const status of [
      GuardAssignmentStatus.ENDED,
      GuardAssignmentStatus.CANCELLED,
    ]) {
      assert.equal(canAcceptAssignment(status), false);
      assert.equal(canSuspendAssignment(status), false);
      assert.equal(canResumeAssignment(status), false);
      assert.equal(canEditShift(status), false);
      assert.equal(canEndAssignment(status), false);
    }
  });

  it("requires consent again after an accepted shift changes", () => {
    assert.equal(requiresReacceptance(GuardAssignmentStatus.ACTIVE), true);
    assert.equal(requiresReacceptance(GuardAssignmentStatus.SUSPENDED), true);
    assert.equal(
      requiresReacceptance(GuardAssignmentStatus.PENDING_ACCEPTANCE),
      false,
    );
  });
});
