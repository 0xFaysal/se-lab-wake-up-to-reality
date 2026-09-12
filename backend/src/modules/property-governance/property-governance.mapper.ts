import type {
  PropertyBuildingManagerAssignment,
  PropertyBuildingManagerVote,
  PropertyChangeProposal,
  PropertyChangeVote,
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
    votes?: Array<
      Pick<
        PropertyBuildingManagerVote,
        | "providerMembershipId"
        | "voterUserId"
        | "decision"
        | "reason"
        | "createdAt"
      >
    >;
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
    ...(assignment.votes ? { votes: assignment.votes } : {}),
  };
}

export function toPropertyChangeProposalDto(
  proposal: PropertyChangeProposal & {
    votes?: Array<
      Pick<
        PropertyChangeVote,
        | "providerMembershipId"
        | "voterUserId"
        | "decision"
        | "reason"
        | "createdAt"
      >
    >;
  },
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
    ...(proposal.votes ? { votes: proposal.votes } : {}),
  };
}
