import type { z } from "zod";
import type {
  pendingAdminPropertiesSchema,
  verifyAdminPropertySchema,
} from "./admin-property.schema.js";

export type PendingAdminPropertiesQuery = z.infer<
  typeof pendingAdminPropertiesSchema
>["query"];

export type VerifyAdminPropertyInput = z.infer<
  typeof verifyAdminPropertySchema
>["body"];
