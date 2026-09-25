import type { z } from "zod";
import type {
  addPropertyGuardSchema,
  createProviderGuardAssignmentSchema,
  listGuardAssignmentsQuerySchema,
  listGuardMembershipsQuerySchema,
  updateGuardAssignmentSchema,
} from "./guard-assignment.schema.js";

export type AddPropertyGuardInput = z.infer<
  typeof addPropertyGuardSchema
>["body"];
export type CreateProviderGuardAssignmentInput = z.infer<
  typeof createProviderGuardAssignmentSchema
>["body"];
export type UpdateGuardAssignmentInput = z.infer<
  typeof updateGuardAssignmentSchema
>["body"];
export type ListGuardAssignmentsQuery = z.infer<
  typeof listGuardAssignmentsQuerySchema
>["query"];
export type ListGuardMembershipsQuery = z.infer<
  typeof listGuardMembershipsQuerySchema
>["query"];
export type CreateGuardInvitationInput = AddPropertyGuardInput;
export type ListOwnerGuardAssignmentsQuery = ListGuardAssignmentsQuery;
