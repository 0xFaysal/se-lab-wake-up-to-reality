import type {
  PropertyBuildingManagerAssignment,
  PropertyChangeProposal,
  PropertyProvider,
} from "../../../generated/prisma/client.js";

export function toProviderMembershipDto(membership: PropertyProvider) {
  return {
    id: membership.id,
    propertyId: membership.propertyId,
    providerUserId: membership.providerUserId,
    status: membership.status,
    verificationStatus: membership.verificationStatus,
    joinedAt: membership.joinedAt,
    verifiedAt: membership.verifiedAt,
    rejectionReason: membership.rejectionReason,
    endedAt: membership.endedAt,
  };
}

export function toBuildingManagerDto(
  assignment: PropertyBuildingManagerAssignment & {
    candidate?: { id: string; fullName: string };
  },
) {
  return {
    id: assignment.id,
    propertyId: assignment.propertyId,
    status: assignment.status,
    candidate: assignment.candidate ?? { id: assignment.candidateUserId },
    nominatedAt: assignment.nominatedAt,
    activatedAt: assignment.activatedAt,
    endedAt: assignment.endedAt,
  };
}

export function toPropertyChangeProposalDto(
  proposal: PropertyChangeProposal,
  proposedChanges: unknown,
) {
  return {
    id: proposal.id,
    propertyId: proposal.propertyId,
    proposedByUserId: proposal.proposedByUserId,
    basePropertyVersion: proposal.basePropertyVersion,
    changeType: proposal.changeType,
    proposedChanges,
    status: proposal.status,
    resolvedAt: proposal.resolvedAt,
    appliedAt: proposal.appliedAt,
    createdAt: proposal.createdAt,
    updatedAt: proposal.updatedAt,
  };
}
