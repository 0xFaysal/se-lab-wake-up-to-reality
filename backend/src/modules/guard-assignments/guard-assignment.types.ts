import type { z } from "zod";
import type {
  createGuardInvitationSchema,
  listGuardAssignmentsQuerySchema,
  listOwnerGuardAssignmentsQuerySchema,
  updateGuardAssignmentSchema,
} from "./guard-assignment.schema.js";

export type CreateGuardInvitationInput = z.infer<
  typeof createGuardInvitationSchema
>["body"];

export type UpdateGuardAssignmentInput = z.infer<
  typeof updateGuardAssignmentSchema
>["body"];

export type ListOwnerGuardAssignmentsQuery = z.infer<
  typeof listOwnerGuardAssignmentsQuerySchema
>["query"];

export type ListGuardAssignmentsQuery = z.infer<
  typeof listGuardAssignmentsQuerySchema
>["query"];
