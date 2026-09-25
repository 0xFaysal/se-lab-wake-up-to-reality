import type { z } from "zod";
import type {
  buildingManagerNominationSchema,
  commonRulesSchema,
  governanceVoteSchema,
  membershipVerificationSchema,
  propertyChangeProposalSchema,
  temporaryClosureSchema,
} from "./property-governance.schema.js";

export type BuildingManagerNominationInput = z.infer<
  typeof buildingManagerNominationSchema
>["body"];
export type GovernanceVoteInput = z.infer<typeof governanceVoteSchema>["body"];
export type CommonRulesInput = z.infer<typeof commonRulesSchema>["body"];
export type TemporaryClosureInput = z.infer<
  typeof temporaryClosureSchema
>["body"];
export type PropertyChangeProposalInput = z.infer<
  typeof propertyChangeProposalSchema
>["body"];
export type MembershipVerificationInput = z.infer<
  typeof membershipVerificationSchema
>["body"];
