import type { z } from "zod";
import type { reorderPropertyImagesSchema } from "./property-image.schema.js";

export type ReorderPropertyImagesInput = z.infer<
  typeof reorderPropertyImagesSchema
>["body"];
