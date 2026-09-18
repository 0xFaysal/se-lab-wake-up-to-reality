import type { z } from "zod";
import type {
  createPropertySchema,
  propertyDuplicateMatchSchema,
  updatePropertySchema,
} from "./property.schema.js";

export type CreatePropertyInput = z.infer<typeof createPropertySchema>["body"];
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>["body"];
export type PropertyDuplicateMatchInput = z.infer<
  typeof propertyDuplicateMatchSchema
>["body"];
