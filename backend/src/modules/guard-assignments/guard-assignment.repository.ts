import { Prisma } from "../../../generated/prisma/client.js";

export const guardMembershipInclude = {
  property: { select: { id: true, name: true, publicArea: true } },
  guard: { select: { id: true, fullName: true, email: true, phone: true } },
} satisfies Prisma.PropertyGuardMembershipInclude;

export const providerGuardAssignmentInclude = {
  propertyGuardMembership: {
    include: {
      property: { select: { id: true, name: true, publicArea: true } },
      guard: { select: { id: true, fullName: true, email: true, phone: true } },
    },
  },
  providerMembership: {
    select: { id: true, provider: { select: { id: true, fullName: true } } },
  },
} satisfies Prisma.ProviderGuardAssignmentInclude;

export type GuardMembershipRecord = Prisma.PropertyGuardMembershipGetPayload<{
  include: typeof guardMembershipInclude;
}>;
export type ProviderGuardAssignmentRecord = Prisma.ProviderGuardAssignmentGetPayload<{
  include: typeof providerGuardAssignmentInclude;
}>;
