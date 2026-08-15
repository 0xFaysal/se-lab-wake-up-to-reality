import {
  GuardAssignmentStatus,
  Prisma,
} from "../../../generated/prisma/client.js";
import { normalizeBangladeshPhone } from "../../common/auth/phone.js";
import { prisma } from "../../config/prisma.js";
import { propertyErrors } from "../properties/property.errors.js";
import * as propertyRepository from "../properties/property.repository.js";
import { guardAssignmentErrors } from "./guard-assignment.errors.js";
import {
  toGuardAssignment,
  toOwnerGuardAssignment,
} from "./guard-assignment.mapper.js";
import {
  canCancelAssignment,
  canAcceptAssignment,
  canEditShift,
  canEndAssignment,
  canRejectAssignment,
  canResumeAssignment,
  canSuspendAssignment,
  requiresReacceptance,
} from "./guard-assignment.policy.js";
import * as repository from "./guard-assignment.repository.js";
import type {
  CreateGuardInvitationInput,
  ListGuardAssignmentsQuery,
  ListOwnerGuardAssignmentsQuery,
  UpdateGuardAssignmentInput,
} from "./guard-assignment.types.js";

function parseIdentifier(identifier: string): {
  type: "email" | "phone";
  value: string;
} {
  const normalized = identifier.trim().toLowerCase();
  if (normalized.includes("@")) return { type: "email", value: normalized };

  try {
    return { type: "phone", value: normalizeBangladeshPhone(identifier) };
  } catch {
    throw guardAssignmentErrors.guardNotFound();
  }
}

export function shiftTimeToDate(value: string): Date {
  const [hours, minutes] = value.split(":").map(Number);
  return new Date(Date.UTC(1970, 0, 1, hours!, minutes!, 0, 0));
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function pagination(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export async function inviteGuard(
  ownerUserId: string,
  propertyId: string,
  input: CreateGuardInvitationInput,
) {
  try {
    const assignment = await prisma.$transaction(async (tx) => {
      await propertyRepository.lockPropertyForMutation(propertyId, tx);
      const property = await repository.findOwnedPropertyForGuardInvitation(
        propertyId,
        ownerUserId,
        tx,
      );
      if (!property) throw propertyErrors.notFound();
      if (!repository.propertyIsGuardEligible(property)) {
        throw guardAssignmentErrors.propertyNotEligible();
      }

      const guard = await repository.findEligibleGuard(
        parseIdentifier(input.identifier),
        tx,
      );
      if (!guard) throw guardAssignmentErrors.guardNotFound();

      const existing = await repository.findNonTerminalAssignment(
        propertyId,
        guard.id,
        tx,
      );
      if (existing) throw guardAssignmentErrors.alreadyExists();

      return repository.createGuardAssignment(
        {
          propertyId,
          guardUserId: guard.id,
          createdByUserId: ownerUserId,
          status: GuardAssignmentStatus.PENDING_ACCEPTANCE,
          shiftStart: shiftTimeToDate(input.shiftStart),
          shiftEnd: shiftTimeToDate(input.shiftEnd),
        },
        tx,
      );
    });

    return toOwnerGuardAssignment(assignment);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw guardAssignmentErrors.alreadyExists();
    }
    throw error;
  }
}

export async function listOwnerAssignments(
  ownerUserId: string,
  query: ListOwnerGuardAssignmentsQuery,
) {
  const skip = (query.page - 1) * query.limit;
  const filters = {
    ...(query.propertyId ? { propertyId: query.propertyId } : {}),
    ...(query.status ? { status: query.status } : {}),
  };
  const [records, total] = await Promise.all([
    repository.findOwnerAssignments(ownerUserId, filters, skip, query.limit),
    repository.countOwnerAssignments(ownerUserId, filters),
  ]);
  return {
    assignments: records.map(toOwnerGuardAssignment),
    pagination: pagination(query.page, query.limit, total),
  };
}

export async function getOwnerAssignment(
  ownerUserId: string,
  assignmentId: string,
) {
  const assignment = await repository.findOwnerAssignmentById(
    assignmentId,
    ownerUserId,
  );
  if (!assignment) throw guardAssignmentErrors.notFound();
  return toOwnerGuardAssignment(assignment);
}

export async function updateOwnerAssignment(
  ownerUserId: string,
  assignmentId: string,
  input: UpdateGuardAssignmentInput,
) {
  return prisma.$transaction(async (tx) => {
    const existing = await repository.findOwnerAssignmentById(
      assignmentId,
      ownerUserId,
      tx,
    );
    if (!existing) throw guardAssignmentErrors.notFound();

    if (input.action === "SUSPEND") {
      if (!canSuspendAssignment(existing.status)) {
        throw guardAssignmentErrors.invalidTransition();
      }
      const updated = await repository.updateAssignmentConditionally(
        assignmentId,
        GuardAssignmentStatus.ACTIVE,
        { status: GuardAssignmentStatus.SUSPENDED },
        { ownerUserId },
        tx,
      );
      if (updated.count !== 1) throw guardAssignmentErrors.stateConflict();
    } else if (input.action === "RESUME") {
      if (!canResumeAssignment(existing.status)) {
        throw guardAssignmentErrors.invalidTransition();
      }
      const updated = await repository.updateAssignmentConditionally(
        assignmentId,
        GuardAssignmentStatus.SUSPENDED,
        { status: GuardAssignmentStatus.ACTIVE },
        { ownerUserId },
        tx,
      );
      if (updated.count !== 1) throw guardAssignmentErrors.stateConflict();
    } else {
      if (!canEditShift(existing.status)) {
        throw guardAssignmentErrors.invalidTransition();
      }
      const reacceptance = requiresReacceptance(existing.status);
      const updated = await repository.updateAssignmentConditionally(
        assignmentId,
        existing.status,
        {
          shiftStart: shiftTimeToDate(input.shiftStart),
          shiftEnd: shiftTimeToDate(input.shiftEnd),
          invitedAt: new Date(),
          ...(reacceptance
            ? {
                status: GuardAssignmentStatus.PENDING_ACCEPTANCE,
                acceptedAt: null,
                assignedAt: null,
                endedAt: null,
              }
            : {}),
        },
        { ownerUserId },
        tx,
      );
      if (updated.count !== 1) throw guardAssignmentErrors.stateConflict();
    }

    const result = await repository.findOwnerAssignmentById(
      assignmentId,
      ownerUserId,
      tx,
    );
    if (!result) throw guardAssignmentErrors.stateConflict();
    return toOwnerGuardAssignment(result);
  });
}

export async function endOwnerAssignment(
  ownerUserId: string,
  assignmentId: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existing = await repository.findOwnerAssignmentById(
      assignmentId,
      ownerUserId,
      tx,
    );
    if (!existing) throw guardAssignmentErrors.notFound();

    const targetStatus = canCancelAssignment(existing.status)
      ? GuardAssignmentStatus.CANCELLED
      : canEndAssignment(existing.status)
        ? GuardAssignmentStatus.ENDED
        : null;
    if (!targetStatus) throw guardAssignmentErrors.invalidTransition();

    const updated = await repository.updateAssignmentConditionally(
      assignmentId,
      existing.status,
      { status: targetStatus, endedAt: new Date() },
      { ownerUserId },
      tx,
    );
    if (updated.count !== 1) throw guardAssignmentErrors.stateConflict();
  });
}

