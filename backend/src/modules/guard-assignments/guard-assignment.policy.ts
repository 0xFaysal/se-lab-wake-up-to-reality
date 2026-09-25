import {
  GuardAssignmentStatus,
  PropertyGuardMembershipStatus,
} from "../../../generated/prisma/client.js";

export const canAcceptGuardMembership = (
  status: PropertyGuardMembershipStatus,
) => status === PropertyGuardMembershipStatus.PENDING_ACCEPTANCE;
export const canRejectGuardMembership = canAcceptGuardMembership;

export const canSuspendProviderAssignment = (status: GuardAssignmentStatus) =>
  status === GuardAssignmentStatus.ACTIVE;
export const canResumeProviderAssignment = (status: GuardAssignmentStatus) =>
  status === GuardAssignmentStatus.SUSPENDED;
export const canEditProviderAssignmentShift = (status: GuardAssignmentStatus) =>
  status === GuardAssignmentStatus.ACTIVE ||
  status === GuardAssignmentStatus.SUSPENDED;
export const canEndProviderAssignment = canEditProviderAssignmentShift;
