import type {
  GuardMembershipRecord,
  ProviderGuardAssignmentRecord,
} from "./guard-assignment.repository.js";

function formatShiftTime(value: Date | null): string | null {
  if (!value) return null;
  return `${value.getUTCHours().toString().padStart(2, "0")}:${value.getUTCMinutes().toString().padStart(2, "0")}`;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  return `${local?.slice(0, 1) ?? ""}***@${domain ?? ""}`;
}

export function maskPhone(phone: string): string {
  return `${phone.slice(0, Math.max(0, phone.length - 7))}****${phone.slice(-3)}`;
}

export function toGuardMembership(record: GuardMembershipRecord) {
  return {
    id: record.id,
    status: record.status,
    property: record.property,
    guard: {
      id: record.guard.id,
      fullName: record.guard.fullName,
      emailMasked: maskEmail(record.guard.email),
      phoneMasked: maskPhone(record.guard.phone),
    },
    invitedAt: record.invitedAt,
    joinedAt: record.joinedAt,
    endedAt: record.endedAt,
  };
}

export function toProviderGuardAssignment(
  record: ProviderGuardAssignmentRecord,
) {
  return {
    id: record.id,
    status: record.status,
    property: record.propertyGuardMembership.property,
    providerMembershipId: record.providerMembership.id,
    provider: record.providerMembership.provider,
    guardMembershipId: record.propertyGuardMembership.id,
    guard: {
      id: record.propertyGuardMembership.guard.id,
      fullName: record.propertyGuardMembership.guard.fullName,
      emailMasked: maskEmail(record.propertyGuardMembership.guard.email),
      phoneMasked: maskPhone(record.propertyGuardMembership.guard.phone),
    },
    shiftStart: formatShiftTime(record.shiftStart),
    shiftEnd: formatShiftTime(record.shiftEnd),
    assignedAt: record.assignedAt,
    endedAt: record.endedAt,
  };
}

export const toOwnerGuardAssignment = toProviderGuardAssignment;
export const toGuardAssignment = toProviderGuardAssignment;