export async function listGuardAssignments(
  guardUserId: string,
  query: ListGuardAssignmentsQuery,
) {
  const skip = (query.page - 1) * query.limit;
  const [records, total] = await Promise.all([
    repository.findGuardAssignments(
      guardUserId,
      query.status,
      skip,
      query.limit,
    ),
    repository.countGuardAssignments(guardUserId, query.status),
  ]);
  return {
    assignments: records.map(toGuardAssignment),
    pagination: pagination(query.page, query.limit, total),
  };
}

export async function getGuardAssignment(
  guardUserId: string,
  assignmentId: string,
) {
  const assignment = await repository.findGuardAssignmentById(
    assignmentId,
    guardUserId,
  );
  if (!assignment) throw guardAssignmentErrors.notFound();
  return toGuardAssignment(assignment);
}

async function transitionPendingGuardAssignment(
  guardUserId: string,
  assignmentId: string,
  action: "ACCEPT" | "REJECT",
) {
  return prisma.$transaction(async (tx) => {
    const existing = await repository.findGuardAssignmentById(
      assignmentId,
      guardUserId,
      tx,
    );
    if (!existing) throw guardAssignmentErrors.notFound();
    const transitionAllowed =
      action === "ACCEPT"
        ? canAcceptAssignment(existing.status)
        : canRejectAssignment(existing.status);
    if (!transitionAllowed) {
      throw guardAssignmentErrors.invalidTransition();
    }

    if (action === "ACCEPT") {
      if (
        existing.guard.status !== "ACTIVE" ||
        existing.guard.deletedAt !== null ||
        existing.guard.mustChangePassword ||
        existing.guard.emailVerifiedAt === null
      ) {
        throw guardAssignmentErrors.guardNotEligible();
      }
      if (
        existing.property.status !== "ACTIVE" ||
        existing.property.verificationStatus !== "VERIFIED" ||
        existing.property.deletedAt !== null
      ) {
        throw guardAssignmentErrors.propertyNotEligible();
      }
    }

    const now = new Date();
    const updated = await repository.updateAssignmentConditionally(
      assignmentId,
      GuardAssignmentStatus.PENDING_ACCEPTANCE,
      action === "ACCEPT"
        ? {
            status: GuardAssignmentStatus.ACTIVE,
            acceptedAt: now,
            assignedAt: now,
            endedAt: null,
          }
        : {
            status: GuardAssignmentStatus.CANCELLED,
            endedAt: now,
          },
      {
        guardUserId,
        ...(action === "ACCEPT"
          ? { requireReadyGuard: true, requireEligibleProperty: true }
          : {}),
      },
      tx,
    );
    if (updated.count !== 1) throw guardAssignmentErrors.stateConflict();

    const result = await repository.findGuardAssignmentById(
      assignmentId,
      guardUserId,
      tx,
    );
    if (!result) throw guardAssignmentErrors.stateConflict();
    return toGuardAssignment(result);
  });
}

export function acceptGuardAssignment(
  guardUserId: string,
  assignmentId: string,
) {
  return transitionPendingGuardAssignment(guardUserId, assignmentId, "ACCEPT");
}

export function rejectGuardAssignment(
  guardUserId: string,
  assignmentId: string,
) {
  return transitionPendingGuardAssignment(guardUserId, assignmentId, "REJECT");
}
