import { GuardAssignmentStatus } from "../../../generated/prisma/client.js";

export const nonTerminalGuardAssignmentStatuses = [
  GuardAssignmentStatus.PENDING_ACCEPTANCE,
  GuardAssignmentStatus.ACTIVE,
  GuardAssignmentStatus.SUSPENDED,
] as const;

const nonTerminalStatusSet = new Set<GuardAssignmentStatus>(
  nonTerminalGuardAssignmentStatuses,
);

export function canAcceptAssignment(status: GuardAssignmentStatus): boolean {
  return status === GuardAssignmentStatus.PENDING_ACCEPTANCE;
}

export function canRejectAssignment(status: GuardAssignmentStatus): boolean {
  return status === GuardAssignmentStatus.PENDING_ACCEPTANCE;
}

export function canSuspendAssignment(status: GuardAssignmentStatus): boolean {
  return status === GuardAssignmentStatus.ACTIVE;
}

export function canResumeAssignment(status: GuardAssignmentStatus): boolean {
  return status === GuardAssignmentStatus.SUSPENDED;
}

export function canCancelAssignment(status: GuardAssignmentStatus): boolean {
  return status === GuardAssignmentStatus.PENDING_ACCEPTANCE;
}

export function canEndAssignment(status: GuardAssignmentStatus): boolean {
  return (
    status === GuardAssignmentStatus.ACTIVE ||
    status === GuardAssignmentStatus.SUSPENDED
  );
}

export function canEditShift(status: GuardAssignmentStatus): boolean {
  return nonTerminalStatusSet.has(status);
}

export function requiresReacceptance(status: GuardAssignmentStatus): boolean {
  return (
    status === GuardAssignmentStatus.ACTIVE ||
    status === GuardAssignmentStatus.SUSPENDED
  );
}
