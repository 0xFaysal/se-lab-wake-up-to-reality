import type { GuardAssignmentRecord } from "./guard-assignment.repository.js";

function formatShiftTime(value: Date | null): string | null {
  if (!value) return null;
  const hours = value.getUTCHours().toString().padStart(2, "0");
  const minutes = value.getUTCMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  return `${local?.slice(0, 1) ?? ""}***@${domain ?? ""}`;
}

export function maskPhone(phone: string): string {
  const visiblePrefixLength = Math.min(6, Math.max(0, phone.length - 3));
  const hiddenLength = Math.max(3, phone.length - visiblePrefixLength - 3);
  return `${phone.slice(0, visiblePrefixLength)}${"*".repeat(hiddenLength)}${phone.slice(-3)}`;
}

function assignmentFields(assignment: GuardAssignmentRecord) {
  return {
    id: assignment.id,
    status: assignment.status,
    shiftStart: formatShiftTime(assignment.shiftStart),
    shiftEnd: formatShiftTime(assignment.shiftEnd),
    invitedAt: assignment.invitedAt,
    acceptedAt: assignment.acceptedAt,
    assignedAt: assignment.assignedAt,
    endedAt: assignment.endedAt,
    createdAt: assignment.createdAt,
    updatedAt: assignment.updatedAt,
  };
}

export function toOwnerGuardAssignment(assignment: GuardAssignmentRecord) {
  return {
    ...assignmentFields(assignment),
    property: {
      id: assignment.property.id,
      name: assignment.property.name,
    },
    guard: {
      id: assignment.guard.id,
      fullName: assignment.guard.fullName,
      emailMasked: maskEmail(assignment.guard.email),
      phoneMasked: maskPhone(assignment.guard.phone),
    },
  };
}

export function toGuardAssignment(assignment: GuardAssignmentRecord) {
  return {
    ...assignmentFields(assignment),
    property: {
      id: assignment.property.id,
      name: assignment.property.name,
      publicArea: assignment.property.publicArea,
    },
    owner: {
      id: assignment.property.owner.id,
      fullName: assignment.property.owner.fullName,
    },
  };
}
