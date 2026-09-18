import type { z } from "zod";
import type {
  createManagerDelegationSchema,
  updateManagerDelegationPermissionsSchema,
} from "./manager-delegation.schema.js";

export type CreateManagerDelegationInput = z.infer<
  typeof createManagerDelegationSchema
>["body"];
export type UpdateManagerDelegationPermissionsInput = z.infer<
  typeof updateManagerDelegationPermissionsSchema
>["body"];
